/*
 * rebrand-catalog.ts
 *
 * Renames, re-slugs and reprices the entire product catalog.
 *
 * WHY: every one of the 53 products carried the same name and the same price as
 * the identical product on bigwaveslides.com — a different company running this
 * same codebase. "Double Drop Racer 22 at $369/day" on two sites is the clearest
 * duplicate signal a catalog can send: two genuinely separate rental businesses
 * do not stock identically-named units at identical prices. Renaming the company
 * fixed the label on the box; this changes the contents.
 *
 * NAMING: the old catalog was themed on nature and characters (Tropical, Cosmic,
 * Jungle, Princess). The new one is themed on American coast and landscape —
 * Breakwater, Twin Falls, Palmetto Coast, Redstone — so no unit name collides
 * and the set reads as one deliberate range rather than a rename of another.
 *
 * PRICING: shifted by a consistent rule rather than arbitrary numbers, then
 * rounded to $5 endings (the old catalog rounds to $9). Same market position,
 * different price list.
 *
 * SLUGS change too, because the URL is part of what Google compares. Existing
 * product URLs will 404 — acceptable here and only here: the catalog has no
 * organic traffic to lose, and the alternative is keeping the duplicate slugs
 * that helped cause the problem.
 *
 * Run:  npm run db:rebrand-catalog           (apply)
 *       npm run db:rebrand-catalog -- --dry   (report only)
 *
 * Safe to re-run: keyed on the OLD slug, so a second run finds nothing to do.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY = process.argv.includes("--dry");

/** oldSlug -> [newSlug, newName] */
const RENAMES: Record<string, [string, string]> = {
  "aqua-wave-15": ["cascade-15", "Cascade 15"],
  "arctic-frost-slide": ["glacier-run-18", "Glacier Run 18"],
  "bali-breeze-18": ["sandbar-18", "Sandbar 18"],
  "blue-crush-18": ["bluepoint-18", "Bluepoint 18"],
  "blue-vortex-26": ["vortex-peak-26", "Vortex Peak 26"],
  "blush-castle-bouncer": ["rose-keep-bouncer", "Rose Keep Bouncer"],
  "candy-land-bouncer": ["sugarhouse-bouncer", "Sugarhouse Bouncer"],
  "candy-swirl-18": ["sugarhouse-18", "Sugarhouse 18"],
  "castle-splash-combo": ["keep-and-splash-combo", "Keep & Splash Combo"],
  "circus-big-top-bouncer": ["big-top-bouncer", "Big Top Bouncer"],
  "coral-reef-18": ["reefline-18", "Reefline 18"],
  "cosmic-galaxy-18": ["stargazer-18", "Stargazer 18"],
  "cosmic-rocket-18": ["launchpad-18", "Launchpad 18"],
  "deep-sea-18": ["deepwater-18", "Deepwater 18"],
  "double-drop-racer-22": ["twin-falls-22", "Twin Falls 22"],
  "emerald-palm-18": ["everglade-18", "Everglade 18"],
  "farm-barnyard-bouncer": ["homestead-bouncer", "Homestead Bouncer"],
  "fiesta-splash-16": ["carnival-16", "Carnival 16"],
  "fire-and-ice-racer-18": ["frost-and-ember-18", "Frost & Ember 18"],
  "fire-dragon-18": ["ember-ridge-18", "Ember Ridge 18"],
  "great-white-shark-18": ["cape-fin-18", "Cape Fin 18"],
  "jungle-marble-19": ["rainforest-19", "Rainforest 19"],
  "jungle-safari-combo": ["safari-station-combo", "Safari Station Combo"],
  "lava-rock-red-18": ["redstone-18", "Redstone 18"],
  "lil-splash-junior": ["little-harbor-junior", "Little Harbor Junior"],
  "mega-monsoon-28": ["thunderhead-28", "Thunderhead 28"],
  "mega-waterpark-combo": ["grand-waterworks-combo", "Grand Waterworks Combo"],
  "mermaid-lagoon-slide": ["siren-cove-18", "Siren Cove 18"],
  "neon-glow-combo": ["nightglow-combo", "Nightglow Combo"],
  "octo-splash-18": ["tidepool-18", "Tidepool 18"],
  "palm-paradise-24": ["palmetto-coast-24", "Palmetto Coast 24"],
  "patriot-splash-16": ["liberty-16", "Liberty 16"],
  "pink-palace-bouncer": ["blossom-keep-bouncer", "Blossom Keep Bouncer"],
  "pirate-ship-slide": ["privateer-18", "Privateer 18"],
  "princess-palace-combo": ["crown-court-combo", "Crown Court Combo"],
  "purple-crush-18": ["amethyst-18", "Amethyst 18"],
  "rainbow-fun-combo": ["prism-combo", "Prism Combo"],
  "rainbow-splash-combo": ["prism-splash-combo", "Prism Splash Combo"],
  "rodeo-bull-rider": ["stampede-bull", "Stampede Bull"],
  "royal-blue-gold-18": ["regatta-18", "Regatta 18"],
  "royal-castle-bouncer": ["crown-keep-bouncer", "Crown Keep Bouncer"],
  "sunset-marble-18": ["sundown-18", "Sundown 18"],
  "sunset-splash-16": ["sundown-16", "Sundown 16"],
  "superhero-city-combo": ["metro-heroes-combo", "Metro Heroes Combo"],
  "t-rex-dinosaur-slide": ["fossil-ridge-18", "Fossil Ridge 18"],
  "tidal-tower-27": ["highwater-tower-27", "Highwater Tower 27"],
  "tiki-surf-slide": ["longboard-18", "Longboard 18"],
  "tropical-paradise-18": ["coastline-18", "Coastline 18"],
  "tropical-wave-18": ["breakwater-18", "Breakwater 18"],
  "tsunami-crush-20": ["surge-20", "Surge 20"],
  "unicorn-dreamland-bouncer": ["dreamfield-bouncer", "Dreamfield Bouncer"],
  "watermelon-splash-16": ["orchard-16", "Orchard 16"],
  "whale-splash-16": ["humpback-16", "Humpback 16"],
};

