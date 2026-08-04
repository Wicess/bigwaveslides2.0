"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addToLifetimeValue } from "@/lib/customers";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import {
  savePaymentMethods,
  buildInstructionsForMethod,
  loadPaymentMethods,
  resolvePaymentDetails,
} from "@/lib/payment-methods";
import {
  amountDueCents,
  effectiveTotalCents,
  type PaymentPlan,
} from "@/lib/payment-plan";
import {
  sendPaymentDetailsEmail,
  sendPaymentConfirmedEmail,
  sendProofRejectedEmail,
} from "@/lib/notifications";

export type AdminActionResult = { ok: boolean; error?: string };

/* ───────────── Payment rails editor (settings) ───────────── */

const railSchema = z.object({
  method: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits, and dashes."),
  label: z.string().min(1).max(60),
  destination: z.string().max(200).optional().or(z.literal("")),
  instructions: z.string().max(2000).optional().or(z.literal("")),
  network: z.string().max(120).optional().or(z.literal("")),
  qrImageUrl: z.string().url().optional().or(z.literal("")),
  enabled: z.boolean(),
});

export async function savePaymentRails(
  input: unknown,
): Promise<AdminActionResult & { synced?: number }> {
  const session = await requirePermission("settings.write");
  const parsed = z.array(railSchema).max(20).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  try {
    // Snapshot the rails as they were, so we only re-sync clients on rails that
    // actually changed.
    const before = await loadPaymentMethods();
    const beforeByMethod = new Map(before.map((r) => [r.method, r]));

    await savePaymentMethods(
      parsed.data.map((m, i) => ({
        method: m.method,
        label: m.label,
        destination: m.destination || "",
        instructions: m.instructions || "",
        network: m.network || null,
        qrImageUrl: m.qrImageUrl || null,
        enabled: m.enabled,
        sortOrder: i,
      })),
    );

    // Push the new details onto every not-yet-paid order that already chose a
    // changed rail — so the client's invoice page + account reflect the new
    // destination immediately (and they get an email if the destination moved,
    // so they never pay to a stale address).
    const synced = await resyncPendingOrdersForRails(
      parsed.data,
      beforeByMethod,
    );

    await logActivity(session.id, "settings.update", {
      entityType: "PaymentMethodConfig",
      summary: `Updated payment rails${synced ? ` · re-synced ${synced} pending order(s)` : ""}`,
    });
    revalidatePath("/admin/settings/payments");
    return { ok: true, synced };
  } catch (e) {
    console.error("[admin-payments] save rails", e);
    return { ok: false, error: "Couldn't save payment methods." };
  }
}

type SavedRail = z.infer<typeof railSchema>;

/** Re-issue payment details on unpaid orders whose rail's details changed.
    Returns how many orders were updated. */
async function resyncPendingOrdersForRails(
  rails: SavedRail[],
  before: Map<
    string,
    {
      destination: string;
      instructions: string;
      network: string | null;
      qrImageUrl: string | null;
      enabled: boolean;
      label: string;
    }
  >,
): Promise<number> {
  const changed = rails.filter((m) => {
    const o = before.get(m.method);
    if (!o) return Boolean(m.enabled);
    return (
      (o.destination ?? "") !== (m.destination || "") ||
      (o.instructions ?? "") !== (m.instructions || "") ||
      (o.network ?? "") !== (m.network || "") ||
      (o.qrImageUrl ?? "") !== (m.qrImageUrl || "") ||
      o.enabled !== m.enabled ||
      o.label !== m.label
    );
  });
  if (changed.length === 0) return 0;

  let synced = 0;
  for (const rail of changed) {
    const beforeDest = (before.get(rail.method)?.destination ?? "").trim();
    // Only orders that are past checkout and NOT paid — leave PAID and
    // PROOF_SUBMITTED (already paid to the old target, awaiting verification)
    // untouched.
    const affected = await prisma.order.findMany({
      where: {
        paymentMethodKey: rail.method,
        paymentDetailsState: {
          in: ["DETAILS_SENT", "AWAITING_DETAILS", "REJECTED"],
        },
      },
      include: { items: true },
    });
    for (const order of affected) {
      const plan = (order.paymentPlan as PaymentPlan | null) ?? "FULL";
      const dueCents = amountDueCents(
        plan,
        effectiveTotalCents(order.totalCents, rail.method),
      );
      const resolved = await resolvePaymentDetails(rail.method, {
        amountCents: dueCents,
        orderNumber: order.invoiceNumber ?? order.orderNumber,
        locale: order.locale,
      });
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: resolved
          ? {
              paymentDetailsState: "DETAILS_SENT",
              paymentMethodLabel: resolved.methodLabel,
              paymentDestination: resolved.destination,
              paymentInstructions: resolved.instructions,
              paymentNetwork: resolved.network,
              paymentQrUrl: resolved.qrImageUrl,
            }
          : // Rail was turned off or lost its destination → send it back to the
            // owner to post details by hand.
            { paymentDetailsState: "AWAITING_DETAILS" },
        include: { items: true },
      });
      // Email the corrected details only when the client already had details
      // AND the destination actually moved.
      if (
        resolved &&
        order.paymentDetailsState === "DETAILS_SENT" &&
        resolved.destination.trim() !== beforeDest
      ) {
        await sendPaymentDetailsEmail(updated, dueCents).catch((e) =>
          console.error("[admin-payments] resync email failed", e),
        );
      }
      revalidatePath(orderPublicPath(order.locale, order.orderNumber));
      revalidatePath(`/admin/orders/${order.id}`);
      synced++;
    }
  }
  return synced;
}

