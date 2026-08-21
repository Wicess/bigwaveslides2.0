import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export type ShopSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

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

function orderForSort(
  sort: ShopSort,
): Prisma.ProductOrderByWithRelationInput[] {
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
 *
 * Cached (tag "products", 1h) so the dynamic /shop listing doesn't read the DB
 * on every request; admin product edits revalidate the "products" tag.
 */
async function fetchShopProducts(query: ShopQuery = {}) {
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

export const getShopProducts = unstable_cache(
  fetchShopProducts,
  ["shop-products"],
  { tags: ["products"], revalidate: 3600 },
);

export type ShopListing = Awaited<ReturnType<typeof getShopProducts>>;
export type ShopCard = ShopListing["items"][number];

/**
 * Typo-tolerant product search via pg_trgm similarity, ranked by relevance.
 * Falls back to a plain `contains` scan if the trigram extension/index is
 * unavailable (e.g. before the Phase 9 migration is applied).
 */
export async function searchProductSlugs(
  q: string,
  limit = 12,
): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];

  try {
    const rows = await withRetry(
      () =>
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
  return [...items].sort(
    (a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug),
  );
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

/**
 * Resolve a PRE-RENAME product slug to the slug that product carries now.
 *
 * rebrand-catalog.ts renamed all 53 products, which changed every product URL.
 * The SKUs were deliberately left alone, so they still encode the old names —
 * BWS-AQUA-WAVE-15 belongs to what is now `cascade-15`. That makes the SKU
 * column an exact, self-maintaining old-slug map: rename a product again and
 * this keeps working with no list to update.
 *
 * Used by the product routes to 301 instead of 404. Those old URLs were live
 * and indexed under the previous name, and crawlers still request them —
 * `/en/rent/mega-waterpark-combo` was hit on 2026-08-17. A 404 throws away
 * whatever each one had accumulated; a 301 hands it to the renamed page.
 *
 * Returns null when there is no match, when the product is no longer ACTIVE, or
 * when the slug is already current (so a live URL can never redirect to itself).
 */
export async function getRenamedProductSlug(
  oldSlug: string,
): Promise<string | null> {
  // The slug reaches us from the URL, so reject anything that could not be one
  // before building an SKU string out of it.
  if (!/^[a-z0-9-]+$/.test(oldSlug)) return null;
  const row = await withRetry(() =>
    prisma.product.findUnique({
      where: { sku: `BWS-${oldSlug.toUpperCase()}` },
      select: { slug: true, status: true },
    }),
  ).catch(() => null);
  if (!row || row.status !== "ACTIVE" || row.slug === oldSlug) return null;
  return row.slug;
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

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
        // Mirror of the rental guard: a BOTH product with no sale price is
        // rental-only, and must never appear on a shop page under "Buy now".
        salePriceCents: { not: null },
        id: { not: productId },
        ...(categoryId ? { categoryId } : {}),
      },
      select: cardSelect,
      orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
      take: limit,
    }),
  ).catch(() => []);
}

// Powers generateStaticParams for /shop/[slug]. Does NOT swallow errors on
// purpose: a DB failure at build time should fail the build (Vercel keeps the
// last good deploy) instead of shipping empty params that 404 every product.
export async function getProductSlugs() {
  return withRetry(() =>
    prisma.product.findMany({
      where: { type: { in: ["SALE", "BOTH"] } },
      select: { slug: true },
    }),
  );
}

/** Featured active products for "you might also like" on the checkout page. */
export async function getCheckoutSuggestions(
  excludeIds: string[] = [],
  take = 6,
) {
  return withRetry(() =>
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: cardSelect,
      orderBy: [
        { featured: "desc" },
        { ratingAvg: "desc" },
        { updatedAt: "desc" },
      ],
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