/**
 * Reprice: +4% then round to the nearest $5, so nothing lands on the old
 * catalog's $x9 endings. Applied to daily rate and sale price alike, keeping
 * the range's internal ordering intact — a bigger slide stays the pricier one.
 */
function reprice(cents: number | null): number | null {
  if (cents == null) return null;
  return Math.round((cents * 1.04) / 500) * 500;
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      dailyRateCents: true,
      salePriceCents: true,
    },
  });

  let changed = 0;
  let skipped = 0;

  for (const p of products) {
    const rename = RENAMES[p.slug];
    if (!rename) {
      skipped++;
      continue;
    }
    const [newSlug, newName] = rename;
    const daily = reprice(p.dailyRateCents);
    const sale = reprice(p.salePriceCents);

    // `name` is a localized JSON blob elsewhere in this schema; preserve its
    // shape rather than flattening it to a bare string.
    const existing = p.name as unknown;
    const nextName =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>), en: newName }
        : newName;

    changed++;
    console.log(
      `${DRY ? "[dry] " : ""}${p.slug} -> ${newSlug}  |  ${newName}  |  ` +
        `$${((p.dailyRateCents ?? 0) / 100).toFixed(0)}->$${((daily ?? 0) / 100).toFixed(0)}/day`,
    );

    if (!DRY) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          slug: newSlug,
          name: nextName as never,
          dailyRateCents: daily,
          salePriceCents: sale,
        },
      });
    }
  }

  console.log(
    `\n${DRY ? "Would rename" : "Renamed"} ${changed} products. ` +
      `${skipped} left alone (no mapping — already renamed, or new).`,
  );
  if (!DRY && changed > 0) {
    console.log(
      "Product URLs have changed. Redeploy so the sitemap regenerates, then " +
        "resubmit it — the old product URLs will 404 by design.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
