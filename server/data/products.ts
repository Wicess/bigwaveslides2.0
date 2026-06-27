import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export type ShopSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export type ShopQuery = {
  /** Filter to a single category slug. */
  category?: string;
  /** Free-text query (typo-tolerant). */
  q?: string;
  sort?: ShopSort;
  minPriceCents?: number;
  maxPriceCents?: number;
  /** Minimum average rating (1–5). */
  minRating?: number;
  page?: number;
  pageSize?: number;
};

export const PRODUCT_PAGE_SIZE = 9;

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

function orderForSort(sort: ShopSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ salePriceCents: "asc" }, { dailyRateCents: "asc" }];
    case "price-desc":
      return [{ salePriceCents: "desc" }, { dailyRateCents: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { ratingAvg: "desc" }];
  }
}

/**
 * Paginated, filtered shop listing. `SALE` and `BOTH` products surface in the
 * shop; pure `RENTAL` products live under /rent.
 */
export async function getShopProducts(query: ShopQuery = {}) {
  const {
    category,
    q,
    sort = "featured",
    minPriceCents,
    maxPriceCents,
    minRating,
    page = 1,
    pageSize = PRODUCT_PAGE_SIZE,
  } = query;

  // Typo-tolerant search returns an ordered slug list; intersect with filters.
  let searchSlugs: string[] | null = null;
  if (q && q.trim().length > 0) {
    const hits = await searchProductSlugs(q.trim(), 60);
    searchSlugs = hits;
    if (hits.length === 0) {
      return { items: [], total: 0, page, pageSize, pageCount: 0 };
    }
  }

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    type: { in: ["SALE", "BOTH"] },
    ...(category ? { category: { slug: category } } : {}),
    ...(minRating ? { ratingAvg: { gte: minRating } } : {}),
    ...(searchSlugs ? { slug: { in: searchSlugs } } : {}),
  };

  // Price filters apply to whichever price the product exposes.
  if (minPriceCents != null || maxPriceCents != null) {
    const range: Prisma.IntNullableFilter = {};
    if (minPriceCents != null) range.gte = minPriceCents;
    if (maxPriceCents != null) range.lte = maxPriceCents;
    where.OR = [{ salePriceCents: range }, { dailyRateCents: range }];
  }

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
  );

  // When searching, preserve relevance order from the search ranking.
  const ordered =
    searchSlugs && sort === "featured"
      ? [...items].sort(
          (a, b) => searchSlugs!.indexOf(a.slug) - searchSlugs!.indexOf(b.slug),
        )
      : items;

  return {
    items: ordered,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type ShopListing = Awaited<ReturnType<typeof getShopProducts>>;
export type ShopCard = ShopListing["items"][number];

/**
 * Typo-tolerant product search via pg_trgm similarity, ranked by relevance.
 * Falls back to a plain `contains` scan if the trigram extension/index is
 * unavailable (e.g. before the Phase 9 migration is applied).
 */
export async function searchProductSlugs(q: string, limit = 12): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];

  try {
    const rows = await withRetry(() =>
      prisma.$queryRaw<{ slug: string }[]>`
        SELECT slug
        FROM "Product"
        WHERE status = 'ACTIVE'
          AND type IN ('SALE', 'BOTH')
          AND (
            "searchText" % ${term}
            OR "searchText" ILIKE ${"%" + term + "%"}
            OR (name->>'en') ILIKE ${"%" + term + "%"}
          )
        ORDER BY similarity(COALESCE("searchText", ''), ${term}) DESC,
                 "ratingAvg" DESC
        LIMIT ${limit}
      `,
    );
    return rows.map((r) => r.slug);
  } catch {
    // Fallback: case-insensitive contains on the denormalized search column.
    const rows = await withRetry(() =>
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          type: { in: ["SALE", "BOTH"] },
          searchText: { contains: term, mode: "insensitive" },
        },
        select: { slug: true },
        orderBy: { ratingAvg: "desc" },
        take: limit,
      }),
    ).catch(() => []);
    return rows.map((r) => r.slug);
  }
}

/** Search returning card-shaped products for the live search dropdown / results. */
export async function searchProducts(q: string, limit = 8) {
  const slugs = await searchProductSlugs(q, limit);
  if (slugs.length === 0) return [];
  const items = await withRetry(() =>
    prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: cardSelect,
    }),
  ).catch(() => []);
  return [...items].sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
}

export const getProductCategories = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.productCategory.findMany({
        orderBy: { order: "asc" },
        select: { id: true, slug: true, name: true, image: true },
      }),
    ),
  ["product-categories"],
  { tags: ["categories"], revalidate: 3600 },
);

export async function getCategoryBySlug(slug: string) {
  return withRetry(() =>
    prisma.productCategory.findUnique({ where: { slug } }),
  ).catch(() => null);
}

export async function getProductBySlug(slug: string) {
  return withRetry(() =>
    prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: {
        media: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        variations: { orderBy: { order: "asc" } },
        category: { select: { slug: true, name: true } },
      },
    }),
  ).catch(() => null);
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
) {
  return withRetry(() =>
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        type: { in: ["SALE", "BOTH"] },
        id: { not: productId },
        ...(categoryId ? { categoryId } : {}),
      },
      select: cardSelect,
      orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
      take: limit,
    }),
  ).catch(() => []);
}

export async function getProductSlugs() {
  return withRetry(() =>
    prisma.product.findMany({
      where: { type: { in: ["SALE", "BOTH"] } },
      select: { slug: true },
    }),
  ).catch(() => []);
}

/** Featured active products for "you might also like" on the checkout page. */
export async function getCheckoutSuggestions(excludeIds: string[] = [], take = 6) {
  return withRetry(() =>
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: cardSelect,
      orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }, { updatedAt: "desc" }],
      take,
    }),
  ).catch(() => []);
}

export async function getApprovedReviews(productId: string) {
  return withRetry(() =>
    prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
      },
    }),
  ).catch(() => []);
}
