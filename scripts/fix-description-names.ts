/*
 * fix-description-names.ts
 *
 * The catalog rename changed product NAMES but not the prose, so descriptions
 * still referred to products by their old names — "The Tidal Tower 27 is our
 * tallest slide" on a product now called Highwater Tower 27. Wrong on its own
 * terms, and it leaks the previous brand's naming into customer-facing copy.
 *
 * Mechanical pass only: it swaps old names for new inside description text
 * using the same map as the rename. It does NOT rewrite the prose, which is
 * still shared with the other site and needs writing, not substitution.
 *
 * Run: npm run db:fix-desc-names [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

const RENAMES: [string, string][] = [
  ["Tidal Tower 27", "Highwater Tower 27"],
  ["Tropical Wave 18", "Breakwater 18"],
  ["Double Drop Racer 22", "Twin Falls 22"],
  ["Mega Waterpark Combo", "Grand Waterworks Combo"],
  ["Palm Paradise 24", "Palmetto Coast 24"],
  ["Tropical Paradise 18", "Coastline 18"],
  ["Mega Monsoon 28", "Thunderhead 28"],
  ["Blue Vortex 26", "Vortex Peak 26"],
  ["Tsunami Crush 20", "Surge 20"],
  ["Emerald Palm 18", "Everglade 18"],
  ["Fire & Ice Racer 18", "Frost & Ember 18"],
  ["Fire Dragon 18", "Ember Ridge 18"],
  ["Great White Shark 18", "Cape Fin 18"],
  ["Cosmic Galaxy 18", "Stargazer 18"],
  ["Cosmic Rocket 18", "Launchpad 18"],
  ["Deep Sea 18", "Deepwater 18"],
  ["Coral Reef 18", "Reefline 18"],
  ["Blue Crush 18", "Bluepoint 18"],
  ["Purple Crush 18", "Amethyst 18"],
  ["Candy Swirl 18", "Sugarhouse 18"],
  ["Sunset Marble 18", "Sundown 18"],
  ["Sunset Splash 16", "Sundown 16"],
  ["Royal Blue & Gold 18", "Regatta 18"],
  ["Lava Rock Red 18", "Redstone 18"],
  ["Jungle Marble 19", "Rainforest 19"],
  ["Bali Breeze 18", "Sandbar 18"],
  ["Aqua Wave 15", "Cascade 15"],
  ["Arctic Frost 18", "Glacier Run 18"],
  ["Mermaid Lagoon 18", "Siren Cove 18"],
  ["Pirate Ship 18", "Privateer 18"],
  ["T-Rex Dino 18", "Fossil Ridge 18"],
  ["Tiki Surf 18", "Longboard 18"],
  ["Octo Splash 18", "Tidepool 18"],
  ["Whale Splash 16", "Humpback 16"],
  ["Watermelon Splash 16", "Orchard 16"],
  ["Patriot Splash 16", "Liberty 16"],
  ["Fiesta Splash 16", "Carnival 16"],
  ["Lil' Splash Junior", "Little Harbor Junior"],
  ["Castle Splash Combo", "Keep & Splash Combo"],
  ["Princess Palace Combo", "Crown Court Combo"],
  ["Rainbow Splash Combo", "Prism Splash Combo"],
  ["Rainbow Fun Combo", "Prism Combo"],
  ["Jungle Safari Combo", "Safari Station Combo"],
  ["Superhero City Combo", "Metro Heroes Combo"],
  ["Neon Glow Combo", "Nightglow Combo"],
  ["Royal Castle Bouncer", "Crown Keep Bouncer"],
  ["Blush Castle Bouncer", "Rose Keep Bouncer"],
  ["Pink Palace Bouncer", "Blossom Keep Bouncer"],
  ["Candy Land Bouncer", "Sugarhouse Bouncer"],
  ["Circus Big Top Bouncer", "Big Top Bouncer"],
  ["Farm Barnyard Bouncer", "Homestead Bouncer"],
  ["Unicorn Dreamland Bouncer", "Dreamfield Bouncer"],
  ["Rodeo Bull Rider", "Stampede Bull"],
];

function swap(v: unknown): { value: unknown; hits: number } {
  if (typeof v === "string") {
    let s = v,
      n = 0;
    for (const [o, x] of RENAMES)
      if (s.includes(o)) {
        n += s.split(o).length - 1;
        s = s.split(o).join(x);
      }
    return { value: s, hits: n };
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const out: Record<string, unknown> = {};
    let n = 0;
    for (const [k, inner] of Object.entries(v as Record<string, unknown>)) {
      const r = swap(inner);
      out[k] = r.value;
      n += r.hits;
    }
    return { value: out, hits: n };
  }
  return { value: v, hits: 0 };
}

async function main() {
  const rows = await prisma.product.findMany({
    select: { id: true, slug: true, shortDescription: true, description: true },
  });
  let changed = 0,
    total = 0;
  for (const p of rows) {
    const s = swap(p.shortDescription),
      d = swap(p.description);
    const hits = s.hits + d.hits;
    if (!hits) continue;
    changed++;
    total += hits;
    console.log(`${DRY ? "[dry] " : ""}${p.slug}: ${hits} old name(s)`);
    if (!DRY) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          shortDescription: s.value as never,
          description: d.value as never,
        },
      });
    }
  }
  console.log(
    `\n${DRY ? "Would fix" : "Fixed"} ${total} stale name(s) across ${changed} products.`,
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
