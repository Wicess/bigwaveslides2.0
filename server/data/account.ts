import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/** Resolve the signed-in customer (by session email), creating nothing. */
export async function getCustomerByEmail(email: string) {
  return withRetry(() =>
    prisma.customer.findUnique({ where: { email: email.toLowerCase() } }),
  ).catch(() => null);
}

/** History matches by customer id OR the email used as a guest. */
function ownerWhere(customerId: string, email: string) {
  return { OR: [{ customerId }, { guestEmail: email.toLowerCase() }] };
}

export async function getCustomerOrders(customerId: string, email: string) {
  return withRetry(() =>
    prisma.order.findMany({
      where: ownerWhere(customerId, email),
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ).catch(() => []);
}

export async function getCustomerBookings(customerId: string, email: string) {
  return withRetry(() =>
    prisma.booking.findMany({
      where: ownerWhere(customerId, email),
      orderBy: { createdAt: "desc" },
      include: { items: true, contract: { select: { contractNumber: true, status: true } } },
    }),
  ).catch(() => []);
}

export async function getCustomerQuotes(customerId: string, email: string) {
  return withRetry(() =>
    prisma.quoteRequest.findMany({
      where: ownerWhere(customerId, email),
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ).catch(() => []);
}

/** Signed contracts surface via the customer's bookings. */
export async function getCustomerContracts(customerId: string, email: string) {
  const bookings = await withRetry(() =>
    prisma.booking.findMany({
      where: { ...ownerWhere(customerId, email), contract: { isNot: null } },
      orderBy: { createdAt: "desc" },
      select: {
        bookingNumber: true,
        eventStartDate: true,
        contract: {
          select: { contractNumber: true, status: true, signedAt: true },
        },
      },
    }),
  ).catch(() => []);
  return bookings.filter((b) => b.contract);
}

export async function getCustomerWishlist(customerId: string, locale: string) {
  const items = await withRetry(() =>
    prisma.wishlistItem.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        product: {
          select: {
            id: true,
            slug: true,
            type: true,
            name: true,
            salePriceCents: true,
            dailyRateCents: true,
            ratingAvg: true,
            ratingCount: true,
            media: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
          },
        },
      },
    }),
  ).catch(() => []);
  void locale;
  return items.map((w) => w.product).filter(Boolean);
}

export type AccountSummary = {
  orders: number;
  bookings: number;
  quotes: number;
  wishlist: number;
};

export async function getAccountSummary(
  customerId: string,
  email: string,
): Promise<AccountSummary> {
  const where = ownerWhere(customerId, email);
  const [orders, bookings, quotes, wishlist] = await withRetry(() =>
    Promise.all([
      prisma.order.count({ where }),
      prisma.booking.count({ where }),
      prisma.quoteRequest.count({ where }),
      prisma.wishlistItem.count({ where: { customerId } }),
    ]),
  ).catch(() => [0, 0, 0, 0] as const);
  return { orders, bookings, quotes, wishlist };
}
