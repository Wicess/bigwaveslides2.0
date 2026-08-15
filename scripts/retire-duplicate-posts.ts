/*
 * retire-duplicate-posts.ts
 *
 * Unpublishes the blog posts that are word-for-word duplicates of the same
 * posts on bigwaveslides.com — a different company running this codebase.
 *
 * MEASURED, not assumed: every blog slug is identical across the two sites, and
 * the cost-guide post shares 95% of its vocabulary and 63 of its 68 sentences.
 * Google has the OTHER site's copy indexed (it surfaces for the buying-guide
 * post), which means these pages cannot win — they are competing with an
 * identical, already-indexed article on an older domain. They contribute
 * nothing and dilute a domain that is already fighting a duplicate signal.
 *
 * DRAFT rather than delete: unpublishing takes them out of the sitemap and the
 * index, which is the entire SEO objective, while keeping the bodies so they can
 * be rewritten instead of re-researched. Nothing is destroyed and the admin can
 * still see them.
 *
 * These topics still need covering — the cost guide especially, which is the
 * highest-volume query in the niche. They need writing from scratch, in the
 * Splash Republic voice, with our own numbers.
 *
 * Run:  npm run db:retire-dup-posts           (apply)
 *       npm run db:retire-dup-posts -- --dry   (report only)
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY = process.argv.includes("--dry");

/** Confirmed present on both sites with the same slug. */
const DUPLICATE_SLUGS = [
  "are-water-slide-rentals-worth-it",
  "best-inflatable-water-slides-to-buy-2026",
  "best-water-slide-rentals-birthday-party",
  "fourth-of-july-water-slide-party",
  "graduation-party-water-slide-ideas",
  "how-to-rent-a-water-slide",
  "start-a-water-slide-rental-business",
  "water-slide-rental-cost-guide",
  "water-slide-rentals-churches-schools-hoas",
];

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { slug: { in: DUPLICATE_SLUGS } },
    select: { id: true, slug: true, status: true },
  });

  let changed = 0;
  for (const p of posts) {
    if (p.status !== "PUBLISHED") {
      console.log(`  (already ${p.status}) ${p.slug}`);
      continue;
    }
    changed++;
    console.log(`${DRY ? "[dry] " : ""}PUBLISHED -> DRAFT  ${p.slug}`);
    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: p.id },
        data: { status: "DRAFT" },
      });
    }
  }

  const missing = DUPLICATE_SLUGS.filter(
    (s) => !posts.some((p) => p.slug === s),
  );
  if (missing.length) console.log(`\nnot found: ${missing.join(", ")}`);

  console.log(
    `\n${DRY ? "Would unpublish" : "Unpublished"} ${changed} of ${posts.length} duplicate posts.`,
  );
  if (!DRY && changed > 0) {
    console.log(
      "Redeploy so the sitemap drops them. These topics still need original " +
        "posts written — the cost guide is the highest-volume query in the niche.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
