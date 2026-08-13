/**
 * Import the AI-generated slide photos in images/Products/ as products.
 * Images are auto-grouped by the 12-digit timestamp embedded in each filename
 * (each slide's angles were generated within the same minute). Uploads every
 * image to R2 and creates one product per slide with bilingual copy + media.
 *
 * Run: dotenv -e .env.local -- tsx scripts/import-ai-slides.ts
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const accountId = process.env.R2_ACCOUNT_ID;
const r2 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
const DIR = path.join(process.cwd(), "images", "Products");
// French was retired (English-only site) — the second argument is
// ignored so the hundreds of existing call sites keep compiling while
// no new `fr` half is ever written to the database.
const L = (en: string, _fr?: string) => ({ en });

async function upload(file: string): Promise<string> {
  const safe = file
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-");
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: key,
      Body: await readFile(path.join(DIR, file)),
      ContentType: "image/jpeg",
    }),
  );
  return `${PUBLIC_BASE}/${key}`;
}

type Slide = {
  slug: string;
  name: string;
  ts: string[]; // timestamps that belong to this slide
  category: string;
  lane: "dual" | "single";
  height: number;
  rent: number; // $/day
  sale: number; // $
  deposit: number; // $
  rating: [number, number];
  themeEn: string;
  shortEn: string;
  shortFr: string;
};

const SLIDES: Slide[] = [
  {
    slug: "lava-rock-red-18",
    name: "Lava Rock Red 18",
    ts: ["202606291228"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [4.9, 18],
    themeEn: "black-and-charcoal marble with fiery red and orange lava streaks",
    shortEn:
      "Bold black-and-red lava-marble dual-lane water slide with a fiery splash pool.",
    shortFr:
      "Glissade double couloir en marbre lave noir et rouge avec pataugeoire ardente.",
  },
  {
    slug: "emerald-palm-18",
    name: "Emerald Palm 18",
    ts: ["202606291230"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 329,
    sale: 4700,
    deposit: 100,
    rating: [4.9, 22],
    themeEn:
      "rich green marble with tan rock panels and tropical palm trees on top",
    shortEn:
      "Lush green tropical dual-lane water slide with palm-tree top and a splash pool.",
    shortFr:
      "Glissade tropicale verte double couloir avec palmiers et pataugeoire.",
  },
  {
    slug: "fire-and-ice-racer-18",
    name: "Fire & Ice Racer 18",
    ts: ["202606291232"],
    category: "racing-slides",
    lane: "dual",
    height: 18,
    rent: 329,
    sale: 4700,
    deposit: 100,
    rating: [4.8, 16],
    themeEn:
      "a fiery red-orange lane beside an icy blue lane, split down the middle",
    shortEn:
      "Red-hot vs ice-cold dual racing water slide — pick your lane and race.",
    shortFr:
      "Glissade de course double couloir feu contre glace — choisissez votre voie.",
  },
  {
    slug: "deep-sea-18",
    name: "Deep Sea 18",
    ts: ["202606291233", "202606291234"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4400,
    deposit: 100,
    rating: [4.8, 14],
    themeEn:
      "deep navy and metallic-silver marble with white ocean wave crests",
    shortEn:
      "Navy-and-silver ocean-wave water slide with foaming wave crests and a splash pool.",
    shortFr:
      "Glissade océan bleu marine et argent avec crêtes d'écume et pataugeoire.",
  },
  {
    slug: "sunset-marble-18",
    name: "Sunset Marble 18",
    ts: ["202606291235"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [4.9, 20],
    themeEn:
      "a warm orange-to-pink-to-purple sunset marble gradient with palm trees",
    shortEn:
      "Sunset-gradient tropical dual-lane water slide with palm-tree top.",
    shortFr:
      "Glissade tropicale double couloir dégradé coucher de soleil avec palmiers.",
  },
  {
    slug: "jungle-marble-19",
    name: "Jungle Marble 19",
    ts: ["202606291238"],
    category: "tall-slides",
    lane: "dual",
    height: 19,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [4.8, 13],
    themeEn:
      "dark emerald and black jungle marble with palm trees and leafy vines",
    shortEn:
      "Deep-jungle green-and-black dual-lane water slide with palms and vines.",
    shortFr:
      "Glissade jungle vert foncé et noir double couloir avec palmiers et lianes.",
  },
  {
    slug: "patriot-splash-16",
    name: "Patriot Splash 16",
    ts: ["202606291240", "202606291241"],
    category: "racing-slides",
    lane: "dual",
    height: 16,
    rent: 279,
    sale: 3500,
    deposit: 75,
    rating: [4.8, 11],
    themeEn:
      "red, white and blue marble with stars — a patriotic dual slip-lane",
    shortEn:
      "Stars-and-stripes dual slip-lane water slide — perfect for the 4th of July.",
    shortFr:
      "Glissade double couloir rouge-blanc-bleu étoilée — parfaite pour le 4 juillet.",
  },
  {
    slug: "tsunami-crush-20",
    name: "Tsunami Crush 20",
    ts: ["202606291242", "202606291243"],
    category: "tall-slides",
    lane: "single",
    height: 20,
    rent: 309,
    sale: 4200,
    deposit: 100,
    rating: [4.9, 15],
    themeEn:
      "grey marble with a towering aqua-and-white foam wave crest on top",
    shortEn:
      "Towering grey-and-aqua wave water slide with a huge foam crest and splash pool.",
    shortFr:
      "Grande glissade vague grise et aqua avec énorme crête d'écume et pataugeoire.",
  },
  {
    slug: "cosmic-galaxy-18",
    name: "Cosmic Galaxy 18",
    ts: ["202606291245", "202606291246"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 329,
    sale: 4700,
    deposit: 100,
    rating: [4.9, 17],
    themeEn:
      "deep purple and teal galaxy marble with a starfield speckle and silver trim",
    shortEn: "Out-of-this-world purple-and-teal galaxy dual-lane water slide.",
    shortFr:
      "Glissade galaxie violette et sarcelle double couloir hors du commun.",
  },
  {
    slug: "candy-swirl-18",
    name: "Candy Swirl 18",
    ts: ["202606291247", "202606291248"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [5.0, 19],
    themeEn: "glossy pink-and-white candy swirl marble",
    shortEn:
      "Sweet pink-and-white candy-swirl dual-lane water slide with a splash pool.",
    shortFr:
      "Glissade tourbillon bonbon rose et blanc double couloir avec pataugeoire.",
  },
  {
    slug: "coral-reef-18",
    name: "Coral Reef 18",
    ts: ["202606291250"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [4.8, 12],
    themeEn: "deep teal marble with bright coral-orange wave trim",
    shortEn:
      "Teal-and-coral reef dual-lane water slide with a turquoise splash pool.",
    shortFr:
      "Glissade récif sarcelle et corail double couloir avec pataugeoire turquoise.",
  },
  {
    slug: "royal-blue-gold-18",
    name: "Royal Blue & Gold 18",
    ts: ["202606291256"],
    category: "tall-slides",
    lane: "dual",
    height: 18,
    rent: 319,
    sale: 4500,
    deposit: 100,
    rating: [4.9, 21],
    themeEn: "elegant royal-blue marble with gold trim and twin curved lanes",
    shortEn:
      "Elegant royal-blue-and-gold dual curved water slide with a splash pool.",
    shortFr:
      "Élégante glissade bleu royal et or à doubles couloirs incurvés avec pataugeoire.",
  },
  {
    slug: "watermelon-splash-16",
    name: "Watermelon Splash 16",
    ts: ["202606291302", "202606291303"],
    category: "backyard-slides",
    lane: "single",
    height: 16,
    rent: 269,
    sale: 3500,
    deposit: 75,
    rating: [4.8, 10],
    themeEn: "juicy watermelon red, green and yellow",
    shortEn:
      "Fun watermelon red-and-green backyard water slide with a splash pool.",
    shortFr:
      "Amusante glissade de jardin pastèque rouge et verte avec pataugeoire.",
  },
  {
    slug: "aqua-wave-15",
    name: "Aqua Wave 15",
    ts: ["202606291306"],
    category: "backyard-slides",
    lane: "single",
    height: 15,
    rent: 259,
    sale: 3300,
    deposit: 75,
    rating: [4.8, 9],
    themeEn: "fresh light-aqua marble with a big white foam wave crest",
    shortEn:
      "Fresh aqua single-lane backyard water slide with a white wave crest.",
    shortFr:
      "Glissade de jardin aqua simple couloir avec crête d'écume blanche.",
  },
];

function describe(s: Slide): { en: string } {
  const laneEn = s.lane === "dual" ? "dual-lane" : "single-lane";
  return {
    en: `Make a splash with the ${s.name} — a ${s.height}ft ${laneEn} commercial inflatable water slide finished in ${s.themeEn}. Riders climb, race down, and splash into the attached pool, making it a standout centerpiece for birthday parties, pool parties, school and church events, and summer celebrations. Delivered, set up, safely anchored, cleaned and fully insured by our team.`,
  };
}

function features(s: Slide) {
  const laneFeat =
    s.lane === "dual"
      ? L("Dual racing lanes", "Deux couloirs de course")
      : L("Smooth single lane", "Couloir simple fluide");
  return [
    laneFeat,
    L("Attached splash pool", "Pataugeoire attenante"),
    L("Delivered, set up & anchored", "Livrée, installée et ancrée"),
    L("Cleaned, sanitized & fully insured", "Nettoyée, désinfectée et assurée"),
  ];
}

// Order a group's files so the hero (front/3-4/theme/splash) is primary and
// the top/entrance close-ups come last.
function orderFiles(files: string[]): string[] {
  const rank = (f: string) => {
    const n = f.toLowerCase();
    if (n.includes("top") || n.includes("entrance")) return 2;
    if (n.includes("splash_pool")) return 1;
    return 0; // themed / front / generic hero
  };
  return [...files].sort((a, b) => rank(a) - rank(b));
}

async function main() {
  if (!PUBLIC_BASE) throw new Error("R2_PUBLIC_URL is not set in .env.local");

  const all = (await readdir(DIR)).filter((f) => /\.(jpe?g)$/i.test(f));
  // Map each timestamp → files.
  const byTs = new Map<string, string[]>();
  for (const f of all) {
    const m = f.match(/(2026062913\d\d|2026062912\d\d)/); // only the new 12:xx / 13:xx batch
    const ts = m?.[1];
    if (!ts) continue;
    const arr = byTs.get(ts) ?? [];
    arr.push(f);
    byTs.set(ts, arr);
  }

  const catIds = new Map<string, string>();
  for (const slug of [
    "tall-slides",
    "racing-slides",
    "backyard-slides",
    "toddler-slides",
  ]) {
    const row = await prisma.productCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (row) catIds.set(slug, row.id);
  }

  for (const s of SLIDES) {
    const files = orderFiles(s.ts.flatMap((t) => byTs.get(t) ?? []));
    if (files.length === 0) {
      console.log(`⚠️  ${s.name}: no files found for ${s.ts.join(",")}`);
      continue;
    }
    console.log(
      `\n• ${s.name} (${files.length} image${files.length > 1 ? "s" : ""})`,
    );
    const urls: string[] = [];
    for (const f of files) {
      urls.push(await upload(f));
      console.log(`    ↑ ${f}`);
    }

    const desc = describe(s);
    const dims =
      s.lane === "dual"
        ? { length: 34, width: 15, height: s.height }
        : { length: 28, width: 13, height: s.height };

    const data = {
      name: L(s.name, s.name),
      type: "BOTH" as const,
      status: "ACTIVE" as const,
      dailyRateCents: s.rent * 100,
      salePriceCents: s.sale * 100,
      depositCents: s.deposit * 100,
      dimensions: dims,
      capacity: s.lane === "dual" ? 2 : 1,
      ageRange: "5+",
      powerRequired:
        s.lane === "dual" ? "Two 20A / 110V outlets" : "One 20A / 110V outlet",
      ratingAvg: s.rating[0],
      ratingCount: s.rating[1],
      shortDescription: L(s.shortEn, s.shortFr),
      description: desc,
      features: features(s),
      categoryId: catIds.get(s.category) ?? null,
      searchText: `${s.name} ${s.shortEn}`.toLowerCase(),
    };

    const product = await prisma.product.upsert({
      where: { slug: s.slug },
      update: data,
      create: {
        slug: s.slug,
        sku: `BWS-${s.slug.toUpperCase()}`,
        featured: false,
        ...data,
      },
      select: { id: true },
    });

    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.createMany({
      data: urls.map((url, i) => ({
        productId: product.id,
        type: "IMAGE" as const,
        url,
        alt: L(
          `${s.name} inflatable water slide`,
          `Glissade d'eau gonflable ${s.name}`,
        ),
        order: i,
        isPrimary: i === 0,
      })),
    });
  }

  const total = await prisma.product.count();
  console.log(`\n✅ Done. Catalog now has ${total} products.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
