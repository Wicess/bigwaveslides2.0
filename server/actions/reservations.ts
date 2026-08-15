"use server";

import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { invoiceNumber, orderNumber } from "@/lib/ref-number";
import { formatPrice } from "@/lib/format";
import { sendEmail, renderEmail } from "@/lib/email";
import { adminRecipients } from "@/lib/notifications";
import { notifyAdminNtfy } from "@/lib/ntfy";
import { upsertCustomerFromGuest } from "@/lib/customers";
import { createCustomerSession } from "@/lib/customer-auth";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import {
  APP_INSTALLED_COOKIE,
  loyaltyDiscountCents,
  loyaltyPct,
} from "@/lib/loyalty";
import {
  amountDueCents,
  balanceCents,
  effectiveTotalCents,
  cryptoDiscountCents,
  planLabel,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { findPromo, promoDiscountCentsFor, type PromoLine } from "@/lib/promo";
import { TRANSPORT_CENTS } from "@/lib/checkout-config";

// -----------------------------------------------------------------------------
// Instant reservations.
//
// There is no quote step and no accept step. A client fills one page and the
// order is created directly at stage INVOICE, because every extra screen
// between "I want this" and "done" loses bookings — and a quote the client has
// to come back and accept is two extra screens.
//
// House rule that shapes every string in this file: never tell a client we will
// "send payment details" or "contact you for payment". To someone who has just
// handed over their phone number that reads exactly like a scam. We say we will
// CONFIRM their booking or order. The only payment sentence allowed is that
// nothing is charged online.
// -----------------------------------------------------------------------------

export type ReservationResult =
  | {
      ok: true;
      orderNumber: string;
      dueCents: number;
      balanceCents: number;
      totalCents: number;
      plan: PaymentPlan;
    }
  | { ok: false; error: string };

/** A line as the checkout forms describe it, before any discounting. */
export type ReservationLine = {
  productId: string;
  productSlug: string;
  name: string;
  mode: "BUY" | "RENT";
  /** RENT: number of days. BUY: quantity. */
  quantity: number;
  unitPriceCents: number;
};

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(40),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  eventDate: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  plan: z.enum(["HALF", "FULL"]),
  method: z.string().trim().min(2).max(40),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  locale: z.string().trim().max(10).default("en"),
  /** Honeypot — real people never fill a hidden field. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ReservationContact = z.infer<typeof contactSchema>;

/** Client IP, for per-visitor rate limiting. */
async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}