/* ───────────── Per-order payment actions ───────────── */

async function getOrderForPayment(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

// localePrefix is "always" in i18n/routing.ts, so the real route is always
// /<locale>/order/<number> — including English.
function orderPublicPath(locale: string, number: string): string {
  return `/${locale}/order/${number}`;
}

const postDetailsSchema = z.object({
  orderId: z.string().min(1),
  method: z.string().min(1),
  destination: z.string().min(2).max(200),
  qrImageUrl: z.string().url().optional().or(z.literal("")),
});

/** Owner posts payment details by hand for an order stuck AWAITING_DETAILS.
    Persists them and immediately emails the client — the invoice page they're
    watching reveals the details on its next poll (≤6s). */
export async function postOrderPaymentDetails(
  input: z.input<typeof postDetailsSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("order.update");
  const parsed = postDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  try {
    const order = await getOrderForPayment(parsed.data.orderId);
    if (!order) return { ok: false, error: "Order not found." };

    const plan = (order.paymentPlan as PaymentPlan | null) ?? "FULL";
    const dueCents = amountDueCents(
      plan,
      effectiveTotalCents(order.totalCents, order.paymentMethodKey),
    );
    const built = await buildInstructionsForMethod(
      parsed.data.method || order.paymentMethodKey || "zelle",
      {
        amountCents: dueCents,
        orderNumber: order.invoiceNumber ?? order.orderNumber,
        destination: parsed.data.destination,
        locale: order.locale,
      },
    );

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentDetailsState: "DETAILS_SENT",
        paymentMethodKey: parsed.data.method || order.paymentMethodKey,
        paymentMethodLabel: built.label,
        paymentDestination: parsed.data.destination,
        paymentInstructions: built.instructions,
        paymentNetwork: built.network,
        paymentQrUrl: parsed.data.qrImageUrl || null,
      },
      include: { items: true },
    });

    await sendPaymentDetailsEmail(updated, dueCents).catch((e) =>
      console.error("[admin-payments] details email failed", e),
    );
    await logActivity(session.id, "order.update", {
      entityType: "Order",
      entityId: order.id,
      summary: `Posted ${built.label} payment details for ${order.orderNumber}`,
    });

    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(orderPublicPath(order.locale, order.orderNumber));
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] post details", e);
    return { ok: false, error: "Couldn't post payment details." };
  }
}

const markPaidSchema = z.object({ orderId: z.string().min(1) });

