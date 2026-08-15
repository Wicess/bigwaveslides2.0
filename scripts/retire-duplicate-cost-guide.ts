/*
 * retire-duplicate-cost-guide.ts
 *
 * Unpublishes "what-a-water-slide-rental-actually-costs", leaving
 * "water-slide-rental-cost-guide" as the single page for the cost query.
 *
 * WHY THERE WERE TWO
 * seed-cost-guide.ts was written on the premise that "the site currently has no
 * page for it — the old post was retired because it was word-for-word identical
 * to bigwaveslides.com". That was true when it was written and false by the time
 * it ran: write-blog-cluster.ts had already rewritten the retired post from
 * scratch and republished it. Both then went live in the `pricing` category,
 * competing for the highest-volume query in the niche — the exact
 * self-cannibalisation this site cannot afford on a young domain.
 *
 * WHY THIS ONE LOSES
 * Not authorship — measurable integration. water-slide-rental-cost-guide is
 * older (2026-06-26 vs 2026-08-15), longer (887 vs 764 words), carries a cover
 * image and tags, links to 7 products and 3 sibling posts, is linked FROM
 * another post, and is the URL cited in public/llms.txt. This one had no cover,
 * no tags, no outbound product links and nothing pointing at it — it was
 * orphaned from the link graph on arrival.
 *
 * WHAT WAS SALVAGED FIRST
 * Two sections of it were genuinely good and are now folded into the survivor:
 * the four tells of an underpriced quote, and the point that booking early buys
 * availability rather than a discount.
 *
 * WHAT WAS DELIBERATELY NOT SALVAGED — it contradicted the actual system:
 *   - "roughly 15–20% more for a wet setup": there is one daily rate per unit.
 *     No wet/dry price split exists in the catalog or in computeQuote().
 *   - "a second day is never double": lib/rental-pricing.ts computes
 *     dailyRateCents × days. A second day is exactly double.
 *   - "reserve with 50% and settle the balance 48 hours before the event": no
 *     such terms exist anywhere in this codebase. The model is a refundable
 *     deposit quoted separately, with payment arranged offline.
 *   - a markdown table: components/blog/article-content.tsx maps no `table`
 *     element, so remark-gfm would have rendered it unstyled.
 *
 * DRAFT rather than delete, same as retire-duplicate-posts.ts: it leaves the
 * sitemap and the index while the body stays readable in the admin. The URL
 * itself 301s to the survivor via middleware.ts, so the topic consolidates
 * instead of 404ing.
 *
 * Run: npm run db:retire-dup-cost-guide [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

const RETIRE = "what-a-water-slide-rental-actually-costs";
const KEEP = "water-slide-rental-cost-guide";

async function main() {
  const keep = await prisma.blogPost.findUnique({
    where: { slug: KEEP },
    select: { status: true },
  });

  // Refuse to retire the duplicate if the survivor isn't actually live —
  // otherwise this leaves the site with no cost page at all.
  if (!keep || keep.status !== "PUBLISHED") {
    console.error(
      `✗ refusing to run: ${KEEP} is ${keep ? keep.status : "MISSING"}, not PUBLISHED.`,
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug: RETIRE },
    select: { id: true, status: true },
  });

  if (!post) {
    console.log(`nothing to do — ${RETIRE} not found.`);
  } else if (post.status !== "PUBLISHED") {
    console.log(`already ${post.status} — ${RETIRE}`);
  } else {
    console.log(`${DRY ? "[dry] " : ""}PUBLISHED -> DRAFT  ${RETIRE}`);
    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { status: "DRAFT" },
      });
    }
  }

  console.log(`\n${KEEP} remains PUBLISHED as the single cost page.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
