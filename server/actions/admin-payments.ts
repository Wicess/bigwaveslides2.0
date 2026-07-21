"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addToLifetimeValue } from "@/lib/customers";
import { requirePermission, logActivity } from "@/lib/admin-auth";
import {
  savePaymentMethods,
  buildInstructionsForMethod,
} from "@/lib/payment-methods";
import { amountDueCents, type PaymentPlan } from "@/lib/payment-plan";
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
): Promise<AdminActionResult> {
  const session = await requirePermission("settings.write");
  const parsed = z.array(railSchema).max(20).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  try {
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
    await logActivity(session.id, "settings.update", {
      entityType: "PaymentMethodConfig",
      summary: "Updated payment rails",
    });
    revalidatePath("/admin/settings/payments");
    return { ok: true };
  } catch (e) {
    console.error("[admin-payments] save rails", e);
    return { ok: false, error: "Couldn't save payment methods." };
  }
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
    const dueCents = amountDueCents(plan, order.totalCents);
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
    const dueCents = amountDueCents(plan, order.totalCents);
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
