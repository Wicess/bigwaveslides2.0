"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { buildMediaKey, r2PutObject } from "@/lib/r2";
import { invoiceNumber } from "@/lib/ref-number";
import {
  amountDueCents,
  cryptoDiscountCents,
  discountLabelFor,
  effectiveTotalCents,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { resolvePaymentDetails } from "@/lib/payment-methods";
import { formatPrice } from "@/lib/format";
import { notifyAdminNtfy } from "@/lib/ntfy";
import { siteUrl } from "@/lib/email";
import {
  sendInvoiceIssuedEmails,
  sendPaymentDetailsEmail,
  notifyProofSubmitted,
} from "@/lib/notifications";

// -----------------------------------------------------------------------------
// The client-facing quote → invoice → payment journey. Every step here is
// mirrored three ways: persisted on the order, emailed to the client, and
// pushed to the owner's phone via ntfy — so nothing stalls silently.
// All actions are keyed by the unguessable order number (same trust model as
// the public contract-signing page).
// -----------------------------------------------------------------------------

type FlowResult = { ok: boolean; error?: string };

// localePrefix is "always" in i18n/routing.ts, so the real route is always
// /<locale>/order/<number> — including English.
const orderPath = (locale: string, number: string) =>
  `/${locale}/order/${number}`;

async function findOrder(number: string) {
  return prisma.order.findUnique({
    where: { orderNumber: number },
    include: { items: true },
  });
}

/* ───────────────── 1 · Accept quote → issue invoice ───────────────── */

const acceptSchema = z.object({ orderNumber: z.string().min(4) });

export async function acceptQuote(
  input: z.input<typeof acceptSchema>,
): Promise<FlowResult> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  try {
    const order = await findOrder(parsed.data.orderNumber);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.stage !== "QUOTE") return { ok: true }; // already accepted — idempotent

    const now = new Date();
    // Balance is due 48 hours before the event; without an event date we give
    // a 7-day window and settle the exact date with the client by email.
    const balanceDue = order.eventDate
      ? new Date(order.eventDate.getTime() - 48 * 60 * 60 * 1000)
      : null;
    const dueAt =
      balanceDue && balanceDue > now
        ? balanceDue
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        stage: "INVOICE",
        status: "PROCESSING",
        quoteAcceptedAt: now,
        invoiceNumber: order.invoiceNumber ?? invoiceNumber(),
        invoiceIssuedAt: now,
        invoiceDueAt: dueAt,
      },
      include: { items: true },
    });

    // The invoice PDF + email + owner push are slow (~seconds). Run them AFTER
    // the response is sent so the client lands on the invoice instantly instead
    // of watching a spinner. `after` keeps the work alive post-response.
    after(async () => {
      await sendInvoiceIssuedEmails(updated).catch((e) =>
        console.error("[order-flow] invoice email failed", e),
      );
      await notifyAdminNtfy({
        title: `✅ Quote ACCEPTED — ${updated.orderNumber}`,
        message: [
          `${updated.guestName ?? "Client"} accepted their quote.`,
          `Invoice ${updated.invoiceNumber} issued for ${formatPrice(updated.totalCents, updated.locale)}.`,
          "Waiting on their payment plan choice (50% deposit or full).",
        ].join("\n"),
        clickUrl: siteUrl(`/admin/orders/${updated.id}`),
        tags: ["white_check_mark", "ocean"],
        priority: 4,
      }).catch(() => {});
    });

    revalidatePath(orderPath(updated.locale, updated.orderNumber));
    return { ok: true };
  } catch (e) {
    console.error("[order-flow] acceptQuote", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/* ───────────────── 2 · Choose payment plan + rail ───────────────── */

const planSchema = z.object({
  orderNumber: z.string().min(4),
  plan: z.enum(["HALF", "FULL"]),
  method: z.string().min(1),
});

export type PlanResult = FlowResult & {
  /** true → details are on the order and visible now; false → awaiting owner. */
  hasDetails?: boolean;
};

export async function choosePaymentPlan(
  input: z.input<typeof planSchema>,
): Promise<PlanResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { plan, method } = parsed.data;

  try {
    const order = await findOrder(parsed.data.orderNumber);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.stage === "QUOTE")
      return { ok: false, error: "Please accept your quote first." };
    if (order.paymentDetailsState === "PAID")
      return { ok: false, error: "This invoice is already paid." };

    // Crypto earns 11.5% off the whole invoice; every amount downstream
    // (details, email, mark-paid) works from the discounted total.
    const payableCents = effectiveTotalCents(order.totalCents, method);
    const discountCents = cryptoDiscountCents(order.totalCents, method);
    const dueCents = amountDueCents(plan as PaymentPlan, payableCents);
    const reference = order.invoiceNumber ?? order.orderNumber;
    const resolved = await resolvePaymentDetails(method, {
      amountCents: dueCents,
      orderNumber: reference,
      locale: order.locale,
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentPlan: plan,
        paymentPlanAt: new Date(),
        paymentMethodKey: method,
        ...(resolved
          ? {
              paymentDetailsState: "DETAILS_SENT",
              paymentMethodLabel: resolved.methodLabel,
              paymentDestination: resolved.destination,
              paymentInstructions: resolved.instructions,
              paymentNetwork: resolved.network,
              paymentQrUrl: resolved.qrImageUrl,
            }
          : { paymentDetailsState: "AWAITING_DETAILS" }),
      },
      include: { items: true },
    });

    const planLabel =
      plan === "HALF"
        ? `50% deposit (${formatPrice(dueCents, order.locale)})`
        : `FULL payment (${formatPrice(dueCents, order.locale)})`;
    const discountNote = discountCents
      ? ` after ${discountLabelFor(method) ?? ""} instant-pay discount (−${formatPrice(discountCents, order.locale)})`
      : "";
    // Email + owner push run after the response so the client moves to the
    // secure payment page instantly.
    after(async () => {
      if (resolved) {
        await sendPaymentDetailsEmail(updated, dueCents).catch((e) =>
          console.error("[order-flow] payment details email failed", e),
        );
      }
      await notifyAdminNtfy({
        title: resolved
          ? `💳 ${order.orderNumber} — ${planLabel} via ${resolved.methodLabel}`
          : `⚠️ ${order.orderNumber} NEEDS payment details`,
        message: resolved
          ? [
              `${order.guestName ?? "Client"} chose ${planLabel}${discountNote}.`,
              `✅ ${resolved.methodLabel} details auto-sent (${resolved.destination}).`,
              "Watch for the payment, then mark the invoice paid.",
            ].join("\n")
          : [
              `${order.guestName ?? "Client"} chose ${planLabel} via "${method}".`,
              "⚠️ That rail has no destination configured — open the order and post the payment details NOW. The client is waiting on the payment page.",
            ].join("\n"),
        clickUrl: siteUrl(`/admin/orders/${order.id}`),
        tags: resolved
          ? ["credit_card", "ocean"]
          : ["warning", "rotating_light"],
        priority: resolved ? 4 : 5,
      }).catch(() => {});
    });

    revalidatePath(orderPath(order.locale, order.orderNumber));
    return { ok: true, hasDetails: Boolean(resolved) };
  } catch (e) {
    console.error("[order-flow] choosePaymentPlan", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/* ───────────────── 3 · Client submits payment proof ───────────────── */

const proofSchema = z.object({
  orderNumber: z.string().min(4),
  txId: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
  proofImageUrl: z.string().url().optional(),
});

/** Max screenshot size: 8 MB. */
const MAX_PROOF_BYTES = 8 * 1024 * 1024;

/**
 * Upload a payment-proof screenshot to R2 and return its public URL. Trust
 * model: keyed by the unguessable order number (like every action in this
 * file), plus an IP rate limit so the endpoint can't be abused as free
 * image hosting.
 */
export async function uploadProofScreenshot(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  // Anti-abuse: 5 uploads per IP per 10 minutes.
  const limit = rateLimit(
    clientKeyFromHeaders(await headers(), "proof-upload"),
    5,
    10 * 60 * 1000,
  );
  if (!limit.ok) {
    return {
      ok: false,
      error: "Too many uploads — please wait a few minutes and try again.",
    };
  }

  try {
    const orderNumber = formData.get("orderNumber");
    const file = formData.get("file");

    if (typeof orderNumber !== "string" || orderNumber.length < 4)
      return { ok: false, error: "Invalid request." };
    if (!(file instanceof Blob) || file.size === 0)
      return { ok: false, error: "Please choose an image to upload." };
    if (!file.type.startsWith("image/"))
      return { ok: false, error: "Only image files are accepted." };
    if (file.size > MAX_PROOF_BYTES)
      return { ok: false, error: "Image is too large — max 8 MB." };

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!order) return { ok: false, error: "Order not found." };

    const filename =
      (file instanceof File && file.name) || `proof-${orderNumber}.png`;
    const key = buildMediaKey("payment-proofs", filename);
    const { url } = await r2PutObject({
      key,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    return { ok: true, url };
  } catch (e) {
    console.error("[order-flow] uploadProofScreenshot", e);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

export async function submitPaymentProof(
  input: z.input<typeof proofSchema>,
): Promise<FlowResult> {
  const parsed = proofSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  try {
    const order = await findOrder(parsed.data.orderNumber);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.paymentDetailsState === "PAID") return { ok: true };

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentDetailsState: "PROOF_SUBMITTED",
        proofTxId: parsed.data.txId || null,
        proofNote: parsed.data.note || null,
        proofImageUrl: parsed.data.proofImageUrl || null,
        proofSubmittedAt: new Date(),
      },
      include: { items: true },
    });

    await notifyProofSubmitted(updated).catch(() => {});
    await notifyAdminNtfy({
      title: `💵 Payment proof — ${order.orderNumber}`,
      message: [
        `${order.guestName ?? "Client"} says they've paid${
          parsed.data.txId ? ` (ref: ${parsed.data.txId})` : ""
        }.`,
        `Plan: ${order.paymentPlan ?? "?"} · Method: ${order.paymentMethodLabel ?? order.paymentMethodKey ?? "?"}.`,
        ...(parsed.data.proofImageUrl
          ? [`📎 screenshot attached: ${parsed.data.proofImageUrl}`]
          : []),
        "Verify the money arrived, then mark the invoice paid in admin.",
      ].join("\n"),
      clickUrl: siteUrl(`/admin/orders/${order.id}`),
      tags: ["moneybag", "ocean"],
      priority: 5,
    });

    revalidatePath(orderPath(order.locale, order.orderNumber));
    return { ok: true };
  } catch (e) {
    console.error("[order-flow] submitPaymentProof", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
