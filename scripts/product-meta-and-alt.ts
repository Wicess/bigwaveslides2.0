/*
 * product-meta-and-alt.ts
 *
 * Fixes product image alt text, and CLEARS the metaTitle/metaDescription
 * overrides so the per-surface generators in lib/seo.ts are used instead.
 *
 * WHY THE META MOVED OUT OF THE DATABASE
 * An earlier version of this script generated a title and description per
 * product and wrote them to the product row. That was wrong: a product has one
 * metaTitle column but TWO pages — /rent/<slug> and /shop/<slug> — and both
 * read the same column, so all 52 sale pages ended up with the identical title
 * and description as their rental twin. A sweep of all 345 URLs caught it: 57
 * duplicate titles, 53 duplicate descriptions.
 *
 * lib/seo.ts now builds both from the same product facts but shapes them for
 * the intent of each surface ("... Rental — 18 ft Water Slide, $330/day" vs
 * "... for Sale — Commercial 18 ft water slide"). New products need no
 * backfill, and the metaTitle column stays free for a genuine hand-written
 * override from the admin.
 *
 * IMAGE ALT
 * 88 of 141 ProductMedia rows had no alt at all, and the 53 that did still
 * read "Bali Breeze 18 inflatable water slide" — a pre-rename name, the same
 * leak rebrand-catalog left in the blog. Alt is how Google and Bing understand
 * an image (Bing §12) and the accessible name for screen-reader users.
 *
 * Run: npm run db:product-meta-alt [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg, { Prisma } from "@prisma/client";
import { productKindLabel } from "../lib/seo";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

const text = (v: unknown): string =>
  typeof v === "string" ? v : ((v as { en?: string })?.en ?? "");

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      category: { select: { slug: true } },
      media: { orderBy: { order: "asc" } },
    },
    orderBy: { slug: "asc" },
  });

  let mediaFixed = 0;
  let cleared = 0;

  for (const p of products) {
    const name = text(p.name);
    const longKind = productKindLabel(p.category?.slug);

    // ── Image alt: current name, real kind, positional for the gallery ──
    for (const [i, m] of p.media.entries()) {
      const alt =
        i === 0
          ? `${name} ${longKind} set up and ready to rent`
          : `${name} ${longKind}, view ${i + 1}`;
      if (text(m.alt) === alt) continue;
      mediaFixed++;
      if (!DRY) {
        await prisma.productMedia.update({
          where: { id: m.id },
          data: { alt: { en: alt } },
        });
      }
    }

    if (!DRY) {
      // Clear rather than set. Both product surfaces read this column, so any
      // value here makes /rent and /shop identical — see the header.
      if (p.metaTitle !== null || p.metaDescription !== null) {
        cleared++;
        await prisma.product.update({
          where: { id: p.id },
          data: { metaTitle: Prisma.DbNull, metaDescription: Prisma.DbNull },
        });
      }
    }
  }

  console.log(`products:            ${products.length}`);
  console.log(`image alts ${DRY ? "to fix" : "fixed"}:   ${mediaFixed}`);
  console.log(`meta overrides ${DRY ? "to clear" : "cleared"}: ${cleared}`);
  console.log(
    "\nTitles and descriptions are generated per surface in lib/seo.ts — nothing to write here.",
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
