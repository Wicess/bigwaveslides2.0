/*
 * fix-blog-product-links.ts
 *
 * Repoints every product link inside a blog post at the slug that product
 * actually has now, and swaps the old product names in the surrounding prose.
 *
 * WHY
 * rebrand-catalog.ts renamed the products, which changed their slugs.
 * fix-description-names.ts then patched the stale names inside the CATALOG
 * descriptions — but nothing ever touched the blog. The result, measured
 * before this ran: 52 distinct dead product slugs referenced across 43
 * published posts, and not one working /rent/ link in the entire blog.
 *
 * Every one of them was a 404 for a reader mid-article and a dead internal link
 * for a crawler, on the exact pages meant to be pushing equity toward the
 * catalog. It also left the previous brand's product names — "Coral Reef 18",
 * "Tidal Tower 27" — in customer-facing prose, which is the same leak
 * lib/brand.ts exists to close.
 *
 * WHAT IT DOES
 *   1. old slug -> current slug, derived from each product's SKU (the SKUs
 *      still encode the pre-rename names, so they ARE the old-slug map).
 *   2. old display name -> current display name in the body text, which also
 *      repairs the anchor text of every link it just repointed.
 *
 * ONE MANUAL MAPPING: "Cyclone Curve 24" is not a rename — that product is
 * gone from the catalog entirely, so its links pointed at nothing to rename to.
 * It is redirected to the Palmetto Coast 24, the closest live equivalent
 * (24 ft, twin wave lanes). Flagged here rather than buried because it is the
 * one substitution in this script a human might disagree with.
 *
 * Run: npm run db:fix-blog-product-links [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

/** Old display name -> current display name. Mirrors fix-description-names.ts. */
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
  // Retired product, not a rename — see the header note.
  ["Cyclone Curve 24", "Palmetto Coast 24"],
];

/** Slugs whose product no longer exists, pointed at the nearest live unit. */
const RETIRED_SLUGS: Record<string, string> = {
  "cyclone-curve-24": "palmetto-coast-24",
};

async function main() {
  const products = await prisma.product.findMany({
    select: { slug: true, sku: true },
  });

  // The SKUs still encode the pre-rename names, so they reconstruct the old
  // slugs exactly: BWS-AQUA-WAVE-15 -> "aqua-wave-15" -> now "cascade-15".
  const slugMap: Record<string, string> = { ...RETIRED_SLUGS };
  for (const p of products) {
    const oldSlug = p.sku.replace(/^BWS-/, "").toLowerCase();
    if (oldSlug !== p.slug) slugMap[oldSlug] = p.slug;
  }

  const live = new Set(products.map((p) => p.slug));
  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, content: true, excerpt: true },
  });

  let changedPosts = 0;
  let linkFixes = 0;
  let nameFixes = 0;
  const unresolved = new Map<string, number>();

  for (const post of posts) {
    const raw: unknown = post.content;
    const original =
      typeof raw === "string" ? raw : ((raw as { en?: string })?.en ?? "");
    if (!original) continue;

    let body = original;
    let links = 0;
    let names = 0;

    // 1. Repoint /rent/<slug> and /shop/<slug> at the current slug.
    body = body.replace(
      /\]\(\/(rent|shop)\/([a-z0-9-]+)\)/g,
      (whole, section: string, slug: string) => {
        if (live.has(slug)) return whole;
        const next = slugMap[slug];
        if (!next) {
          unresolved.set(slug, (unresolved.get(slug) ?? 0) + 1);
          return whole;
        }
        links++;
        return `](/${section}/${next})`;
      },
    );

    // 2. Swap old product names in the prose, which also repairs anchor text.
    for (const [oldName, newName] of RENAMES) {
      if (!body.includes(oldName)) continue;
      names += body.split(oldName).length - 1;
      body = body.split(oldName).join(newName);
    }

    if (body === original) continue;

    changedPosts++;
    linkFixes += links;
    nameFixes += names;
    console.log(
      `${DRY ? "[dry] " : ""}${post.slug}  (${links} link${links === 1 ? "" : "s"}, ${names} name${names === 1 ? "" : "s"})`,
    );

    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: { en: body } },
      });
    }
  }

  if (unresolved.size) {
    console.log("\n⚠ slugs with no mapping (left untouched):");
    for (const [slug, n] of [...unresolved].sort()) {
      console.log(`   /${slug}  ×${n}`);
    }
  }

  console.log(
    `\n${DRY ? "[dry] would fix" : "fixed"} ${linkFixes} links and ${nameFixes} stale names across ${changedPosts} posts.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
