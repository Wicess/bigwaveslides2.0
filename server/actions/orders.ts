"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCartCookie, clearCartCookie } from "@/lib/cart-session";
import { orderNumber } from "@/lib/ref-number";
import { notifyOrderRequest } from "@/lib/notifications";
import { getSettings } from "@/server/data/settings";
import { TRANSPORT_CENTS } from "@/lib/pricing";
import {
  APP_INSTALLED_COOKIE,
  loyaltyDiscountCents as loyaltyDiscountCentsFor,
  loyaltyPct,
} from "@/lib/loyalty";
import { findPromo, promoDiscountCentsFor } from "@/lib/promo";
import { cartUnitPrice } from "@/server/data/cart";
import { upsertCustomerFromGuest } from "@/lib/customers";
import { createCustomerSession } from "@/lib/customer-auth";
import {
  geoFromHeaders,
  geoFromIp,
  ipFromHeaders,
  needsGeoEnrichment,
} from "@/lib/analytics/geo";
import { rateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  promoCode: z.string().max(40).optional().or(z.literal("")),
  locale: z.string().default("en"),
  website: z.string().optional(), // honeypot
});

export type OrderRequestResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

/**
 * Convert the active cart into a request-based Order (no payment taken).
 * Staff follow up with an invoice in the admin (Phase 15).
 */
export async function createOrderRequest(
  input: z.input<typeof schema>,
): Promise<OrderRequestResult> {
  if (input.website) {
    // Honeypot tripped — pretend success without writing anything.
    return { ok: true, orderNumber: orderNumber() };
  }

  // Anti-spam: 6 order requests per IP per 10 minutes.
  const limit = rateLimit(
    clientKeyFromHeaders(await headers(), "order-request"),
    6,
    10 * 60 * 1000,
  );
  if (!limit.ok) {
    return {
      ok: false,
      error: "Please wait a moment before submitting again.",
    };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const data = parsed.data;

  try {
    const cartId = await getCartCookie();
    if (!cartId) return { ok: false, error: "Your cart is empty." };

    const cart = await prisma.cart.findFirst({
      where: { id: cartId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) {
      return { ok: false, error: "Your cart is empty." };
    }

    // Price each line by its mode: BUY → sale price, RENT → daily rate. For
    // RENT, quantity is the number of rental days, so the line total is
    // dailyRate × days. `mode` is kept for the quote PDF (days vs qty) but is
    // not persisted on OrderItem (which has no mode column).
    const lines = cart.items.map((item) => {
      const mode = item.mode === "RENT" ? "RENT" : "BUY";
      const unit = cartUnitPrice(item.product, mode);
      const baseName =
        (item.product.name as { en?: string; fr?: string })[
          data.locale as "en" | "fr"
        ] ??
        (item.product.name as { en?: string }).en ??
        item.product.sku;
      const name = mode === "RENT" ? `${baseName} (Rental)` : baseName;
      return {
        productId: item.productId,
        productSlug: item.product.slug,
        name,
        unitPriceCents: unit,
        quantity: item.quantity,
        lineTotalCents: unit * item.quantity,
        mode: mode as "BUY" | "RENT",
      };
    });
    const items = lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      unitPriceCents: l.unitPriceCents,
      quantity: l.quantity,
      lineTotalCents: l.lineTotalCents,
    }));

    const subtotalCents = items.reduce((n, i) => n + i.lineTotalCents, 0);

    // Flat $30 transportation (owner-toggleable). No sales tax is charged.
    const settings = await getSettings().catch(() => ({}) as never);
    const transportOn = settings?.fees?.transportEnabled !== false; // default ON
    const deliveryFeeCents = transportOn ? TRANSPORT_CENTS : 0;

    // Loyalty discount on the product subtotal only: 15% for newsletter
    // subscribers, +5% ("for downloading the app") when this browser also has
    // the installed app. Stacks with the pay-method discount applied later.
    const jar = await cookies();
    const subscriber = await prisma.newsletterSubscriber
      .findFirst({
        where: {
          email: { equals: data.email, mode: "insensitive" },
          status: "SUBSCRIBED",
        },
        select: { id: true },
      })
      .catch(() => null);
    const loyaltyFlags = {
      subscribed: Boolean(subscriber),
      appInstalled: jar.get(APP_INSTALLED_COOKIE)?.value === "1",
    };
    let loyaltyDiscountCents = loyaltyDiscountCentsFor(
      subtotalCents,
      loyaltyFlags,
    );
    let loyaltyDiscountPct = loyaltyPct(loyaltyFlags);

    // Promo code (entered at checkout). It discounts only its eligible product
    // line(s) and does NOT stack with the loyalty discount — the larger of the
    // two wins, so a subscriber using a code is never double-discounted.
    const promo = findPromo(data.promoCode);
    let promoDiscountCents = promo
      ? promoDiscountCentsFor(
          lines.map((l) => ({
            productSlug: l.productSlug,
            mode: l.mode,
            quantity: l.quantity,
            lineTotalCents: l.lineTotalCents,
          })),
          promo,
        )
      : 0;
    let promoCode: string | null = null;
    if (promo && promoDiscountCents > loyaltyDiscountCents) {
      promoCode = promo.code; // promo wins → drop the loyalty discount
      loyaltyDiscountCents = 0;
      loyaltyDiscountPct = 0;
    } else {
      promoDiscountCents = 0; // loyalty (or no discount) wins
    }
    const totalCents =
      subtotalCents +
      deliveryFeeCents -
      loyaltyDiscountCents -
      promoDiscountCents;

    // Resolve the location the order is being placed from (IP-based, via edge
    // headers). Stored on the order so staff see where each request originated.
    const hdrs = await headers();
    const ip = ipFromHeaders(hdrs);
    let geo = geoFromHeaders(hdrs);
    if (needsGeoEnrichment(geo)) {
      const enriched = await geoFromIp(ip);
      if (enriched) geo = enriched;
    }
    const orderGeo =
      geo.country || geo.region || geo.city
        ? { country: geo.country, region: geo.region, city: geo.city, ip }
        : undefined;

    // The client-facing journey starts at the QUOTE stage: quote emailed +
    // shown on the site, valid 14 days; accepting it issues the invoice.
    const eventDay = data.eventDate
      ? new Date(`${data.eventDate}T12:00:00`)
      : null;
    // Auto-create/refresh the customer's account and attach this order to it.
    const customerId = await upsertCustomerFromGuest({
      name: data.name,
      email: data.email,
      phone: data.phone,
      locale: data.locale,
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        ...(customerId ? { customerId } : {}),
        ...(orderGeo ? { geo: orderGeo } : {}),
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone,
        contactPhone: data.phone,
        status: "PENDING",
        paymentStatus: "PENDING",
        stage: "QUOTE",
        eventDate:
          eventDay && !Number.isNaN(eventDay.getTime()) ? eventDay : null,
        quoteValidUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subtotalCents,
        deliveryFeeCents,
        loyaltyDiscountCents,
        loyaltyDiscountPct,
        promoCode,
        promoDiscountCents,
        totalCents,
        deliveryAddress:
          data.address || data.city
            ? { address: data.address || "", city: data.city || "" }
            : undefined,
        notes: [
          data.eventDate ? `Event date: ${data.eventDate}` : "",
          data.notes || "",
        ]
          .filter(Boolean)
          .join("\n"),
        locale: data.locale,
        items: { create: items },
      },
      select: { id: true, orderNumber: true },
    });

    // Sign this browser into the customer's account (passwordless, same device).
    if (customerId) await createCustomerSession(customerId, data.name);

    // Mark cart converted and drop the session cookie.
    await prisma.cart.update({
      where: { id: cartId },
      data: { status: "CONVERTED" },
    });
    await clearCartCookie();

    await notifyOrderRequest({
      orderNumber: order.orderNumber,
      orderId: order.id,
      geo: orderGeo,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address:
        [data.address, data.city].filter(Boolean).join(", ") || undefined,
      heroImageUrl: cart.items[0]?.product.media[0]?.url,
      items: lines.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.lineTotalCents,
        mode: i.mode,
      })),
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      eventDate: data.eventDate || undefined,
      locale: data.locale,
    });

    revalidatePath("/cart");
    return { ok: true, orderNumber: order.orderNumber };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export type ApplyPromoResult =
  | { ok: true; code: string; label: string; discountCents: number }
  | { ok: false; error: string };

