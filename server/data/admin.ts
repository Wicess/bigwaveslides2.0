import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/* ───────────────── Dashboard ───────────────── */

export async function getAdminDashboard() {
  const now = new Date();
  return withRetry(async () => {
    const [
      ordersPending,
      bookingsRequested,
      quotesNew,
      productsActive,
      revenue,
      upcoming,
      recentOrders,
      recentBookings,
      recentActivity,
    ] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "REQUESTED" } }),
      prisma.quoteRequest.count({ where: { status: "NEW" } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID_IN_FULL" },
        _sum: { totalCents: true },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", eventStartDate: { gte: now } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          guestName: true,
          totalCents: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          guestName: true,
          eventStartDate: true,
          status: true,
          totalCents: true,
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { name: true } } },
      }),
    ]);

    return {
      ordersPending,
      bookingsRequested,
      quotesNew,
      productsActive,
      revenueCents: revenue._sum.totalCents ?? 0,
      upcoming,
      recentOrders,
      recentBookings,
      recentActivity,
    };
  }).catch(() => ({
    ordersPending: 0,
    bookingsRequested: 0,
    quotesNew: 0,
    productsActive: 0,
    revenueCents: 0,
    upcoming: 0,
    recentOrders: [],
    recentBookings: [],
    recentActivity: [],
  }));
}

/* ───────────────── Orders ───────────────── */

export async function getAdminOrders() {
  return withRetry(() =>
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        guestName: true,
        guestEmail: true,
        totalCents: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
  ).catch(() => []);
}

export async function getAdminOrder(id: string) {
  return withRetry(() =>
    prisma.order.findUnique({ where: { id }, include: { items: true } }),
  ).catch(() => null);
}

/* ───────────────── Bookings ───────────────── */

export async function getAdminBookings() {
  return withRetry(() =>
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        bookingNumber: true,
        guestName: true,
        eventStartDate: true,
        eventEndDate: true,
        status: true,
        paymentStatus: true,
        holdType: true,
        totalCents: true,
      },
    }),
  ).catch(() => []);
}

export async function getAdminBooking(id: string) {
  return withRetry(() =>
    prisma.booking.findUnique({
      where: { id },
      include: { items: true, contract: true },
    }),
  ).catch(() => null);
}

/* ───────────────── Quotes ───────────────── */

export async function getAdminQuotes() {
  return withRetry(() =>
    prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    }),
  ).catch(() => []);
}

export async function getAdminQuote(id: string) {
  return withRetry(() =>
    prisma.quoteRequest.findUnique({ where: { id }, include: { items: true } }),
  ).catch(() => null);
}

/* ───────────────── Products / catalog ───────────────── */

export async function getAdminProducts() {
  return withRetry(() =>
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        sku: true,
        name: true,
        type: true,
        status: true,
        salePriceCents: true,
        dailyRateCents: true,
        featured: true,
        category: { select: { name: true } },
      },
    }),
  ).catch(() => []);
}

export async function getAdminProduct(id: string) {
  return withRetry(() =>
    prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        media: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          select: { url: true },
        },
      },
    }),
  ).catch(() => null);
}

export async function getAdminCategoriesList() {
  return withRetry(() =>
    prisma.productCategory.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        order: true,
        _count: { select: { products: true } },
      },
    }),
  ).catch(() => []);
}

export async function getCategoryOptions() {
  return withRetry(() =>
    prisma.productCategory.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ).catch(() => []);
}

/* ───────────────── Inventory ───────────────── */

export async function getAdminInventory() {
  return withRetry(() =>
    prisma.product.findMany({
      where: { type: { in: ["RENTAL", "BOTH"] } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        rentalUnits: {
          orderBy: { createdAt: "asc" },
          select: { id: true, unitLabel: true, isActive: true, conditionNotes: true },
        },
      },
    }),
  ).catch(() => []);
}
