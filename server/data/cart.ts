import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { getCartCookie } from "@/lib/cart-session";
import { getLocalized } from "@/lib/localized";

export type CartLine = {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  type: "SALE" | "RENTAL" | "BOTH";
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type CartSummary = {
  id: string | null;
  lines: CartLine[];
  count: number;
  subtotalCents: number;
};

const EMPTY: CartSummary = { id: null, lines: [], count: 0, subtotalCents: 0 };

function unitPrice(p: {
  type: string;
  salePriceCents: number | null;
  dailyRateCents: number | null;
}): number {
  // The cart is the PURCHASE (buy) cart — renting goes through the booking flow.
  // So always use the sale price; only fall back to the daily rate for a
  // rental-only product that somehow ends up here.
  return p.salePriceCents ?? p.dailyRateCents ?? 0;
}

/** Resolve the active cart for the current session, shaped for display. */
export async function getCart(locale = "en"): Promise<CartSummary> {
  const id = await getCartCookie();
  if (!id) return EMPTY;

  const cart = await withRetry(() =>
    prisma.cart.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                type: true,
                salePriceCents: true,
                dailyRateCents: true,
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
    }),
  ).catch(() => null);

  if (!cart) return EMPTY;

  const lines: CartLine[] = cart.items.map((item) => {
    const price = unitPrice(item.product);
    return {
      itemId: item.id,
      productId: item.productId,
      slug: item.product.slug,
      name: getLocalized(item.product.name, locale),
      image: item.product.media[0]?.url ?? null,
      type: item.product.type,
      unitPriceCents: price,
      quantity: item.quantity,
      lineTotalCents: price * item.quantity,
    };
  });

  return {
    id: cart.id,
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
  };
}

/** Lightweight item count for the header badge. */
export async function getCartCount(): Promise<number> {
  const id = await getCartCookie();
  if (!id) return 0;
  const agg = await withRetry(() =>
    prisma.cartItem.aggregate({
      where: { cart: { id, status: "ACTIVE" } },
      _sum: { quantity: true },
    }),
  ).catch(() => null);
  return agg?._sum.quantity ?? 0;
}