function adminOrderUrl(id: string): string {
  const site = env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${site}/admin/orders/${id}`;
}

/**
 * Create the order and fire the three notifications.
 *
 * Money order of operations matters and is easy to get subtly wrong:
 *   subtotal  → product lines only
 *   transport → flat, once, and only if the site has it enabled
 *   discount  → the LARGER of promo and loyalty, never both (a subscriber
 *               entering a code should not compound to 20%+5%)
 *   method    → applied LAST, to the already-discounted total, because it is a
 *               settlement discount on what is actually owed
 *   plan      → splits whatever remains
 */
async function placeReservation({
  lines,
  data,
  kind,
}: {
  lines: ReservationLine[];
  data: ReservationContact;
  kind: "rent" | "buy";
}): Promise<ReservationResult> {
  if (lines.length === 0) return { ok: false, error: "Nothing to reserve." };

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const subtotal = lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);

  const transport =
    settings.fees?.transportEnabled !== false ? TRANSPORT_CENTS : 0;

  // Loyalty: the email must be a live newsletter subscriber, and the app bonus
  // rides on this browser's install cookie.
  const email = data.email.trim().toLowerCase();
  const subscribed = Boolean(
    await prisma.newsletterSubscriber
      .findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          status: "SUBSCRIBED",
        },
        select: { id: true },
      })
      .catch(() => null),
  );
  const jar = await cookies();
  const appInstalled = jar.get(APP_INSTALLED_COOKIE)?.value === "1";
  const flags = { subscribed, appInstalled };
  const loyalty = loyaltyDiscountCents(subtotal, flags);

  // Promo, on the product subtotal only — transport is never discounted.
  const promo = findPromo(data.promoCode || null);
  const promoLines: PromoLine[] = lines.map((l) => ({
    productSlug: l.productSlug,
    mode: l.mode,
    quantity: l.quantity,
    lineTotalCents: l.unitPriceCents * l.quantity,
  }));
  const promoCents = promo ? promoDiscountCentsFor(promoLines, promo) : 0;

  // No stacking — whichever saves the client more.
  const promoWins = promoCents >= loyalty;
  const appliedPromoCents = promoWins ? promoCents : 0;
  const appliedLoyaltyCents = promoWins ? 0 : loyalty;

  const baseTotal = Math.max(
    0,
    subtotal + transport - appliedLoyaltyCents - appliedPromoCents,
  );
  const payableTotal = effectiveTotalCents(baseTotal, data.method);
  const plan = data.plan as PaymentPlan;
  const dueNow = amountDueCents(plan, payableTotal);
  const balance = balanceCents(plan, payableTotal);

  const eventDate =
    kind === "rent" && data.eventDate ? new Date(data.eventDate) : null;

  const number = orderNumber();
  const invoiceNo = invoiceNumber();

  // Passwordless account, so the client can reopen the order later.
  const customerId = await upsertCustomerFromGuest({
    name: data.name,
    email,
    phone: data.phone,
    locale: data.locale,
  }).catch(() => null);

  let order;
  try {
    order = await prisma.order.create({
      data: {
        orderNumber: number,
        customerId,
        guestName: data.name,
        guestEmail: email,
        guestPhone: data.phone,
        status: "PROCESSING",
        paymentStatus: "PENDING",
        subtotalCents: subtotal,
        deliveryFeeCents: transport,
        loyaltyDiscountCents: appliedLoyaltyCents,
        loyaltyDiscountPct: appliedLoyaltyCents > 0 ? loyaltyPct(flags) : 0,
        promoCode: appliedPromoCents > 0 ? (promo?.code ?? null) : null,
        promoDiscountCents: appliedPromoCents,
        totalCents: payableTotal,
        // Straight to INVOICE: there is no quote to accept.
        stage: "INVOICE",
        invoiceNumber: invoiceNo,
        invoiceIssuedAt: new Date(),
        eventDate,
        paymentPlan: plan,
        paymentPlanAt: new Date(),
        paymentDetailsState: "AWAITING_DETAILS",
        paymentMethodKey: data.method,
        paymentMethodLabel: data.method,
        deliveryAddress:
          data.address || data.city
            ? { address: data.address ?? "", city: data.city ?? "" }
            : undefined,
        contactPhone: data.phone,
        locale: data.locale,
        notes: data.notes || null,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
            lineTotalCents: l.unitPriceCents * l.quantity,
          })),
        },
      },
      select: { id: true, orderNumber: true },
    });
  } catch {
    return { ok: false, error: "We couldn't save that. Please try again." };
  }

  if (customerId) {
    await createCustomerSession(customerId, data.name).catch(() => {});
  }

  const money = (c: number) => formatPrice(c, "en");
  const isRent = kind === "rent";
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const itemLines = lines
    .map(
      (l) =>
        `${l.name} — ${l.mode === "RENT" ? `${l.quantity} day(s)` : `qty ${l.quantity}`} × ${money(l.unitPriceCents)}`,
    )
    .join("\n");

  // Notifications never block the response — the client sees their confirmation
  // immediately and these run after it is flushed.
  after(async () => {
    await notifyAdminNtfy({
      title: isRent
        ? `🗓️ RESERVED — ${data.name}${dateLabel ? ` · ${dateLabel}` : ""} · ${planLabel(plan)}`
        : `🛒 PURCHASE — ${data.name} · ${planLabel(plan)}`,
      message: [
        itemLines,
        `Due now ${money(dueNow)} · Total ${money(payableTotal)}`,
        `Method: ${data.method}`,
        `${data.email} · ${data.phone}`,
      ].join("\n"),
      clickUrl: adminOrderUrl(order.id),
      tags: [isRent ? "calendar" : "shopping_cart"],
      priority: 4,
    }).catch(() => {});

    const rows = [
      { label: isRent ? "Booking" : "Order", value: order.orderNumber },
      ...(dateLabel ? [{ label: "Event date", value: dateLabel }] : []),
      { label: "Items", value: itemLines },
      { label: "Subtotal", value: money(subtotal) },
      ...(transport
        ? [{ label: "Transportation", value: money(transport) }]
        : []),
      ...(appliedPromoCents
        ? [
            {
              label: `Promo (${promo?.code})`,
              value: `− ${money(appliedPromoCents)}`,
            },
          ]
        : []),
      ...(appliedLoyaltyCents
        ? [
            {
              label: `Loyalty (${loyaltyPct(flags)}%)`,
              value: `− ${money(appliedLoyaltyCents)}`,
            },
          ]
        : []),
      ...(cryptoDiscountCents(baseTotal, data.method)
        ? [
            {
              label: `${data.method} discount`,
              value: `− ${money(cryptoDiscountCents(baseTotal, data.method))}`,
            },
          ]
        : []),
      { label: "Total", value: money(payableTotal) },
      { label: "Due now", value: money(dueNow) },
      ...(balance ? [{ label: "Balance", value: money(balance) }] : []),
      { label: "Plan", value: planLabel(plan) },
      { label: "Preferred method", value: data.method },
      {
        label: "Client",
        value: `${data.name} · ${data.email} · ${data.phone}`,
      },
      ...(data.address || data.city
        ? [
            {
              label: "Address",
              value: [data.address, data.city].filter(Boolean).join(", "),
            },
          ]
        : []),
      ...(data.notes ? [{ label: "Notes", value: data.notes }] : []),
    ];

    const admins = await adminRecipients().catch(() => []);
    if (admins.length) {
      await sendEmail({
        to: admins,
        subject: isRent
          ? `New reservation — ${data.name}${dateLabel ? ` · ${dateLabel}` : ""}`
          : `New purchase — ${data.name}`,
        html: renderEmail({
          heading: isRent ? "New reservation" : "New purchase",
          intro: `${data.name} just ${isRent ? "reserved a date" : "placed an order"}.`,
          rows,
          cta: { label: "Open in admin", url: adminOrderUrl(order.id) },
        }),
        replyTo: data.email,
      }).catch(() => {});
    }

    await sendEmail({
      to: email,
      subject: isRent
        ? `Booking received — we'll confirm your${dateLabel ? ` ${dateLabel}` : ""} reservation`
        : "Order received — we'll confirm your purchase",
      html: renderEmail({
        heading: isRent ? "Booking received" : "Order received",
        // "Confirm", never "payment details" — see the note at the top.
        intro: isRent
          ? `Thanks ${data.name}! We've got your reservation${dateLabel ? ` for ${dateLabel}` : ""} and we'll contact you shortly to confirm it. Nothing is charged online.`
          : `Thanks ${data.name}! We've got your order and we'll contact you shortly to confirm it. Nothing is charged online.`,
        rows: [
          { label: isRent ? "Booking" : "Order", value: order.orderNumber },
          ...(dateLabel ? [{ label: "Event date", value: dateLabel }] : []),
          { label: "Items", value: itemLines },
          { label: "Total", value: money(payableTotal) },
          { label: "Due now", value: money(dueNow) },
          ...(balance ? [{ label: "Balance", value: money(balance) }] : []),
          { label: "Plan", value: planLabel(plan) },
        ],
        cta: {
          label: isRent ? "View your booking" : "View your order",
          url: `${env.NEXT_PUBLIC_SITE_URL ?? ""}/en/order/${order.orderNumber}`,
        },
        phone: settings.contact?.phone ?? null,
      }),
    }).catch(() => {});
  });

  return {
    ok: true,
    orderNumber: order.orderNumber,
    dueCents: dueNow,
    balanceCents: balance,
    totalCents: payableTotal,
    plan,
  };
}

