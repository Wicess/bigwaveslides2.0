/**
 * One-off: upload the slide product photos (images/Products) to R2 and upsert
 * the catalog of water slides (with full specs, prices, features, categories
 * and rental units). Run:
 *   dotenv -e .env.local -- tsx scripts/import-slides.ts
 */
import { readFile } from "node:fs/promises";
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

const L = (en: string, fr: string) => ({ en, fr });

async function uploadImage(slug: string): Promise<string> {
  const body = await readFile(
    path.join(process.cwd(), "images", "Products", `${slug}.jpg`),
  );
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `products/${Date.now()}-${rand}-${slug}.jpg`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
    }),
  );
  return `${PUBLIC_BASE}/${key}`;
}

const CATEGORIES = [
  { slug: "backyard-slides", name: L("Backyard slides", "Toboggans de jardin") },
  { slug: "racing-slides", name: L("Racing & dual-lane", "Course et double couloir") },
  { slug: "tall-slides", name: L("Tall & extreme", "Hauts et extrêmes") },
  { slug: "toddler-slides", name: L("Toddler", "Tout-petits") },
];

type Slide = {
  slug: string;
  category: string;
  type: "RENTAL" | "SALE" | "BOTH";
  featured?: boolean;
  name: { en: string; fr: string };
  short: { en: string; fr: string };
  desc: { en: string; fr: string };
  features: { en: string; fr: string }[];
  dailyRate?: number;
  sale?: number;
  deposit: number;
  capacity: number;
  ageRange: string;
  dimensions: string;
  weight: string;
  power: string;
  setup: string;
};

