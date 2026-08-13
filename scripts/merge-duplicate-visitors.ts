/*
 * merge-duplicate-visitors.ts
 *
 * One-time backfill that collapses existing duplicate Visitor rows onto a single
 * record. Cookieless clients (bots, crawlers, privacy browsers) used to receive
 * a fresh random id on every request, so the same client appears many times in
 * the admin Visitors list. This groups visitors by the SAME fingerprint the live
 * tracker now uses (user-agent + country/region/city), reassigns their visits
 * and events onto the earliest "primary" visitor, recomputes its rollup counts,
 * and deletes the duplicates.
 *
 * Run:  npm run db:merge-visitors           (apply the merge)
 *       npm run db:merge-visitors -- --dry   (report only, change nothing)
 *
 * Safe to re-run: once merged, each fingerprint maps to one visitor, so a second
 * run finds nothing to do.
 */
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY =
  process.argv.includes("--dry") || process.argv.includes("--dry-run");

/** MUST stay identical to lib/analytics/fingerprint.ts → visitorFingerprint(). */
function fingerprint(
  userAgent: string | null,
  countryCode: string | null,
  regionCode: string | null,
  city: string | null,
): string {
  const basis = [
    (userAgent ?? "").trim().toLowerCase(),
    (countryCode ?? "").toUpperCase(),
    (regionCode ?? "").toUpperCase(),
    (city ?? "").trim().toLowerCase(),
  ].join("|");
  return "fp_" + createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

async function main() {
  const visitors = await prisma.visitor.findMany({
    select: {
      id: true,
      userAgent: true,
      countryCode: true,
      regionCode: true,
      city: true,
      browser: true,
      os: true,
      device: true,
      firstSeenAt: true,
    },
    orderBy: { firstSeenAt: "asc" },
  });

  // Group by fingerprint. Visitors with no user-agent AND no geo collapse to a
  // single near-empty basis — skip those to avoid merging genuinely unknown
  // clients together.
  const groups = new Map<string, typeof visitors>();
  for (const v of visitors) {
    if (!v.userAgent && !v.countryCode && !v.city) continue;
    const fp = fingerprint(v.userAgent, v.countryCode, v.regionCode, v.city);
    const list = groups.get(fp) ?? [];
    list.push(v);
    groups.set(fp, list);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  const totalDupes = dupGroups.reduce((n, g) => n + (g.length - 1), 0);

  console.log(
    `Scanned ${visitors.length} visitors → ${groups.size} unique fingerprints, ` +
      `${dupGroups.length} with duplicates (${totalDupes} rows to merge away).`,
  );

  if (DRY) {
    for (const g of dupGroups.slice(0, 25)) {
      const p = g[0]!;
      console.log(
        `  • ${g.length}× ${p.device}/${p.browser ?? "?"} @ ${p.city ?? "?"}, ${p.countryCode ?? "?"}`,
      );
    }
    if (dupGroups.length > 25)
      console.log(`  … and ${dupGroups.length - 25} more groups`);
    console.log(
      "\nDry run — no changes written. Re-run without --dry to apply.",
    );
    return;
  }

  let merged = 0;
  for (const group of dupGroups) {
    // Earliest first-seen is the primary; the rest fold into it.
    const [primary, ...dupes] = group;
    if (!primary) continue;
    const dupIds = dupes.map((d) => d.id);

    await prisma.$transaction(async (tx) => {
      await tx.visit.updateMany({
        where: { visitorId: { in: dupIds } },
        data: { visitorId: primary.id },
      });
      await tx.analyticsEvent.updateMany({
        where: { visitorId: { in: dupIds } },
        data: { visitorId: primary.id },
      });

      // Recompute rollups from the now-merged children.
      const [visitCount, eventCount, pageViewCount, bounds] = await Promise.all(
        [
          tx.visit.count({ where: { visitorId: primary.id } }),
          tx.analyticsEvent.count({ where: { visitorId: primary.id } }),
          tx.analyticsEvent.count({
            where: { visitorId: primary.id, type: "PAGE_VIEW" },
          }),
          tx.visit.aggregate({
            where: { visitorId: primary.id },
            _min: { startedAt: true },
            _max: { lastSeenAt: true },
          }),
        ],
      );

      // Backfill any geo/device fields the primary is missing from its dupes.
      const filler = dupes.find(
        (d) => d.browser || d.os || (d.device && d.device !== "UNKNOWN"),
      );

      await tx.visitor.update({
        where: { id: primary.id },
        data: {
          visitCount,
          eventCount,
          pageViewCount,
          ...(bounds._max.lastSeenAt
            ? { lastSeenAt: bounds._max.lastSeenAt }
            : {}),
          ...(!primary.browser && filler?.browser
            ? { browser: filler.browser }
            : {}),
          ...(!primary.os && filler?.os ? { os: filler.os } : {}),
          ...(primary.device === "UNKNOWN" &&
          filler &&
          filler.device !== "UNKNOWN"
            ? { device: filler.device }
            : {}),
        },
      });

      await tx.visitor.deleteMany({ where: { id: { in: dupIds } } });
    });

    merged += dupes.length;
  }

  console.log(
    `Done. Merged ${merged} duplicate rows into ${dupGroups.length} primaries.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
