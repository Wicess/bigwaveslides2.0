import type { ShopSort } from "@/server/data/products";

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
    sort: (one(sp.sort) as ShopSort) || "featured",
    minPriceCents: num(one(sp.minPrice)),
    maxPriceCents: num(one(sp.maxPrice)),
    minRating: num(one(sp.minRating)),
    page: Math.max(1, num(one(sp.page)) ?? 1),
  };
}