/** Validate a promo code against the current cart and return the discount it
    would apply — used for the live "Apply" preview on the checkout form. The
    real discount is re-computed server-side at order creation. */
export async function applyPromoToCart(
  code: string,
): Promise<ApplyPromoResult> {
  const promo = findPromo(code);
  if (!promo)
    return { ok: false, error: "That code isn't valid or has expired." };
  try {
    const cartId = await getCartCookie();
    if (!cartId) return { ok: false, error: "Your cart is empty." };
    const cart = await prisma.cart.findFirst({
      where: { id: cartId, status: "ACTIVE" },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0)
      return { ok: false, error: "Your cart is empty." };

    const lines = cart.items.map((item) => {
      const mode = item.mode === "RENT" ? ("RENT" as const) : ("BUY" as const);
      const unit = cartUnitPrice(item.product, mode);
      return {
        productSlug: item.product.slug,
        mode,
        quantity: item.quantity,
        lineTotalCents: unit * item.quantity,
      };
    });
    const discountCents = promoDiscountCentsFor(lines, promo);
    if (discountCents <= 0)
      return {
        ok: false,
        error: "This code doesn't apply to your cart yet.",
      };
    return { ok: true, code: promo.code, label: promo.label, discountCents };
  } catch {
    return { ok: false, error: "Couldn't check that code. Please try again." };
  }
}
