import { NextResponse } from "next/server";
import { searchProducts } from "@/server/data/products";
import { getLocalized } from "@/lib/localized";

export const runtime = "nodejs";

/** Live, typo-tolerant product search for the shop search box. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const locale = searchParams.get("locale") ?? "en";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await searchProducts(q, 6);
  const results = products.map((p) => ({
    slug: p.slug,
    name: getLocalized(p.name, locale),
    type: p.type,
    image: p.media[0]?.url ?? null,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    salePriceCents: p.salePriceCents,
    dailyRateCents: p.dailyRateCents,
  }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
