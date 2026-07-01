import "server-only";
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

/** Paginated rental catalog — only `RENTAL` and `BOTH` products. */
export async function getRentalProducts(query: RentalQuery = {}) {
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

export async function getRentalBySlug(slug: string) {
  return withRetry(() =>
    prisma.product.findFirst({
      where: { slug, status: "ACTIVE", type: { in: ["RENTAL", "BOTH"] } },
      include: {
        media: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        category: { select: { slug: true, name: true } },
        _count: { select: { rentalUnits: { where: { isActive: true } } } },
      },
    }),
  ).catch(() => null);
}

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

export async function getRentalSlugs() {
  return withRetry(() =>
    prisma.product.findMany({
      where: { type: { in: ["RENTAL", "BOTH"] } },
      select: { slug: true },
    }),
  ).catch(() => []);
}
