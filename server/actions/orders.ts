"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCartCookie, clearCartCookie } from "@/lib/cart-session";
import { orderNumber } from "@/lib/ref-number";
import { notifyOrderRequest } from "@/lib/notifications";
import { cartUnitPrice } from "@/server/data/cart";
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

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        ...(orderGeo ? { geo: orderGeo } : {}),
        guestName: data.name,
        guestEmail: data.email,
        guestPhone: data.phone,
        contactPhone: data.phone,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotalCents,
        totalCents: subtotalCents,
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

    // Mark cart converted and drop the session cookie.
    await prisma.cart.update({
      where: { id: cartId },
      data: { status: "CONVERTED" },
    });
    await clearCartCookie();

    await notifyOrderRequest({
      orderNumber: order.orderNumber,
      orderId: order.id,
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
      totalCents: subtotalCents,
      locale: data.locale,
    });

    revalidatePath("/cart");
    return { ok: true, orderNumber: order.orderNumber };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