// ── Public actions ───────────────────────────────────────────────────────────

const singleSchema = contactSchema.extend({
  productId: z.string().min(1),
  rentalDays: z.coerce.number().int().min(1).max(60),
  eventType: z.string().trim().max(120).optional().or(z.literal("")),
});

/** Reserve ONE slide for a date range. */
export async function createSingleReservation(
  input: unknown,
): Promise<ReservationResult> {
  const gate = rateLimit(await clientKey("reserve"), 8, 60_000);
  if (!gate.ok)
    return { ok: false, error: "Too many attempts. Try again soon." };

  const parsed = singleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check your details." };
  const data = parsed.data;
  if (data.website) return { ok: false, error: "Please check your details." };

  const product = await prisma.product
    .findUnique({
      where: { id: data.productId },
      select: { id: true, slug: true, name: true, dailyRateCents: true },
    })
    .catch(() => null);
  if (!product?.dailyRateCents) {
    return { ok: false, error: "That slide isn't available to rent." };
  }

  return placeReservation({
    kind: "rent",
    data,
    lines: [
      {
        productId: product.id,
        productSlug: product.slug,
        name: typeof product.name === "string" ? product.name : product.slug,
        mode: "RENT",
        quantity: data.rentalDays,
        unitPriceCents: product.dailyRateCents,
      },
    ],
  });
}

const saleSchema = contactSchema.extend({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
});

