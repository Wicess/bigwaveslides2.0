/*
 * sync-product-ratings.ts
 *
 * Recomputes every product's `ratingAvg` / `ratingCount` from its APPROVED
 * Review rows — the only source of truth for a star rating.
 *
 * Why this exists: the seed used to write invented ratings straight onto
 * products (4.9 from 64 reviews, 4.8 from 41, …). Those rollups are summed into
 * the site-wide aggregate and emitted as `aggregateRating` in the Product and
 * LocalBusiness JSON-LD, so the live site was telling Google about ~927 reviews
 * that no customer ever left. Google's review-snippet guidelines make
 * self-serving LocalBusiness/Organization ratings ineligible for star results
 * regardless, so the markup earned nothing while carrying manual-action risk.
 *
 * The seed no longer writes ratings, but the DEPLOYED database still holds the
 * old fabricated values — fixing the seed alone changes nothing in production.
 * Run this once to clear them, then re-run whenever reviews are approved so the
 * rollups (and therefore the schema) always match reality.
 *
 * Run:  npm run db:sync-ratings           (apply)
 *       npm run db:sync-ratings -- --dry   (report only, change nothing)
 *
 * Safe to re-run: it is a pure recomputation, so a second run is a no-op.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY = process.argv.includes("--dry");

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, ratingAvg: true, ratingCount: true },
  });

  // One grouped query instead of N per-product aggregates.
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "APPROVED" },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const real = new Map(
    grouped.map((g) => [
      g.productId,
      { count: g._count._all, avg: g._avg.rating ?? 0 },
    ]),
  );

  let changed = 0;
  let clearedReviews = 0;

  for (const p of products) {
    const actual = real.get(p.id) ?? { count: 0, avg: 0 };
    // Round to one decimal — the precision the schema and UI actually display.
    const avg = actual.count > 0 ? Math.round(actual.avg * 10) / 10 : 0;

    if (p.ratingCount === actual.count && p.ratingAvg === avg) continue;

    changed++;
    clearedReviews += Math.max(0, p.ratingCount - actual.count);
    console.log(
      `${DRY ? "[dry] " : ""}${p.slug}: ` +
        `${p.ratingAvg} (${p.ratingCount}) → ${avg} (${actual.count})`,
    );

    if (!DRY) {
      await prisma.product.update({
        where: { id: p.id },
        data: { ratingAvg: avg, ratingCount: actual.count },
      });
    }
  }

  const totalReal = [...real.values()].reduce((n, r) => n + r.count, 0);
  console.log(
    `\n${DRY ? "Would update" : "Updated"} ${changed} of ${products.length} products. ` +
      `Approved reviews in DB: ${totalReal}.` +
      (clearedReviews > 0
        ? ` Removed ${clearedReviews} unbacked review(s) from the rollups.`
        : ""),
  );
  if (!DRY && changed > 0) {
    console.log(
      "Redeploy or wait for ISR (≤1h) so the cached pages drop the stale aggregateRating markup.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
