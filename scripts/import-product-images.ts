/**
 * Upload the 4-per-product photos in images/Products to R2, set each product's
 * gallery, make every product type=BOTH (so it appears on rent AND shop) with
 * both a daily rate and a sale price, and add the new Sunset Splash 16.
 * Run: dotenv -e .env.local -- tsx scripts/import-product-images.ts
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
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")}`;
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

// Which files belong to each product (timestamp/theme clusters).
const MATCH: Record<string, (f: string) => boolean> = {
  "tropical-wave-18": (f) => f.includes("backyard"),
  "double-drop-racer-22": (f) => f.includes("202606280826"),
  "tidal-tower-27": (f) => f.includes("202606280828"),
  "lil-splash-junior": (f) => f.includes("Toddler"),
  "cyclone-curve-24": (f) => f.includes("202606280834"),
  "palm-paradise-24": (f) =>
    f.includes("Tropical") || f.includes("Dual-lane_wave"),
  "blue-vortex-26": (f) => f.includes("Blue_Vortex"),
  "mega-monsoon-28": (f) => f.includes("Giant"),
  "sunset-splash-16": (f) => f.includes("sunset"),
};

// Sale price (cents) for every product so each can show on the shop page too.
const SALE: Record<string, number> = {
  "tropical-wave-18": 550000,
  "double-drop-racer-22": 750000,
  "tidal-tower-27": 980000,
  "lil-splash-junior": 240000,
  "cyclone-curve-24": 890000,
  "marble-rapids-20": 620000,
  "blue-vortex-26": 1050000,
  "mega-monsoon-28": 1350000,
  "palm-paradise-24": 820000,
  "sunset-splash-16": 360000,
};

async function main() {
  const files = (await readdir(DIR)).filter((f) => /\.(jpe?g)$/i.test(f));

  // 1) Create the new Sunset Splash 16 product.
  const backyardCat = await prisma.productCategory.findUnique({
    where: { slug: "backyard-slides" },
    select: { id: true },
  });
  await prisma.product.upsert({
    where: { slug: "sunset-splash-16" },
    update: {},
    create: {
      slug: "sunset-splash-16",
      sku: "BWS-SUNSET-SPLASH-16",
      name: L("Sunset Splash 16", "Sunset Splash 16"),
      type: "BOTH",
      status: "ACTIVE",
      dailyRateCents: 24500,
      salePriceCents: 360000,
      depositCents: 10000,
      categoryId: backyardCat?.id ?? null,
      featured: false,
      ratingAvg: 4.8,
      ratingCount: 15,
      shortDescription: L(
        "A compact single-lane slide in warm sunset colors with a splash pool.",
        "Un toboggan compact à couloir unique aux couleurs de coucher de soleil avec piscine.",
      ),
      description: L(
        "Big fun, small footprint. The Sunset Splash packs a slick 16-foot lane and a built-in splash pool into a size that fits almost any backyard — warm orange-and-coral colors that pop in every photo. Rent it for the party or buy one for the whole summer.",
        "Beaucoup de plaisir, peu d'espace. Le Sunset Splash réunit un couloir glissant de 16 pieds et une piscine intégrée dans un format qui tient dans presque toutes les cours — des couleurs chaudes qui ressortent sur chaque photo. À louer ou à acheter.",
      ),
      capacity: 1,
      ageRange: "5+",
      powerRequired: "1 × 1.5 HP blower, 110V",
      dimensions: { size: "16 ft L × 10 ft W × 16 ft H", weight: "210 lbs" },
      spaceRequired: { value: "21 × 15 ft level area" },
      features: [
        L("Compact footprint", "Format compact"),
        L("Warm-tone vinyl", "Vinyle aux tons chauds"),
        L("Splash pool", "Piscine d'éclaboussures"),
        L("Easy single-blower setup", "Installation à un seul souffleur"),
        L("Fully insured", "Entièrement assuré"),
      ],
      searchText: "Sunset Splash 16 compact water slide",
    },
  });

  // Ensure the new product has rental units.
  const sunset = await prisma.product.findUnique({
    where: { slug: "sunset-splash-16" },
    select: { id: true },
  });
  if (sunset) {
    const have = await prisma.rentalUnit.count({
      where: { productId: sunset.id },
    });
    for (let u = have; u < 2; u++) {
      await prisma.rentalUnit.create({
        data: {
          productId: sunset.id,
          unitLabel: `sunset-splash-16-unit-${u + 1}`,
        },
      });
    }
  }

  // 2) Every product → BOTH + a sale price (so it shows on rent and shop).
  for (const [slug, sale] of Object.entries(SALE)) {
    await prisma.product.updateMany({
      where: { slug },
      data: { type: "BOTH", salePriceCents: sale },
    });
  }

  // 3) Replace each mapped product's gallery with its 4 new photos.
  for (const [slug, match] of Object.entries(MATCH)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      console.log(`SKIP ${slug} (not found)`);
      continue;
    }
    const matched = files.filter(match).sort();
    if (matched.length === 0) {
      console.log(`SKIP ${slug} (no images)`);
      continue;
    }
    const urls: string[] = [];
    for (const f of matched.slice(0, 4)) urls.push(await upload(f));
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < urls.length; i++) {
      await prisma.productMedia.create({
        data: {
          productId: product.id,
          url: urls[i]!,
          isPrimary: i === 0,
          order: i,
        },
      });
    }
    console.log(`${slug}: ${urls.length} images`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