/** Owner verified the money arrived → confirm the booking + email the client. */
export async function markOrderPaid(
  input: z.input<typeof markPaidSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("order.update");
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  try {
    const order = await getOrderForPayment(parsed.data.orderId);
    if (!order) return { ok: false, error: "Order not found." };

    const plan = (order.paymentPlan as PaymentPlan | null) ?? "FULL";
    const dueCents = amountDueCents(
      plan,
      effectiveTotalCents(order.totalCents, order.paymentMethodKey),
    );
    const fullyPaid = plan === "FULL";

    // Credit the amount actually received to the customer's lifetime value.
    const owner = await prisma.order.findUnique({
      where: { id: order.id },
      select: { customerId: true },
    });
    await addToLifetimeValue(owner?.customerId, dueCents);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentDetailsState: "PAID",
        paymentStatus: fullyPaid ? "PAID_IN_FULL" : "DEPOSIT_PAID",
        status: "PROCESSING",
        stage: "CONFIRMED",
        amountPaidCents: order.amountPaidCents + dueCents,
        paidAt: new Date(),
      },
      include: { items: true },
    });

    await sendPaymentConfirmedEmail(updated).catch((e) =>
      console.error("[admin-payments] confirm email failed", e),
    );
    await logActivity(session.id, "order.update", {
      entityType: "Order",
      entityId: order.id,
      summary: `Marked ${order.orderNumber} paid (${plan})`,
    });

    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(orderPublicPath(order.locale, order.orderNumber));
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] mark paid", e);
    return { ok: false, error: "Couldn't mark the order paid." };
  }
}

const rejectSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().max(500).optional().or(z.literal("")),
});

/** Proof didn't check out → let the client know and allow a resubmit. */
export async function rejectOrderProof(
  input: z.input<typeof rejectSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("order.update");
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  try {
    const order = await getOrderForPayment(parsed.data.orderId);
    if (!order) return { ok: false, error: "Order not found." };

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentDetailsState: "REJECTED" },
      include: { items: true },
    });

    await sendProofRejectedEmail(
      updated,
      parsed.data.reason || undefined,
    ).catch((e) => console.error("[admin-payments] reject email failed", e));
    await logActivity(session.id, "order.update", {
      entityType: "Order",
      entityId: order.id,
      summary: `Rejected payment proof on ${order.orderNumber}`,
    });

    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(orderPublicPath(order.locale, order.orderNumber));
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] reject proof", e);
    return { ok: false, error: "Couldn't reject the proof." };
  }
}

/* ───────────── Transportation fee toggle ───────────── */

const transportSchema = z.object({ enabled: z.boolean() });

/** Toggle the flat $30 transportation line on/off for all new quotes. */
export async function setTransportEnabled(
  input: z.input<typeof transportSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("settings.write");
  const parsed = transportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  try {
    const existing = await prisma.siteSetting.findUnique({
      where: { key: "fees" },
    });
    const fees =
      existing && typeof existing.value === "object" && existing.value !== null
        ? (existing.value as Record<string, unknown>)
        : {};
    const value = { ...fees, transportEnabled: parsed.data.enabled };
    await prisma.siteSetting.upsert({
      where: { key: "fees" },
      update: { value },
      create: { key: "fees", group: "fees", value },
    });
    revalidateTag("settings");
    await logActivity(session.id, "settings.update", {
      entityType: "SiteSetting",
      summary: `Transportation fee ${parsed.data.enabled ? "enabled" : "disabled"}`,
    });
    revalidatePath("/admin/settings/payments");
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] transport toggle", e);
    return { ok: false, error: "Couldn't update the transportation fee." };
  }
}

/* ───────────── Manual-invoice mode toggle ───────────── */

const manualModeSchema = z.object({ enabled: z.boolean() });

/** Toggle "manual invoice" mode. When ON, payment details are never revealed
    on-site — the client picks a plan + method, then sees their Invoice ID and
    instructions, and the owner sends the details by email / phone / WhatsApp. */
export async function setManualInvoiceMode(
  input: z.input<typeof manualModeSchema>,
): Promise<AdminActionResult> {
  const session = await requirePermission("settings.write");
  const parsed = manualModeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid data." };
  try {
    const existing = await prisma.siteSetting.findUnique({
      where: { key: "payment" },
    });
    const payment =
      existing && typeof existing.value === "object" && existing.value !== null
        ? (existing.value as Record<string, unknown>)
        : {};
    const value = { ...payment, manualInvoiceMode: parsed.data.enabled };
    await prisma.siteSetting.upsert({
      where: { key: "payment" },
      update: { value },
      create: { key: "payment", group: "payment", value },
    });
    revalidateTag("settings");
    await logActivity(session.id, "settings.update", {
      entityType: "SiteSetting",
      summary: `Manual invoice mode ${parsed.data.enabled ? "enabled" : "disabled"}`,
    });
    revalidatePath("/admin/settings/payments");
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] manual mode toggle", e);
    return { ok: false, error: "Couldn't update manual invoice mode." };
  }
}
