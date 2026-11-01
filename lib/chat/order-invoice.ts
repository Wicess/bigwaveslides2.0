import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { InvoiceModel } from "@/lib/invoice-image";
import { renderInvoiceImage } from "@/lib/invoice-render";
import { amountDueCents, type PaymentPlan } from "@/lib/payment-plan";
import { formatPrice } from "@/lib/format";
import { ensureThread, postMessage } from "@/lib/chat/core";
import { keys, putObject } from "@/lib/chat/storage";
import { reportError } from "@/lib/chat/report-error";
import { BRAND } from "@/lib/chat/brand";

/**
 * The invoice, in the customer's chat (owner, 2026-11-01).
 *
 * When an order is placed, the invoice image (lib/invoice-render.tsx, the same
 * drawing the admin invoice tool makes) is posted into the customer's chat on the
 * site, with every detail of the reservation: items, quantities and prices,
 * transport, discounts, the event date, the delivery address, the payment plan and
 * method, and what is due now. When the owner edits the invoice in the admin, the
 * updated one is posted the same way.
 */

const day = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

type OrderForInvoice = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { id: "asc" } },
      customer: { select: { email: true, name: true } },
    },
  });
}

/** The invoice model for an order, matching its stored totals to the cent. */
export function invoiceModelFor(order: OrderForInvoice): InvoiceModel {
  const items = order.items.map((i) => ({
    desc: i.name,
    qty: i.quantity,
    unitCents: i.unitPriceCents,
  }));
  const subtotal = items.reduce((n, i) => n + i.unitCents * i.qty, 0);
  let discountCents = order.loyaltyDiscountCents + order.promoDiscountCents;
  const labels: string[] = [];
  if (order.promoCode && order.promoDiscountCents > 0)
    labels.push(`Promo ${order.promoCode}`);
  if (order.loyaltyDiscountCents > 0)
    labels.push(`Loyalty ${order.loyaltyDiscountPct}%`);

  // Whatever else moved the total (an instant-pay discount, an adjustment) is shown,
  // so the image's total is exactly the order's.
  const diff =
    order.totalCents - (subtotal + order.deliveryFeeCents - discountCents);
  if (diff < 0) {
    discountCents += -diff;
    labels.push("Payment method discount");
  } else if (diff > 0) {
    items.push({ desc: "Adjustment", qty: 1, unitCents: diff });
  }

  const plan = (order.paymentPlan ?? null) as PaymentPlan | null;
  const quote = order.stage === "QUOTE" || !plan;
  const address = order.deliveryAddress as {
    address?: string;
    city?: string;
  } | null;
  const where = [address?.address, address?.city].filter(Boolean).join(", ");

  return {
    bookingId: order.orderNumber,
    ...(order.invoiceNumber ? { invoiceNo: order.invoiceNumber } : {}),
    dateLabel: day(order.invoiceIssuedAt ?? order.createdAt),
    clientName: order.guestName ?? order.customer?.name ?? "Customer",
    ...((order.guestEmail ?? order.customer?.email)
      ? { clientEmail: (order.guestEmail ?? order.customer?.email)! }
      : {}),
    ...((order.guestPhone ?? order.contactPhone)
      ? { clientPhone: (order.guestPhone ?? order.contactPhone)! }
      : {}),
    ...(where ? { address: where } : {}),
    ...(order.eventDate ? { eventDate: day(order.eventDate) } : {}),
    items,
    transportCents: order.deliveryFeeCents,
    discountCents,
    ...(labels.length ? { discountLabel: labels.join(" + ") } : {}),
    dueNowCents: quote ? 0 : amountDueCents(plan!, order.totalCents),
    dueLabel: quote
      ? "Due once we confirm your date"
      : plan === "HALF"
        ? "50% deposit due now"
        : plan === "DELIVERY"
          ? "Due on delivery"
          : "Due now",
    ...(order.paymentMethodLabel ? { method: order.paymentMethodLabel } : {}),
    ...(order.invoiceNote ? { notes: order.invoiceNote } : {}),
  };
}

/** The customer's conversation: by this browser's chat cookie, else the latest by email. */
async function threadFor(
  order: OrderForInvoice,
  visitor: string | null,
): Promise<string | null> {
  const email = (order.guestEmail ?? order.customer?.email ?? "")
    .trim()
    .toLowerCase();
  if (visitor) {
    const thread = await ensureThread({
      visitor,
      email: email || null,
      name: order.guestName ?? null,
    });
    return thread.id;
  }
  if (!email) return null;
  const thread = await prisma.supportThread.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });
  return thread?.id ?? null;
}

/**
 * Draw the order's invoice and post it into the customer's chat. Never throws: the
 * order is already saved, and a chat message must not be able to fail it.
 * Returns whether it was posted.
 */
export async function sendOrderInvoiceToChat(
  orderId: string,
  options: { visitor?: string | null; updated?: boolean; reason?: string } = {},
): Promise<boolean> {
  try {
    const order = await loadOrder(orderId);
    if (!order) return false;
    const threadId = await threadFor(order, options.visitor ?? null);
    if (!threadId) return false;

    const model = invoiceModelFor(order);
    const png = Buffer.from(await renderInvoiceImage(model).arrayBuffer());
    const key = keys.chatAttachment(
      threadId,
      randomBytes(8).toString("hex"),
      "png",
    );
    await putObject(key, png, "image/png");

    const first = (order.guestName ?? order.customer?.name ?? "").split(" ")[0];
    const quote = order.stage === "QUOTE";
    const lines = options.updated
      ? [
          `Your invoice for booking ${order.orderNumber} has been updated.`,
          options.reason ?? "",
          "",
          `New total: ${formatPrice(order.totalCents)}`,
        ]
      : [
          `Thank you${first ? `, ${first}` : ""}! Here is your ${quote ? "quote" : "invoice"} for booking ${order.orderNumber}.`,
          order.eventDate ? `Event date: ${day(order.eventDate)}` : "",
          `Total: ${formatPrice(order.totalCents)}`,
          "",
          quote
            ? "We are checking availability for your date now and will confirm it, and how to pay, right here."
            : "Payment details will arrive right here in this chat.",
        ];

    await postMessage({
      threadId,
      fromCustomer: false,
      authorName: BRAND.name,
      body: lines
        .filter((l, i, all) => l !== "" || (i > 0 && all[i - 1] !== ""))
        .join("\n")
        .trim(),
      attachment: {
        key,
        contentType: "image/png",
        name: `Invoice ${order.orderNumber}.png`,
      },
    });
    return true;
  } catch (error) {
    await reportError(error, { source: "order-invoice", context: { orderId } });
    return false;
  }
}