const SLIDES: Slide[] = [
  {
    slug: "tropical-wave-18",
    category: "backyard-slides",
    type: "RENTAL",
    featured: true,
    name: L("Tropical Wave 18", "Tropical Wave 18"),
    short: L(
      "Single-lane backyard wave slide with a splash pool — delivered and set up.",
      "Toboggan vague à couloir unique avec piscine — livré et installé.",
    ),
    desc: L(
      "Our most-booked backyard slide. An 18-foot ocean-blue wave with a climb wall, a slick wet lane, and a generous splash pool at the bottom — the perfect centerpiece for birthdays and summer parties.",
      "Notre toboggan de jardin le plus réservé. Une vague bleu océan de 18 pieds avec mur d'escalade, couloir glissant et grande piscine à la base — la pièce maîtresse idéale pour les anniversaires et fêtes d'été.",
    ),
    features: [
      L("Commercial-grade vinyl", "Vinyle de qualité commerciale"),
      L("Splash pool", "Piscine d'éclaboussures"),
      L("Climb wall", "Mur d'escalade"),
      L("Safety netting", "Filets de sécurité"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 295,
    deposit: 150,
    capacity: 1,
    ageRange: "5+",
    dimensions: "18 ft L × 11 ft W × 18 ft H",
    weight: "240 lbs",
    power: "1 × 1.5 HP blower, 110V",
    setup: "23 × 16 ft level area",
  },
  {
    slug: "double-drop-racer-22",
    category: "racing-slides",
    type: "RENTAL",
    name: L("Double Drop Racer 22", "Double Drop Racer 22"),
    short: L(
      "Dual-lane racing slide — race a friend to the splash.",
      "Toboggan de course à deux couloirs — défiez un ami jusqu'à l'eau.",
    ),
    desc: L(
      "Two slick lanes side by side so guests can race to the bottom. A 22-foot royal-blue thriller that keeps the line moving fast at any party.",
      "Deux couloirs glissants côte à côte pour des courses jusqu'en bas. Un bolide bleu roi de 22 pieds qui fait avancer la file rapidement.",
    ),
    features: [
      L("Side-by-side racing lanes", "Couloirs de course côte à côte"),
      L("Dual climb", "Double montée"),
      L("Soft landing lanes", "Couloirs d'atterrissage moelleux"),
      L("Commercial vinyl", "Vinyle commercial"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 395,
    deposit: 200,
    capacity: 2,
    ageRange: "6+",
    dimensions: "30 ft L × 16 ft W × 22 ft H",
    weight: "360 lbs",
    power: "2 × 1.5 HP blowers, 110V",
    setup: "36 × 22 ft level area",
  },
  {
    slug: "tidal-tower-27",
    category: "tall-slides",
    type: "BOTH",
    featured: true,
    name: L("Tidal Tower 27", "Tidal Tower 27"),
    short: L(
      "A towering 27 ft steep drop with a big plunge pool.",
      "Une descente abrupte de 27 pi avec grande piscine.",
    ),
    desc: L(
      "For thrill-seekers. The Tidal Tower's steep 27-foot drop and deep plunge pool deliver a real waterpark rush — rent it for events or buy it for your venue.",
      "Pour les amateurs de sensations. La descente abrupte de 27 pieds et la piscine profonde du Tidal Tower offrent une vraie montée d'adrénaline — à louer ou à acheter.",
    ),
    features: [
      L("Extra-tall drop", "Descente très haute"),
      L("Misting system", "Système de brumisation"),
      L("Reinforced anchor points", "Points d'ancrage renforcés"),
      L("Deep plunge pool", "Piscine profonde"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 525,
    sale: 9800,
    deposit: 250,
    capacity: 2,
    ageRange: "8+",
    dimensions: "34 ft L × 18 ft W × 27 ft H",
    weight: "520 lbs",
    power: "2 × 2 HP blowers, 110V",
    setup: "40 × 24 ft level area",
  },
  {
    slug: "lil-splash-junior",
    category: "toddler-slides",
    type: "BOTH",
    name: L("Lil' Splash Junior", "Lil' Splash Junior"),
    short: L(
      "A gentle toddler slide with a shallow splash pool.",
      "Un petit toboggan doux avec piscine peu profonde.",
    ),
    desc: L(
      "Made for little ones. A soft, low slide into a shallow built-in pool in cheerful colors — safe, supervised fun for ages 2 to 6. Rent it for a party or buy one for the backyard.",
      "Conçu pour les petits. Un toboggan bas et doux vers une piscine peu profonde aux couleurs gaies — du plaisir sûr et surveillé pour les 2 à 6 ans. À louer ou à acheter.",
    ),
    features: [
      L("Gentle low slide", "Toboggan bas et doux"),
      L("Shallow splash pool", "Piscine peu profonde"),
      L("Soft padded walls", "Parois rembourrées"),
      L("Toddler-safe", "Sécuritaire pour tout-petits"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 165,
    sale: 2400,
    deposit: 100,
    capacity: 1,
    ageRange: "2–6",
    dimensions: "13 ft L × 8 ft W × 8 ft H",
    weight: "95 lbs",
    power: "1 × 1 HP blower, 110V",
    setup: "17 × 12 ft level area",
  },
  {
    slug: "cyclone-curve-24",
    category: "tall-slides",
    type: "RENTAL",
    name: L("Cyclone Curve 24", "Cyclone Curve 24"),
    short: L(
      "A curved spiral chute with silver wave graphics and a pool.",
      "Une glissade courbe en spirale avec piscine.",
    ),
    desc: L(
      "The Cyclone's sweeping curved tube adds a twist of speed before launching riders down a slick lane into the splash pool. A 24-foot showpiece in deep blue and silver.",
      "Le tube courbé du Cyclone ajoute une touche de vitesse avant de lancer les glisseurs dans la piscine. Une pièce maîtresse de 24 pieds en bleu profond et argent.",
    ),
    features: [
      L("Curved spiral chute", "Glissade en spirale"),
      L("Faster ride", "Descente plus rapide"),
      L("Splash pool", "Piscine d'éclaboussures"),
      L("Climb wall", "Mur d'escalade"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 450,
    deposit: 200,
    capacity: 1,
    ageRange: "7+",
    dimensions: "32 ft L × 15 ft W × 24 ft H",
    weight: "410 lbs",
    power: "2 × 1.5 HP blowers, 110V",
    setup: "38 × 21 ft level area",
  },
  {
    slug: "marble-rapids-20",
    category: "backyard-slides",
    type: "RENTAL",
    name: L("Marble Rapids 20", "Marble Rapids 20"),
    short: L(
      "Dual marble-swirl lanes into a wide splash pool.",
      "Doubles couloirs marbrés vers une grande piscine.",
    ),
    desc: L(
      "A 20-foot crowd-pleaser in blue-and-green marble with two wet lanes and a wide splash pool — big-slide fun that still fits a backyard.",
      "Un favori de 20 pieds en marbre bleu et vert avec deux couloirs et une grande piscine — du gros plaisir qui tient dans une cour.",
    ),
    features: [
      L("Marble-swirl vinyl", "Vinyle marbré"),
      L("Wide splash pool", "Grande piscine"),
      L("Dual lanes", "Deux couloirs"),
      L("Non-slip steps", "Marches antidérapantes"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 325,
    deposit: 150,
    capacity: 2,
    ageRange: "5+",
    dimensions: "26 ft L × 14 ft W × 20 ft H",
    weight: "300 lbs",
    power: "2 × 1.5 HP blowers, 110V",
    setup: "31 × 19 ft level area",
  },
  {
    slug: "blue-vortex-26",
    category: "tall-slides",
    type: "BOTH",
    name: L("Blue Vortex 26", "Blue Vortex 26"),
    short: L(
      "A 26 ft spiral tower slide with wave graphics and a pool.",
      "Une tour en spirale de 26 pi avec piscine.",
    ),
    desc: L(
      "The Blue Vortex winds riders through a tall spiral before a fast finish into the splash pool. A statement attraction for big events — rent it or buy it for your venue.",
      "Le Blue Vortex fait tournoyer les glisseurs dans une haute spirale avant une arrivée rapide dans la piscine. Une attraction marquante pour les grands événements — à louer ou à acheter.",
    ),
    features: [
      L("Spiral tower", "Tour en spirale"),
      L("High capacity", "Grande capacité"),
      L("Splash pool", "Piscine d'éclaboussures"),
      L("Reinforced anchor points", "Points d'ancrage renforcés"),
      L("Fully insured", "Entièrement assuré"),
    ],
    dailyRate: 480,
    sale: 10500,
    deposit: 250,
    capacity: 1,
    ageRange: "8+",
    dimensions: "33 ft L × 16 ft W × 26 ft H",
    weight: "480 lbs",
    power: "2 × 2 HP blowers, 110V",
    setup: "39 × 23 ft level area",
  },
];

async function main() {
  // Categories
  const catId = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!;
    const row = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: i },
      create: { slug: c.slug, name: c.name, order: i },
    });
    catId.set(c.slug, row.id);
  }

  for (const s of SLIDES) {
    const url = await uploadImage(s.slug);
    const data = {
      name: s.name,
      slug: s.slug,
      sku: `BWS-${s.slug.toUpperCase()}`,
      type: s.type,
      status: "ACTIVE" as const,
      salePriceCents: s.sale ? Math.round(s.sale * 100) : null,
      dailyRateCents: s.dailyRate ? Math.round(s.dailyRate * 100) : null,
      depositCents: Math.round(s.deposit * 100),
      categoryId: catId.get(s.category) ?? null,
      featured: s.featured ?? false,
      shortDescription: s.short,
      description: s.desc,
      capacity: s.capacity,
      ageRange: s.ageRange,
      powerRequired: s.power,
      dimensions: { size: s.dimensions, weight: s.weight },
      spaceRequired: { value: s.setup },
      features: s.features,
      searchText: `${s.name.en} ${s.short.en} water slide`,
    };

    const product = await prisma.product.upsert({
      where: { slug: s.slug },
      update: data,
      create: data,
      select: { id: true },
    });

    // Primary image
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.create({
      data: { productId: product.id, url, isPrimary: true, order: 0 },
    });

    // Rental units so rentable slides are bookable.
    if (s.type !== "SALE") {
      const have = await prisma.rentalUnit.count({ where: { productId: product.id } });
      for (let u = have; u < 2; u++) {
        await prisma.rentalUnit.create({
          data: { productId: product.id, unitLabel: `${s.slug}-unit-${u + 1}` },
        });
      }
    }

    console.log(`✓ ${s.slug} (${s.type}) → ${url}`);
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
