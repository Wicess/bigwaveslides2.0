import type { ShopSort } from "@/server/data/products";

const SORTS: readonly ShopSort[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
];

type Raw = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Parse and sanitize shop list filters from URL search params. */
export function parseShopQuery(sp: Raw) {
  const num = (v: string | undefined) => {
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    q: one(sp.q),
    category: one(sp.category),
    // An old ?sort=rating link (the option is gone) falls back to featured.
    sort: SORTS.includes(one(sp.sort) as ShopSort)
      ? (one(sp.sort) as ShopSort)
      : "featured",
    minPriceCents: num(one(sp.minPrice)),
    maxPriceCents: num(one(sp.maxPrice)),
    page: Math.max(1, num(one(sp.page)) ?? 1),
  };
}
