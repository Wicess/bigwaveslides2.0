/*
 * product-meta-and-alt.ts
 *
 * Fixes the two things the SEO audit found on all 53 product pages.
 *
 * 1. TITLES AND META DESCRIPTIONS WERE EFFECTIVELY IDENTICAL
 * metaTitle and metaDescription were null on every product, so lib/seo.ts fell
 * back to its template. Measured on the live site:
 *
 *   Rent the Redstone 18 — Delivered, Set Up & Insured
 *   Rent the Reefline 18 — Delivered, Set Up & Insured
 *   Rent the Regatta 18  — Delivered, Set Up & Insured
 *
 * 38 of 54 characters shared, and the description was one sentence with the
 * name and price swapped — so three same-priced products differed by a single
 * word. Google's starter guide asks for a title "unique to the page" and a
 * description "unique to one particular page"; Bing's guidelines §13 say
 * outright that duplicate titles and descriptions "may reduce indexing
 * reliability, ranking, and eligibility for grounding results and citations".
 * With 8 of 343 URLs indexed, that is a plausible contributor.
 *
 * These are generated from each product's OWN specs — height, lanes, age
 * floor, footprint, power, price and the hand-written short description — so
 * uniqueness is guaranteed by the data rather than by inventing adjectives,
 * and every claim is one the product row can back.
 *
 * 2. IMAGE ALT TEXT WAS MISSING OR STALE
 * 88 of 141 ProductMedia rows had no alt at all. The 53 that did still read
 * "Bali Breeze 18 inflatable water slide" — a pre-rename product name, the
 * same leak rebrand-catalog left in the blog. Alt is how Google and Bing
 * understand an image (Bing §12), and it is the accessible name for anyone
 * using a screen reader.
 *
 * Run: npm run db:product-meta-alt [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { productKindLabel } from "../lib/seo";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

const text = (v: unknown): string =>
  typeof v === "string" ? v : ((v as { en?: string })?.en ?? "");

/** "34 ft L × 15 ft W × 18 ft H" -> 18 */
function heightFt(dimensions: unknown): number | null {
  const size = (dimensions as { size?: string } | null)?.size ?? "";
  const m = /(\d+)\s*ft\s*H/i.exec(size);
  return m ? Number(m[1]) : null;
}

/** Short, human label for the title. Kept tight so titles stay under ~60. */
function shortKind(categorySlug?: string | null): string {
  switch (categorySlug) {
    case "bounce-houses":
      return "Bounce House";
    case "combo-units":
      return "Bounce & Slide Combo";
    case "party-attractions":
      return "Party Attraction";
    case "toddler-slides":
      return "Toddler Slide";
    default:
      return "Water Slide";
  }
}

/**
 * The lead sentence of a short description, cut at a real boundary.
 *
 * A naive character clip produced meta descriptions like "...the ocean finish
 * that sits with a pool rather than Ages 5+" — a dangling clause welded to the
 * next fragment. Search results show this text verbatim, so it has to end
 * somewhere a human would end it: a full stop, or the em-dash that these short
 * descriptions use to introduce their aside.
 */
