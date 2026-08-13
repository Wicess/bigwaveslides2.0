/*
 * reclassify-bots.ts
 *
 * Re-runs user-agent classification over existing Visitor rows and flips any
 * that now read as automated to device = BOT — the field the visitors list
 * filters on, so a reclassified row drops out of "Human visitors" at once.
 *
 * Why a backfill is needed: `device` is only written when the Visitor row is
 * first created, so every improvement to detection applies to new traffic only.
 * Rows captured before a rule existed keep whatever they were labelled then, and
 * crawlers on a stock Chrome user agent sat in the human list looking like
 * customers.
 *
 * This only ever reclassifies on the *user agent*, which is stored. The
 * datacenter-IP signal cannot be replayed — no IP is kept — so crawlers on a
 * clean UA from a residential-looking range stay put; use "Mark as bot" on the
 * visitor page for those.
 *
 * Run:  npm run db:reclassify-bots           (apply)
 *       npm run db:reclassify-bots -- --dry   (report only, change nothing)
 *
 * Safe to re-run: it is a pure recomputation. Note it will also UNDO a manual
 * "Mark as bot" on a visitor whose UA looks human, so re-check those after.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { parseUserAgent } from "../lib/analytics/geo";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY = process.argv.includes("--dry");

async function main() {
  const visitors = await prisma.visitor.findMany({
    where: { device: { not: "BOT" }, userAgent: { not: null } },
    select: { id: true, visitorKey: true, device: true, userAgent: true },
  });

  let changed = 0;
  for (const v of visitors) {
    const { device } = parseUserAgent(v.userAgent);
    if (device !== "BOT") continue;

    changed++;
    console.log(
      `${DRY ? "[dry] " : ""}#${v.visitorKey.slice(0, 8)}  ${v.device} → BOT`,
    );
    console.log(`        ${v.userAgent}`);

    if (!DRY) {
      await prisma.visitor.update({
        where: { id: v.id },
        data: { device: "BOT" },
      });
    }
  }

  console.log(
    `\n${DRY ? "Would reclassify" : "Reclassified"} ${changed} of ${visitors.length} non-bot visitors.`,
  );
  if (changed === 0) {
    console.log(
      "Nothing matched on user agent alone. Crawlers using a clean stock UA can " +
        'still be hidden one at a time with "Mark as bot" on the visitor page.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
