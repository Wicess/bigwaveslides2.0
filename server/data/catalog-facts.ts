import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import type { CatalogProduct } from "@/lib/business-facts";

export type FactsData = {
  products: CatalogProduct[];
  /** Enabled payment rails — labels only, never destinations. */
  paymentMethods: { method: string; label: string }[];
  /** Published posts among the curated slugs, with their live titles. */
  posts: { slug: string; title: string }[];
};

/**
 * Everything the machine-readable files need from the database, in one pass.
 * Throws on a DB failure or an empty catalog, so an outage is never cached as
 * "we sell nothing" — callers decide how to degrade.
 */
async function loadFactsData(curatedSlugs: string[]): Promise<FactsData> {
  const [rows, methods, posts] = await withRetry(() =>
    Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: {
          slug: true,
          name: true,
          dailyRateCents: true,
          salePriceCents: true,
          capacity: true,
          ageRange: true,
          powerRequired: true,
          spaceRequired: true,
          category: { select: { slug: true } },
        },
        orderBy: [{ dailyRateCents: "asc" }, { slug: "asc" }],
      }),
      prisma.paymentMethodConfig.findMany({
        where: { enabled: true },
        select: { method: true, label: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", slug: { in: curatedSlugs } },
        select: { slug: true, title: true },
      }),
    ]),
  );
  if (rows.length === 0) throw new Error("catalog-facts: no active products");
  const en = (v: unknown, fallback: string) =>
    (v as Record<string, string> | null)?.en ?? fallback;
  const bySlug = new Map(posts.map((p) => [p.slug, en(p.title, p.slug)]));
  return {
    products: rows.map((r) => ({
      slug: r.slug,
      name: en(r.name, r.slug),
      category: r.category?.slug ?? null,
      dailyRateCents: r.dailyRateCents,
      salePriceCents: r.salePriceCents,
      capacity: r.capacity,
      ageRange: r.ageRange,
      power: r.powerRequired,
      space: (r.spaceRequired as { value?: string } | null)?.value ?? null,
    })),
    paymentMethods: methods,
    // Keep the curated order.
    posts: curatedSlugs
      .filter((s) => bySlug.has(s))
      .map((s) => ({ slug: s, title: bySlug.get(s)! })),
  };
}

/**
 * Daily-cached: at most one round of queries per day for /llms.txt and
 * /pricing.md together. Busted early by revalidateTag("products") /
 * revalidateTag("settings") when the admin edits the catalog or settings.
 */
export const getFactsData = unstable_cache(loadFactsData, ["business-facts"], {
  tags: ["products", "settings", "blog"],
  revalidate: 86400,
});