/** Buy ONE slide outright. No event date — a purchase has no date to hold. */
export async function createSalePurchase(
  input: unknown,
): Promise<ReservationResult> {
  const gate = rateLimit(await clientKey("purchase"), 8, 60_000);
  if (!gate.ok)
    return { ok: false, error: "Too many attempts. Try again soon." };

  const parsed = saleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check your details." };
  const data = parsed.data;
  if (data.website) return { ok: false, error: "Please check your details." };

  const product = await prisma.product
    .findUnique({
      where: { id: data.productId },
      select: { id: true, slug: true, name: true, salePriceCents: true },
    })
    .catch(() => null);
  if (!product?.salePriceCents) {
    return { ok: false, error: "That slide isn't available to buy." };
  }

  return placeReservation({
    kind: "buy",
    data: { ...data, eventDate: "" },
    lines: [
      {
        productId: product.id,
        productSlug: product.slug,
        name: typeof product.name === "string" ? product.name : product.slug,
        mode: "BUY",
        quantity: data.quantity,
        unitPriceCents: product.salePriceCents,
      },
    ],
  });
}

const cartSchema = contactSchema.extend({ cartId: z.string().min(1) });

/** Check out a whole cart. The cart is single-mode, so every line shares a kind. */
export async function createCartReservation(
  input: unknown,
): Promise<ReservationResult> {
  const gate = rateLimit(await clientKey("cart-reserve"), 8, 60_000);
  if (!gate.ok)
    return { ok: false, error: "Too many attempts. Try again soon." };

  const parsed = cartSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Please check your details." };
  const data = parsed.data;
  if (data.website) return { ok: false, error: "Please check your details." };

  const cart = await prisma.cart
    .findUnique({
      where: { id: data.cartId },
      select: {
        id: true,
        items: {
          select: {
            quantity: true,
            mode: true,
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                salePriceCents: true,
                dailyRateCents: true,
              },
            },
          },
        },
      },
    })
    .catch(() => null);
  if (!cart || cart.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const lines: ReservationLine[] = [];
  for (const it of cart.items) {
    if (!it.product) continue;
    const isRent = it.mode === "RENT";
    const unit = isRent ? it.product.dailyRateCents : it.product.salePriceCents;
    if (!unit) continue;
    lines.push({
      productId: it.product.id,
      productSlug: it.product.slug,
      name:
        typeof it.product.name === "string" ? it.product.name : it.product.slug,
      mode: isRent ? "RENT" : "BUY",
      quantity: it.quantity,
      unitPriceCents: unit,
    });
  }
  if (lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const allBuy = lines.every((l) => l.mode === "BUY");
  const result = await placeReservation({
    kind: allBuy ? "buy" : "rent",
    data,
    lines,
  });

  if (result.ok) {
    await prisma.cart
      .update({ where: { id: cart.id }, data: { status: "CONVERTED" } })
      .catch(() => {});
  }
  return result;
}

// ── Promo preview ────────────────────────────────────────────────────────────

const previewSchema = z.object({
  code: z.string().trim().min(1).max(40),
  productSlug: z.string().trim().min(1).max(200),
  mode: z.enum(["BUY", "RENT"]),
  quantity: z.coerce.number().int().min(1).max(60),
  lineTotalCents: z.coerce.number().int().min(0),
});

export type PromoPreview =
  | {
      ok: true;
      code: string;
      label: string;
      pct: number;
      discountCents: number;
    }
  | { ok: false; error: string };

/**
 * Validate a code against one line and return its rate.
 *
 * Returns `pct` as well as the cents so the form can recompute live as quantity
 * or rental days change, without a round trip per keystroke. The server still
 * recomputes the real discount at submit — this is display only.
 */
export async function previewPromo(input: unknown): Promise<PromoPreview> {
  const gate = rateLimit(await clientKey("promo"), 20, 60_000);
  if (!gate.ok) return { ok: false, error: "Too many tries. Wait a moment." };

  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid code." };
  const { code, productSlug, mode, quantity, lineTotalCents } = parsed.data;

  const promo = findPromo(code);
  if (!promo) return { ok: false, error: "That code isn't valid." };

  const discountCents = promoDiscountCentsFor(
    [{ productSlug, mode, quantity, lineTotalCents }],
    promo,
  );
  if (discountCents <= 0) {
    return { ok: false, error: "That code doesn't apply to this item." };
  }

  return {
    ok: true,
    code: promo.code,
    label: promo.label,
    pct: promo.pct,
    discountCents,
  };
}