function leadSentence(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  const stop = clean.search(/\.\s|\.$/);
  let lead = stop > 0 ? clean.slice(0, stop + 1) : clean;
  if (lead.length > max) {
    const dash = lead.lastIndexOf(" — ", max);
    if (dash > 28) lead = lead.slice(0, dash) + ".";
    else {
      const comma = lead.lastIndexOf(", ", max);
      lead =
        comma > 28
          ? lead.slice(0, comma) + "."
          : lead.slice(0, lead.lastIndexOf(" ", max)) + ".";
    }
  }
  if (!/[.!?]$/.test(lead)) lead += ".";
  return lead;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      category: { select: { slug: true } },
      media: { orderBy: { order: "asc" } },
    },
    orderBy: { slug: "asc" },
  });

  const titles = new Map<string, string[]>();
  const descs = new Map<string, string[]>();
  let mediaFixed = 0;

  for (const p of products) {
    const name = text(p.name);
    const kind = shortKind(p.category?.slug);
    const longKind = productKindLabel(p.category?.slug);
    const h = heightFt(p.dimensions);
    const price = p.dailyRateCents
      ? `$${Math.round(p.dailyRateCents / 100)}`
      : null;
    const space = (p.spaceRequired as { value?: string } | null)?.value ?? null;
    const age = p.ageRange;
    const short = text(p.shortDescription);

    // ── Title: name + the two facts that differ most across the catalog ──
    // e.g. "Reefline 18 Rental — 18 ft Water Slide, $330/day"
    // Don't repeat what the name already says. "Crown Court Combo Rental —
    // 15 ft Bounce & Slide Combo" wasted 20 characters and pushed the title
    // past the ~60 Google displays; the name already carries the category.
    const nameSaysKind = /\b(combo|bouncer|bounce house)\b/i.test(name);
    const kindPart = nameSaysKind ? null : kind;
    const titleBits = [
      [h ? `${h} ft` : null, kindPart].filter(Boolean).join(" ") || null,
      price ? `${price}/day` : null,
    ].filter(Boolean);
    const metaTitle = `${name} Rental — ${titleBits.join(", ")}`;

    // ── Description: the hand-written distinguishing line, then the specs a
    // renter actually decides on. Footprint/age/power vary per unit, so no two
    // come out the same even for identically-priced siblings.
    // Assemble from whole clauses and drop the least important one until it
    // fits, rather than truncating mid-word. Power is deliberately excluded:
    // "Two 20A / 110V outlets" is long, and lowercasing it to fit mangled the
    // units. It stays on the page and in the spec table where it belongs.
    const lead = leadSentence(short, 88);
    const optional = [
      age ? `Ages ${age}.` : null,
      space ? `Needs ${space}.` : null,
      price ? `${price}/day, delivered and set up.` : null,
    ].filter(Boolean) as string[];

    let metaDescription = [lead, ...optional].join(" ");
    // Shed from the middle (specs) before the price, which is the strongest
    // click signal in a snippet.
    for (
      let drop = 1;
      metaDescription.length > 160 && drop <= optional.length;
      drop++
    ) {
      metaDescription = [lead, ...optional.slice(drop)].join(" ");
    }
    metaDescription = metaDescription.replace(/\s+/g, " ").trim();

    (titles.get(metaTitle) ?? titles.set(metaTitle, []).get(metaTitle)!).push(
      p.slug,
    );
    (
      descs.get(metaDescription) ??
      descs.set(metaDescription, []).get(metaDescription)!
    ).push(p.slug);

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
      await prisma.product.update({
        where: { id: p.id },
        data: {
          metaTitle: { en: metaTitle },
          metaDescription: { en: metaDescription },
        },
      });
    }
  }

  const dupT = [...titles].filter(([, v]) => v.length > 1);
  const dupD = [...descs].filter(([, v]) => v.length > 1);
  const tLens = [...titles.keys()].map((t) => t.length);
  const dLens = [...descs.keys()].map((d) => d.length);

  console.log(`products:       ${products.length}`);
  console.log(
    `unique titles:  ${titles.size}/${products.length}  (len ${Math.min(...tLens)}-${Math.max(...tLens)})`,
  );
  console.log(
    `unique descs:   ${descs.size}/${products.length}  (len ${Math.min(...dLens)}-${Math.max(...dLens)})`,
  );
  console.log(`image alts ${DRY ? "to fix" : "fixed"}: ${mediaFixed}`);
  if (dupT.length)
    console.log(
      "⚠ duplicate titles:",
      dupT.map(([k, v]) => `${k} -> ${v.join(",")}`).join(" | "),
    );
  if (dupD.length)
    console.log(
      "⚠ duplicate descriptions:",
      dupD.map(([, v]) => v.join(",")).join(" | "),
    );

  console.log("\nsamples:");
  for (const s of [
    "reefline-18",
    "redstone-18",
    "regatta-18",
    "little-harbor-junior",
    "thunderhead-28",
  ]) {
    const p = await prisma.product.findUnique({
      where: { slug: s },
      select: { metaTitle: true, metaDescription: true },
    });
    if (p) {
      console.log(`  ${s}`);
      console.log(`    T(${text(p.metaTitle).length}): ${text(p.metaTitle)}`);
      console.log(
        `    D(${text(p.metaDescription).length}): ${text(p.metaDescription)}`,
      );
    }
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
