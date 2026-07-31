import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import type { ShopSort } from "@/server/data/products";

export type RentalQuery = {
  category?: string;
  sort?: ShopSort;
  page?: number;
  pageSize?: number;
};

export const RENTAL_PAGE_SIZE = 12;

const cardSelect = {
  id: true,
  slug: true,
  type: true,
  name: true,
  salePriceCents: true,
  dailyRateCents: true,
  ratingAvg: true,
  ratingCount: true,
  featured: true,
  createdAt: true,
  media: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

function orderForSort(
  sort: ShopSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ dailyRateCents: "asc" }];
    case "price-desc":
      return [{ dailyRateCents: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { ratingAvg: "desc" }];
  }
}

/**
 * "Best & most-rentable first" score, blending two things the request asked for:
 *   • real demand — how often the slide is actually booked (weighted highest)
 *     and ordered on this site.
 *   • overall market reception — its rating, weighted by how many reviews back
 *     it (a 5★ with 40 reviews outranks a lone 5★).
 * Higher scores sort higher. New sites with little data fall back gracefully to
 * rating then recency, and the ranking sharpens as real bookings accumulate.
 */
function popularityScore(p: {
  ratingAvg: number;
  ratingCount: number;
  _count: { bookingItems: number; orderItems: number };
}): number {
  const demand = p._count.bookingItems * 3 + p._count.orderItems * 2;
  const market = p.ratingAvg * Math.min(p.ratingCount, 25) * 0.3;
  return demand + market;
}

/** Paginated rental catalog — only `RENTAL` and `BOTH` products.
    Cached (tag "products", 1h) so the dynamic /rent and /shop listing pages
    don't read the DB on every request and let the serverless compute sleep;
    admin product edits call revalidateTag("products") to refresh it. */
async function fetchRentalProducts(query: RentalQuery = {}) {
  const {
    category,
    sort = "featured",
    page = 1,
    pageSize = RENTAL_PAGE_SIZE,
  } = query;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    type: { in: ["RENTAL", "BOTH"] },
    ...(category ? { category: { slug: category } } : {}),
  };

  // Explicit sorts (newest / price / rating) stay DB-side and paginated.
  if (sort !== "featured") {
    const [items, total] = await withRetry(() =>
      Promise.all([
        prisma.product.findMany({
          where,
          select: cardSelect,
          orderBy: orderForSort(sort),
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.product.count({ where }),
      ]),
    ).catch(() => [[], 0] as const);
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // Default order = market + real demand. Rank the whole (small) catalog by the
  // popularity score, then fetch just the page's cards in that order — two light
  // queries that keep the card shape and pagination intact.
  const ranking = await withRetry(() =>
    prisma.product.findMany({
      where,
      select: {
        id: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        _count: { select: { bookingItems: true, orderItems: true } },
      },
      take: 500,
    }),
  ).catch(() => []);

  const orderedIds = [...ranking]
    .sort(
      (a, b) =>
        popularityScore(b) - popularityScore(a) || +b.createdAt - +a.createdAt,
    )
    .map((p) => p.id);

  const total = orderedIds.length;
  const pageIds = orderedIds.slice((page - 1) * pageSize, page * pageSize);

  const cards = await withRetry(() =>
    prisma.product.findMany({
      where: { id: { in: pageIds } },
      select: cardSelect,
    }),
  ).catch(() => []);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getRentalProducts = unstable_cache(
  fetchRentalProducts,
  ["rental-products"],
  { tags: ["products"], revalidate: 3600 },
);

export type RentalListing = Awaited<ReturnType<typeof getRentalProducts>>;

// The state/city SEO landing pages all display the same 8 featured rentals.
// Memoize a single fetch for the whole process so pre-rendering hundreds or
// thousands of location pages hits the database once, not once per page.
let landingRentalsPromise: Promise<RentalListing["items"]> | null = null;
export function getLandingRentals(): Promise<RentalListing["items"]> {
  if (!landingRentalsPromise) {
    landingRentalsPromise = getRentalProducts({ sort: "featured", page: 1 })
      .then((r) => r.items.slice(0, 8))
      .catch(() => [] as RentalListing["items"]);
  }
  return landingRentalsPromise;
}

// Cached (tag "products", 1h) so product pages served on-demand don't hit the
// DB per request; admin edits revalidate the "products" tag.
export const getRentalBySlug = unstable_cache(
  async (slug: string) =>
    withRetry(() =>
      prisma.product.findFirst({
        where: { slug, status: "ACTIVE", type: { in: ["RENTAL", "BOTH"] } },
        include: {
          media: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
          category: { select: { slug: true, name: true } },
          _count: { select: { rentalUnits: { where: { isActive: true } } } },
        },
      }),
    ).catch(() => null),
  ["rental-by-slug"],
  { tags: ["products"], revalidate: 3600 },
);

export type RentalDetail = NonNullable<
  Awaited<ReturnType<typeof getRentalBySlug>>
>;

export async function getRelatedRentals(
  productId: string,
  categoryId: string | null,
  limit = 4,
) {
  return withRetry(() =>
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        type: { in: ["RENTAL", "BOTH"] },
        id: { not: productId },
        ...(categoryId ? { categoryId } : {}),
      },
      select: cardSelect,
      orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
      take: limit,
    }),
  ).catch(() => []);
}

// Powers generateStaticParams for /rent/[slug]. Intentionally does NOT swallow
// errors: if the DB is unreachable at build time we want the build to FAIL so
// Vercel keeps the last good deployment, rather than shipping a build with an
// empty slug list that renders every product page as a 404/noindex.
export async function getRentalSlugs() {
  return withRetry(() =>
    prisma.product.findMany({
      where: { type: { in: ["RENTAL", "BOTH"] } },
      select: { slug: true },
    }),
  );
}
