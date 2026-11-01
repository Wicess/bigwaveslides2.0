"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requirePermission } from "@/lib/admin-auth";
import { effectiveTotalCents } from "@/lib/payment-plan";
import { sendOrderInvoiceToChat } from "@/lib/chat/order-invoice";

export type InvoiceEditResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

const cents = z.number().int().min(0).max(10_000_000);
const schema = z.object({
  orderId: z.string().min(5).max(60),
  items: z
    .array(
      z.object({
        id: z.string().max(60).optional(),
        name: z
          .string()
          .trim()
          .min(1, "Every line needs a description.")
          .max(200),
        quantity: z.number().int().min(1).max(999),
        unitPriceCents: cents,
      }),
    )
    .min(1, "An invoice needs at least one line.")
    .max(50),
  deliveryFeeCents: cents,
  discountCents: cents,
  invoiceNote: z.string().trim().max(500),
  reason: z
    .string()
    .trim()
    .min(3, "Say briefly why the invoice changed.")
    .max(300),
  sendToChat: z.boolean(),
});

/** Once money has moved, the invoice is a record; changing it then is a refund. */
const LOCKED_STATES = new Set(["PROOF_SUBMITTED", "PAID"]);
const LOCKED_PAYMENTS = new Set(["DEPOSIT_PAID", "PAID_IN_FULL"]);

/**
 * Edit an order's invoice: its lines, transport, discount and note. Totals are
 * recomputed in cents (an instant-pay method keeps its discount), the change is
 * written to the activity log with the before and after, and the updated invoice
 * image is posted to the customer's chat unless the owner unticks it.
 */
export async function editOrderInvoice(
  input: z.input<typeof schema>,
): Promise<InvoiceEditResult> {
  const session = await requirePermission("order.update");
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Check the invoice and try again.",
    };
  const d = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: d.orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (
    LOCKED_STATES.has(order.paymentDetailsState) ||
    LOCKED_PAYMENTS.has(order.paymentStatus)
  ) {
    return {
      ok: false,
      error:
        "This order has been paid, or payment proof is in. The invoice can't change now; use a refund instead.",
    };
  }

  const known = new Set(order.items.map((i) => i.id));
  if (d.items.some((i) => i.id && !known.has(i.id))) {
    return {
      ok: false,
      error: "The order changed while you were editing. Reload and try again.",
    };
  }

  const subtotalCents = d.items.reduce(
    (n, i) => n + i.unitPriceCents * i.quantity,
    0,
  );
  if (d.discountCents > subtotalCents + d.deliveryFeeCents) {
    return {
      ok: false,
      error: "The discount is more than the invoice. Lower it.",
    };
  }
  // The discount the customer earned at checkout stays labelled as loyalty; the
  // rest of what the owner enters is a plain discount.
  const loyaltyDiscountCents = Math.min(
    order.loyaltyDiscountCents,
    d.discountCents,
  );
  const promoDiscountCents = d.discountCents - loyaltyDiscountCents;
  const baseTotal = subtotalCents + d.deliveryFeeCents - d.discountCents;
  const totalCents = order.paymentMethodKey
    ? effectiveTotalCents(baseTotal, order.paymentMethodKey)
    : baseTotal;

  const kept = d.items.filter((i) => i.id).map((i) => i.id!);
  const before = {
    lines: order.items.map(
      (i) => `${i.quantity} x ${i.name} @ ${i.unitPriceCents}`,
    ),
    deliveryFeeCents: order.deliveryFeeCents,
    discountCents: order.loyaltyDiscountCents + order.promoDiscountCents,
    totalCents: order.totalCents,
    invoiceNote: order.invoiceNote,
  };
  const afterState = {
    lines: d.items.map(
      (i) => `${i.quantity} x ${i.name} @ ${i.unitPriceCents}`,
    ),
    deliveryFeeCents: d.deliveryFeeCents,
    discountCents: d.discountCents,
    totalCents,
    invoiceNote: d.invoiceNote || null,
  };

  await prisma.$transaction([
    prisma.orderItem.deleteMany({
      where: { orderId: order.id, id: { notIn: kept } },
    }),
    ...d.items
      .filter((i) => i.id)
      .map((i) =>
        prisma.orderItem.update({
          where: { id: i.id! },
          data: {
            name: i.name,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            lineTotalCents: i.unitPriceCents * i.quantity,
          },
        }),
      ),
    ...d.items
      .filter((i) => !i.id)
      .map((i) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            name: i.name,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            lineTotalCents: i.unitPriceCents * i.quantity,
          },
        }),
      ),
    prisma.order.update({
      where: { id: order.id },
      data: {
        subtotalCents,
        deliveryFeeCents: d.deliveryFeeCents,
        loyaltyDiscountCents,
        promoDiscountCents,
        totalCents,
        invoiceNote: d.invoiceNote || null,
      },
    }),
  ]);

  await logActivity(session.id, "order.invoice.edit", {
    entityType: "Order",
    entityId: order.id,
    summary: `Invoice for ${order.orderNumber} edited: ${d.reason}`,
    diff: { before, after: afterState },
  });

  if (d.sendToChat) {
    after(() =>
      sendOrderInvoiceToChat(order.id, { updated: true, reason: d.reason }),
    );
  }

  revalidatePath(`/admin/orders/${order.id}`);
  const resend =
    order.paymentDetailsState === "DETAILS_SENT"
      ? " Payment details were already sent; post them again so the customer pays the new amount."
      : "";
  return {
    ok: true,
    message: `Saved. New total $${(totalCents / 100).toFixed(2)}.${d.sendToChat ? " The updated invoice is being posted to the customer's chat." : ""}${resend}`,
  };
}

/** Post the current invoice to the customer's chat again, unchanged. */
export async function resendOrderInvoice(
  orderId: string,
): Promise<InvoiceEditResult> {
  const session = await requirePermission("order.update");
  const posted = await sendOrderInvoiceToChat(orderId, {});
  await logActivity(session.id, "order.invoice.send", {
    entityType: "Order",
    entityId: orderId,
    summary: posted ? "Invoice posted to chat" : "Invoice not posted (no chat)",
  });
  return posted
    ? { ok: true, message: "The invoice is in the customer's chat." }
    : {
        ok: false,
        error:
          "No chat found for this customer's email yet, so there was nowhere to post it.",
      };
}
