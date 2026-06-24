import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

const CART_EVENT_TYPES = [
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "CART_VIEW",
  "CHECKOUT_START",
  "ORDER_REQUEST",
] as const;

export type AnalyticsOverview = Awaited<ReturnType<typeof getAnalyticsOverview>>;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Headline metrics, daily series, top pages/locations and the cart funnel. */
export async function getAnalyticsOverview(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const today = startOfToday();

  return withRetry(async () => {
    const [
      visitors,
      visitorsToday,
      visits,
      visitsToday,
      pageViews,
      pageViewsToday,
      cartGroups,
      topPagesRaw,
      topCountries,
      topRegions,
      devices,
      dailyViews,
      dailyVisits,
    ] = await Promise.all([
      prisma.visitor.count({ where: { lastSeenAt: { gte: since } } }),
      prisma.visitor.count({ where: { lastSeenAt: { gte: today } } }),
      prisma.visit.count({ where: { startedAt: { gte: since } } }),
      prisma.visit.count({ where: { startedAt: { gte: today } } }),
      prisma.analyticsEvent.count({
        where: { type: "PAGE_VIEW", createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.count({
        where: { type: "PAGE_VIEW", createdAt: { gte: today } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { type: { in: [...CART_EVENT_TYPES] }, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { type: "PAGE_VIEW", createdAt: { gte: since }, path: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.visitor.groupBy({
        by: ["country"],
        where: { lastSeenAt: { gte: since }, country: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 8,
      }),
      prisma.visitor.groupBy({
        by: ["region", "country"],
        where: { lastSeenAt: { gte: since }, region: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { region: "desc" } },
        take: 8,
      }),
      prisma.visitor.groupBy({
        by: ["device"],
        where: { lastSeenAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
        FROM "AnalyticsEvent"
        WHERE type = 'PAGE_VIEW' AND "createdAt" >= ${since}
        GROUP BY day ORDER BY day ASC`,
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "startedAt") AS day, count(*) AS count
        FROM "Visit"
        WHERE "startedAt" >= ${since}
        GROUP BY day ORDER BY day ASC`,
    ]);

    const cartCounts = Object.fromEntries(
      cartGroups.map((g) => [g.type, g._count._all]),
    ) as Record<(typeof CART_EVENT_TYPES)[number], number | undefined>;

    return {
      days,
      visitors,
      visitorsToday,
      visits,
      visitsToday,
      pageViews,
      pageViewsToday,
      cart: {
        adds: cartCounts.ADD_TO_CART ?? 0,
        removes: cartCounts.REMOVE_FROM_CART ?? 0,
        views: cartCounts.CART_VIEW ?? 0,
        checkouts: cartCounts.CHECKOUT_START ?? 0,
        orders: cartCounts.ORDER_REQUEST ?? 0,
      },
      topPages: topPagesRaw.map((p) => ({
        path: p.path ?? "(unknown)",
        views: p._count._all,
      })),
      topCountries: topCountries.map((c) => ({
        country: c.country ?? "Unknown",
        visitors: c._count._all,
      })),
      topRegions: topRegions.map((r) => ({
        region: r.region ?? "Unknown",
        country: r.country ?? "",
        visitors: r._count._all,
      })),
      devices: devices.map((d) => ({ device: d.device, count: d._count._all })),
      series: mergeSeries(dailyViews, dailyVisits, days),
    };
  }).catch(() => emptyOverview(days));
}

/** Build a continuous daily series (filling gaps with 0) for the chart. */
function mergeSeries(
  views: { day: Date; count: bigint }[],
  visits: { day: Date; count: bigint }[],
  days: number,
) {
  const viewMap = new Map(views.map((v) => [dayKey(v.day), Number(v.count)]));
  const visitMap = new Map(visits.map((v) => [dayKey(v.day), Number(v.count)]));
  const out: { date: string; views: number; visits: number }[] = [];
  const span = Math.min(days, 90);
  const start = startOfToday();
  start.setDate(start.getDate() - (span - 1));
  for (let i = 0; i < span; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    out.push({
      date: key,
      views: viewMap.get(key) ?? 0,
      visits: visitMap.get(key) ?? 0,
    });
  }
  return out;
}

function dayKey(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

function emptyOverview(days: number) {
  return {
    days,
    visitors: 0,
    visitorsToday: 0,
    visits: 0,
    visitsToday: 0,
    pageViews: 0,
    pageViewsToday: 0,
    cart: { adds: 0, removes: 0, views: 0, checkouts: 0, orders: 0 },
    topPages: [] as { path: string; views: number }[],
    topCountries: [] as { country: string; visitors: number }[],
    topRegions: [] as { region: string; country: string; visitors: number }[],
    devices: [] as { device: string; count: number }[],
    series: [] as { date: string; views: number; visits: number }[],
  };
}

const PER_PAGE = 25;

/** Paginated visitor list for the admin "Visitors" page. */
export async function getVisitorsList(opts: { page?: number; q?: string } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const q = opts.q?.trim();
  const where = q
    ? {
        OR: [
          { country: { contains: q, mode: "insensitive" as const } },
          { region: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
          { visitorKey: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  return withRetry(async () => {
    const [total, visitors] = await Promise.all([
      prisma.visitor.count({ where }),
      prisma.visitor.findMany({
        where,
        orderBy: { lastSeenAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          visitorKey: true,
          firstSeenAt: true,
          lastSeenAt: true,
          country: true,
          region: true,
          city: true,
          device: true,
          browser: true,
          os: true,
          visitCount: true,
          pageViewCount: true,
          landingPath: true,
        },
      }),
    ]);
    return { visitors, total, page, perPage: PER_PAGE, pages: Math.ceil(total / PER_PAGE) };
  }).catch(() => ({ visitors: [], total: 0, page, perPage: PER_PAGE, pages: 0 }));
}

/** One visitor with their full session-by-session movement timeline. */
export async function getVisitorDetail(id: string) {
  return withRetry(async () => {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { startedAt: "desc" },
          include: {
            events: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    return visitor;
  }).catch(() => null);
}
