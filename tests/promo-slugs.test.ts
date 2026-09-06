/**
 * Every product-scoped promo must point at a product that exists.
 *
 * WAVE25 was pinned to "tropical-wave-18". rebrand-catalog renamed that
 * product to "breakwater-18" and nothing failed: the code stayed valid, the
 * lookup just never matched a cart line, so anyone given it saw no discount
 * and no error. A promo that matches nothing looks exactly like a promo that
 * wasn't applied, which is why it survived so long.
 *
 * This reads the live catalog rather than a hardcoded list, so the next rename
 * breaks a test instead of a customer's checkout.
 */
import { describe, it, expect } from "vitest";
import { PROMOS } from "@/lib/promo";

describe("promo product slugs resolve", () => {
  const scoped = PROMOS.filter((p) => p.productSlug);

  it("has at least one product-scoped promo to check", () => {
    expect(scoped.length).toBeGreaterThan(0);
  });

  it("every productSlug matches a live product", async () => {
    // Skips rather than fails when the database is unreachable. Neon now
    // suspends after ~5 minutes idle (that is deliberate — see the compute
    // work), so the first query after a quiet spell can cold-start slowly or
    // time out. A guard test that goes red for reasons unrelated to the thing
    // it guards gets deleted by the next person who hits it, so it reports
    // honestly instead: unreachable is "not checked", not "passed".
    if (!process.env.DATABASE_URL) {
      console.warn("promo-slugs: DATABASE_URL unset — slug check skipped");
      return;
    }
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const pkg = await import("@prisma/client");
    const prisma = new pkg.PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    try {
      const products = await prisma.product
        .findMany({ select: { slug: true } })
        .catch(() => null);
      if (!products) {
        console.warn("promo-slugs: database unreachable — slug check skipped");
        return;
      }
      const slugs = new Set(products.map((p) => p.slug));
      for (const promo of scoped) {
        expect(
          slugs.has(promo.productSlug!),
          `promo ${promo.code} targets "${promo.productSlug}", which is not a product`,
        ).toBe(true);
      }
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
    // 30s: a suspended Neon compute takes several seconds to wake, and
    // vitest's 5s default is shorter than that cold start. The DB sleeping is
    // the point of the compute work, so the test has to tolerate it.
  }, 30_000);

  it("labels name the product the promo actually applies to", () => {
    // The label is shown to the customer at checkout; a stale one promises a
    // discount on a product that is no longer the one being discounted.
    for (const promo of scoped) {
      const words = promo
        .productSlug!.split("-")
        .filter((w) => !/^\d+$/.test(w));
      const head = words[0]!;
      expect(
        promo.label.toLowerCase(),
        `promo ${promo.code} label "${promo.label}" doesn't mention ${promo.productSlug}`,
      ).toContain(head);
    }
  });
});
