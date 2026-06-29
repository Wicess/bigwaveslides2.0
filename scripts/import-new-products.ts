/**
 * Import the new product photos in images/Products/ (the photo_*.jpg set) as
 * products. Images of the same unit are grouped under one product (first image
 * = primary). Uploads each photo to R2, creates categories as needed, and
 * upserts each product with researched name, pricing, features & dimensions.
 *
 * Run: dotenv -e .env.local -- tsx scripts/import-new-products.ts
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
  endpoint: process.env.R2_ENDPOINT ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
const DIR = path.join(process.cwd(), "images", "Products");
const L = (en: string, fr: string) => ({ en, fr });

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

// New categories to ensure exist (slug → bilingual name + order).
const CATEGORIES: { slug: string; name: { en: string; fr: string }; order: number }[] = [
  { slug: "combo-units", name: L("Combo units", "Combinés"), order: 5 },
  { slug: "bounce-houses", name: L("Bounce houses", "Châteaux gonflables"), order: 6 },
  { slug: "party-attractions", name: L("Party attractions", "Attractions de fête"), order: 7 },
];

type NewProduct = {
  slug: string;
  name: string;
  category: string;
  type: "BOTH" | "RENTAL";
  dailyRateCents: number;
  salePriceCents?: number;
  depositCents: number;
  dimensions: { length: number; width: number; height: number };
  capacity: number;
  ageRange: string;
  powerRequired: string;
  ratingAvg: number;
  ratingCount: number;
  shortDescription: { en: string; fr: string };
  description: { en: string; fr: string };
  features: { en: string; fr: string }[];
  images: string[]; // first = primary
};

const PRODUCTS: NewProduct[] = [
  {
    slug: "bali-breeze-18",
    name: "Bali Breeze 18",
    category: "tall-slides",
    type: "BOTH",
    dailyRateCents: 42500,
    salePriceCents: 580000,
    depositCents: 10000,
    dimensions: { length: 35, width: 15, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 24,
    shortDescription: L(
      "Tropical green-marble dual-lane water slide with palm-tree top and a long slip-lane splash pool.",
      "Glissade d'eau double couloir marbre vert tropical, sommet palmiers et longue pataugeoire.",
    ),
    description: L(
      "Bring the islands home. The Bali Breeze 18 is a towering tropical dual-lane water slide wrapped in lush green marble with palm-tree accents up top. Two racing lanes feed a long slip-lane that empties into a generous splash pool — perfect for backyard parties, pool parties, and summer events. Delivered, set up, and fully insured.",
      "Ramenez les îles chez vous. La Bali Breeze 18 est une glissade tropicale double couloir habillée de marbre vert luxuriant avec palmiers au sommet. Deux couloirs de course mènent à un long couloir glissant qui se déverse dans une grande pataugeoire — parfaite pour fêtes de jardin, fêtes de piscine et événements d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Dual racing lanes", "Deux couloirs de course"),
      L("Long slip-lane into splash pool", "Long couloir glissant vers pataugeoire"),
      L("Tropical palm-tree theme", "Thème tropical palmiers"),
      L("Cleaned & sanitized before delivery", "Nettoyée et désinfectée avant livraison"),
    ],
    images: [
      "photo_2026-06-28_07-30-42.jpg",
      "photo_2026-06-28_07-30-45.jpg",
      "photo_2026-06-29_11-29-14.jpg",
    ],
  },
  {
    slug: "purple-crush-18",
    name: "Purple Crush 18",
    category: "tall-slides",
    type: "BOTH",
    dailyRateCents: 42500,
    salePriceCents: 560000,
    depositCents: 10000,
    dimensions: { length: 33, width: 15, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.8,
    ratingCount: 17,
    shortDescription: L(
      "Vibrant purple, blue & orange marble dual-lane slide with palm-tree top and front slip-lane.",
      "Glissade double couloir marbre violet, bleu et orange avec palmiers et couloir glissant avant.",
    ),
    description: L(
      "Bold and unmistakable, the Purple Crush 18 pops with swirling purple, blue and orange marble and a tropical palm-tree crown. Two lanes race down into a wide slip-lane and splash pool, making it a crowd magnet at birthdays, block parties and festivals. Delivered, anchored, and fully insured by our crew.",
      "Audacieuse et inoubliable, la Purple Crush 18 éclate de marbre tourbillonnant violet, bleu et orange avec une couronne de palmiers tropicaux. Deux couloirs filent vers un large couloir glissant et une pataugeoire — un aimant à foule pour anniversaires, fêtes de quartier et festivals. Livrée, ancrée et entièrement assurée.",
    ),
    features: [
      L("Dual racing lanes", "Deux couloirs de course"),
      L("Eye-catching marble finish", "Finition marbre éclatante"),
      L("Front slip-lane & splash pool", "Couloir glissant avant et pataugeoire"),
      L("Pro setup & anchoring included", "Installation et ancrage pro inclus"),
    ],
    images: ["photo_2026-06-28_07-32-43.jpg", "photo_2026-06-28_07-32-52.jpg"],
  },
  {
    slug: "blue-crush-18",
    name: "Blue Crush 18",
    category: "tall-slides",
    type: "BOTH",
    dailyRateCents: 42500,
    salePriceCents: 560000,
    depositCents: 10000,
    dimensions: { length: 33, width: 15, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 21,
    shortDescription: L(
      "Cool blue & silver marble tropical slide with palm trees and a curved splash pool.",
      "Glissade tropicale marbre bleu et argent avec palmiers et pataugeoire incurvée.",
    ),
    description: L(
      "Cool, crisp and refreshing, the Blue Crush 18 wraps a tall tropical slide in shimmering blue and silver marble with palm-tree accents. The curved lane sweeps riders into a roomy splash pool — a guaranteed favorite for hot-day pool parties and summer celebrations. Delivered, set up, and fully insured.",
      "Fraîche et rafraîchissante, la Blue Crush 18 habille une grande glissade tropicale de marbre bleu et argent scintillant avec palmiers. Le couloir incurvé emporte les utilisateurs dans une pataugeoire spacieuse — un favori garanti pour les fêtes de piscine et les célébrations d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Shimmering blue marble finish", "Finition marbre bleu scintillant"),
      L("Curved lane into splash pool", "Couloir incurvé vers pataugeoire"),
      L("Tropical palm-tree theme", "Thème tropical palmiers"),
      L("Cleaned & sanitized before delivery", "Nettoyée et désinfectée avant livraison"),
    ],
    images: ["photo_2026-06-29_11-28-52.jpg", "photo_2026-06-29_11-28-59.jpg"],
  },
  {
    slug: "fiesta-splash-16",
    name: "Fiesta Splash 16",
    category: "backyard-slides",
    type: "BOTH",
    dailyRateCents: 29500,
    salePriceCents: 320000,
    depositCents: 8000,
    dimensions: { length: 28, width: 13, height: 16 },
    capacity: 1,
    ageRange: "4+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 14,
    shortDescription: L(
      "Bright single-lane backyard water slide with palm-tree accents and a big splash pool.",
      "Glissade de jardin simple couloir aux couleurs vives avec palmiers et grande pataugeoire.",
    ),
    description: L(
      "Colorful, compact and built for backyards, the Fiesta Splash 16 brings big fun in a single-lane footprint. Cheerful red, yellow and green panels with palm-tree accents lead into a large splash pool — ideal for birthday parties and family gatherings where space is tight but excitement isn't. Delivered, set up, and fully insured.",
      "Colorée, compacte et conçue pour les jardins, la Fiesta Splash 16 offre beaucoup de plaisir sur un seul couloir. Des panneaux rouges, jaunes et verts joyeux avec palmiers mènent à une grande pataugeoire — idéale pour anniversaires et réunions de famille. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Compact single-lane design", "Conception compacte à couloir simple"),
      L("Fits most backyards", "S'adapte à la plupart des jardins"),
      L("Large splash pool", "Grande pataugeoire"),
      L("Great for younger kids", "Idéale pour les plus jeunes"),
    ],
    images: ["photo_2026-06-28_07-40-20.jpg"],
  },
  {
    slug: "whale-splash-16",
    name: "Whale Splash 16",
    category: "backyard-slides",
    type: "BOTH",
    dailyRateCents: 35000,
    salePriceCents: 420000,
    depositCents: 8000,
    dimensions: { length: 30, width: 26, height: 16 },
    capacity: 2,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 12,
    shortDescription: L(
      "Adorable blue whale dual-lane slide that empties into a huge inflatable splash pool.",
      "Adorable glissade baleine bleue double couloir se déversant dans une immense pataugeoire gonflable.",
    ),
    description: L(
      "A splash hit for younger crowds, the Whale Splash 16 features a friendly blue whale at the top and two gentle lanes that pour into an oversized inflatable pool. Toddlers and big kids alike will line up again and again. A perfect centerpiece for backyard birthdays and daycare water days. Delivered, set up, and fully insured.",
      "Un succès garanti pour les plus jeunes : la Whale Splash 16 arbore une gentille baleine bleue au sommet et deux couloirs doux qui se déversent dans une piscine gonflable surdimensionnée. Tout-petits et grands enfants y reviendront sans cesse. Pièce maîtresse parfaite pour anniversaires et journées aquatiques en garderie. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Friendly whale character", "Personnage baleine sympathique"),
      L("Gentle dual lanes for all ages", "Couloirs doux pour tous les âges"),
      L("Oversized splash pool", "Piscine surdimensionnée"),
      L("Great for toddlers & daycares", "Idéale pour tout-petits et garderies"),
    ],
    images: ["photo_2026-06-28_07-40-22.jpg"],
  },
  {
    slug: "octo-splash-18",
    name: "Octo Splash 18",
    category: "backyard-slides",
    type: "BOTH",
    dailyRateCents: 37500,
    salePriceCents: 450000,
    depositCents: 8000,
    dimensions: { length: 32, width: 24, height: 18 },
    capacity: 2,
    ageRange: "4+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 9,
    shortDescription: L(
      "Playful octopus-themed dual-lane slide with dolphin details and a giant splash pool.",
      "Glissade ludique thème pieuvre double couloir avec dauphins et immense pataugeoire.",
    ),
    description: L(
      "Dive into ocean fun with the Octo Splash 18. A grinning purple octopus tops two splashing lanes lined with playful dolphins, all flowing into a giant inflatable pool. It's a showstopper for under-the-sea birthday themes and summer bashes. Delivered, set up, and fully insured.",
      "Plongez dans le plaisir océanique avec l'Octo Splash 18. Une pieuvre violette souriante coiffe deux couloirs éclaboussants bordés de dauphins, le tout se déversant dans une immense piscine gonflable. Un incontournable pour les anniversaires sur le thème de la mer et les fêtes d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Octopus & dolphin theming", "Thème pieuvre et dauphins"),
      L("Dual splash lanes", "Deux couloirs éclaboussants"),
      L("Giant inflatable pool", "Immense piscine gonflable"),
      L("Ocean-party favorite", "Favori des fêtes océan"),
    ],
    images: ["photo_2026-06-28_07-40-17.jpg"],
  },
  {
    slug: "castle-splash-combo",
    name: "Castle Splash Combo",
    category: "combo-units",
    type: "BOTH",
    dailyRateCents: 32500,
    salePriceCents: 450000,
    depositCents: 9000,
    dimensions: { length: 32, width: 16, height: 14 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 19,
    shortDescription: L(
      "All-in-one castle bounce house with a side slide and a large attached splash pool.",
      "Château gonflable tout-en-un avec toboggan latéral et grande pataugeoire attenante.",
    ),
    description: L(
      "Bounce, climb, slide and splash — the Castle Splash Combo does it all. A roomy castle bounce area connects to a wet slide that empties into a large splash pool, keeping kids entertained for hours from one unit. The ultimate value pick for backyard birthdays. Delivered, set up, and fully insured.",
      "Sauter, grimper, glisser et éclabousser — le Castle Splash Combo fait tout. Une grande zone de saut château reliée à un toboggan humide qui se déverse dans une grande pataugeoire occupe les enfants pendant des heures avec une seule unité. Le meilleur rapport qualité-prix pour les anniversaires. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Bounce + slide + splash pool", "Saut + toboggan + pataugeoire"),
      L("Hours of all-in-one fun", "Des heures de plaisir tout-en-un"),
      L("Great for mixed ages", "Idéal pour âges mélangés"),
      L("Can run wet or dry", "Utilisable humide ou sec"),
    ],
    images: ["photo_2026-06-28_07-40-10.jpg"],
  },
  {
    slug: "rainbow-fun-combo",
    name: "Rainbow Fun Combo",
    category: "combo-units",
    type: "BOTH",
    dailyRateCents: 29500,
    salePriceCents: 380000,
    depositCents: 8000,
    dimensions: { length: 26, width: 15, height: 14 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 15,
    shortDescription: L(
      "Bright rainbow castle bounce house with a built-in side slide — wet or dry.",
      "Château gonflable arc-en-ciel avec toboggan latéral intégré — humide ou sec.",
    ),
    description: L(
      "A cheerful, multi-color crowd-pleaser, the Rainbow Fun Combo pairs a spacious castle bounce area with a built-in side slide. Run it dry for indoor and cooler-day events or wet for summer splashing. A versatile favorite for birthdays, schools and church events. Delivered, set up, and fully insured.",
      "Coloré et fédérateur, le Rainbow Fun Combo associe une grande zone de saut château à un toboggan latéral intégré. Utilisez-le sec pour les événements intérieurs et frais, ou humide pour éclabousser l'été. Un favori polyvalent pour anniversaires, écoles et églises. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Castle bounce + side slide", "Château + toboggan latéral"),
      L("Wet or dry use", "Usage humide ou sec"),
      L("Vibrant rainbow colors", "Couleurs arc-en-ciel vives"),
      L("Indoor or outdoor", "Intérieur ou extérieur"),
    ],
    images: ["photo_2026-06-28_08-03-38.jpg"],
  },
  {
    slug: "princess-palace-combo",
    name: "Princess Palace Combo",
    category: "combo-units",
    type: "BOTH",
    dailyRateCents: 31500,
    salePriceCents: 420000,
    depositCents: 8000,
    dimensions: { length: 28, width: 15, height: 15 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 22,
    shortDescription: L(
      "Pink, purple & blue princess castle combo with dual slides — a birthday-party dream.",
      "Combiné château princesse rose, violet et bleu avec doubles toboggans — le rêve d'anniversaire.",
    ),
    description: L(
      "Every little royal's dream, the Princess Palace Combo features pretty pink, purple and blue turrets, a big bounce area and dual slides for double the fun. A guaranteed hit at princess-themed birthdays and celebrations. Run wet or dry. Delivered, set up, and fully insured.",
      "Le rêve de toute petite princesse : le Princess Palace Combo arbore de jolies tourelles roses, violettes et bleues, une grande zone de saut et des doubles toboggans pour deux fois plus de plaisir. Un succès garanti aux anniversaires sur le thème des princesses. Humide ou sec. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Dual slides", "Doubles toboggans"),
      L("Princess castle theme", "Thème château de princesse"),
      L("Large bounce area", "Grande zone de saut"),
      L("Wet or dry use", "Usage humide ou sec"),
    ],
    images: ["photo_2026-06-28_08-09-21.jpg"],
  },
  {
    slug: "blush-castle-bouncer",
    name: "Blush Castle Bouncer",
    category: "bounce-houses",
    type: "BOTH",
    dailyRateCents: 27500,
    salePriceCents: 320000,
    depositCents: 7000,
    dimensions: { length: 13, width: 13, height: 12 },
    capacity: 6,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 5.0,
    ratingCount: 11,
    shortDescription: L(
      "Dreamy pastel-pink bounce castle — the photogenic centerpiece for modern parties.",
      "Château gonflable rose pastel féérique — la pièce maîtresse photogénique des fêtes modernes.",
    ),
    description: L(
      "Soft, chic and endlessly photogenic, the Blush Castle Bouncer is the modern pastel bounce house everyone's pinning. Its dreamy pink palette suits gender reveals, baby showers, weddings and stylish birthdays alike. A standout for events that care about the aesthetic. Delivered, set up, and fully insured.",
      "Doux, chic et infiniment photogénique, le Blush Castle Bouncer est le château pastel moderne que tout le monde épingle. Sa palette rose féérique convient aux gender reveals, baby showers, mariages et anniversaires élégants. Un incontournable pour les événements soignés. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Trendy pastel-pink design", "Design rose pastel tendance"),
      L("Perfect for photos & themes", "Parfait pour photos et thèmes"),
      L("Weddings, showers & birthdays", "Mariages, showers et anniversaires"),
      L("Cleaned before every event", "Nettoyé avant chaque événement"),
    ],
    images: ["photo_2026-06-28_11-03-38.jpg", "photo_2026-06-28_11-03-37.jpg"],
  },
  {
    slug: "pink-palace-bouncer",
    name: "Pink Palace Bouncer",
    category: "bounce-houses",
    type: "BOTH",
    dailyRateCents: 17500,
    salePriceCents: 220000,
    depositCents: 6000,
    dimensions: { length: 13, width: 13, height: 14 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 16,
    shortDescription: L(
      "Classic pink & purple castle bounce house — a birthday-party essential.",
      "Château gonflable classique rose et violet — l'essentiel des anniversaires.",
    ),
    description: L(
      "The Pink Palace Bouncer is a timeless pink-and-purple castle that anchors any birthday party. Its big open bounce area and mesh windows keep kids safe, visible and jumping for hours. Affordable, reliable and always a hit. Delivered, set up, and fully insured.",
      "Le Pink Palace Bouncer est un château rose et violet intemporel qui ancre tout anniversaire. Sa grande zone de saut ouverte et ses fenêtres en filet gardent les enfants en sécurité, visibles et en plein saut pendant des heures. Abordable, fiable et toujours un succès. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Large open bounce area", "Grande zone de saut ouverte"),
      L("Safety mesh windows", "Fenêtres de sécurité en filet"),
      L("Affordable party essential", "Essentiel de fête abordable"),
      L("Indoor or outdoor", "Intérieur ou extérieur"),
    ],
    images: ["photo_2026-06-28_11-03-41.jpg", "photo_2026-06-28_11-03-42.jpg"],
  },
  {
    slug: "rodeo-bull-rider",
    name: "Rodeo Bull Rider",
    category: "party-attractions",
    type: "RENTAL",
    dailyRateCents: 55000,
    depositCents: 15000,
    dimensions: { length: 20, width: 20, height: 10 },
    capacity: 1,
    ageRange: "8+",
    powerRequired: "One dedicated 20A / 110V circuit",
    ratingAvg: 4.9,
    ratingCount: 13,
    shortDescription: L(
      "Western-themed mechanical bull on a cushioned inflatable arena — operator included.",
      "Taureau mécanique thème western sur arène gonflable rembourrée — opérateur inclus.",
    ),
    description: L(
      "Saddle up! The Rodeo Bull Rider brings rodeo thrills to any event with a mechanical bull set in a cushioned, cactus-lined inflatable arena. Speed is adjustable for all ages and skill levels, and a trained operator is included for safe, all-day fun. The ultimate attraction for fairs, festivals, corporate events and big birthdays. Delivered, set up, and fully insured.",
      "En selle ! Le Rodeo Bull Rider apporte des sensations de rodéo à tout événement avec un taureau mécanique installé dans une arène gonflable rembourrée et bordée de cactus. La vitesse est réglable pour tous les âges et niveaux, et un opérateur formé est inclus pour un plaisir sûr toute la journée. L'attraction ultime pour foires, festivals, événements d'entreprise et grands anniversaires. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Trained operator included", "Opérateur formé inclus"),
      L("Adjustable speed for all ages", "Vitesse réglable pour tous les âges"),
      L("Cushioned inflatable arena", "Arène gonflable rembourrée"),
      L("Fairs, festivals & corporate events", "Foires, festivals et événements d'entreprise"),
    ],
    images: ["photo_2026-06-28_07-49-04.jpg", "photo_2026-06-28_07-49-09.jpg"],
  },
];

async function main() {
  if (!PUBLIC_BASE) throw new Error("R2_PUBLIC_URL is not set in .env.local");

  // 1) Ensure new categories exist.
  const catIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name, order: c.order },
      select: { id: true },
    });
    catIds.set(c.slug, row.id);
  }
  // Existing categories we reference.
  for (const slug of ["tall-slides", "backyard-slides", "racing-slides", "toddler-slides"]) {
    const row = await prisma.productCategory.findUnique({ where: { slug }, select: { id: true } });
    if (row) catIds.set(slug, row.id);
  }

  // 2) Create each product + upload its images.
  for (const p of PRODUCTS) {
    console.log(`\n• ${p.name} (${p.images.length} image${p.images.length > 1 ? "s" : ""})`);
    const urls: string[] = [];
    for (const file of p.images) {
      const url = await upload(file);
      urls.push(url);
      console.log(`    ↑ ${file}`);
    }

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: L(p.name, p.name),
        type: p.type,
        status: "ACTIVE",
        dailyRateCents: p.dailyRateCents,
        salePriceCents: p.salePriceCents ?? null,
        depositCents: p.depositCents,
        dimensions: p.dimensions,
        capacity: p.capacity,
        ageRange: p.ageRange,
        powerRequired: p.powerRequired,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        shortDescription: p.shortDescription,
        description: p.description,
        features: p.features,
        categoryId: catIds.get(p.category) ?? null,
        searchText: `${p.name} ${p.shortDescription.en}`.toLowerCase(),
      },
      create: {
        slug: p.slug,
        sku: `BWS-${p.slug.toUpperCase()}`,
        name: L(p.name, p.name),
        type: p.type,
        status: "ACTIVE",
        dailyRateCents: p.dailyRateCents,
        salePriceCents: p.salePriceCents ?? null,
        depositCents: p.depositCents,
        dimensions: p.dimensions,
        capacity: p.capacity,
        ageRange: p.ageRange,
        powerRequired: p.powerRequired,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        shortDescription: p.shortDescription,
        description: p.description,
        features: p.features,
        featured: false,
        categoryId: catIds.get(p.category) ?? null,
        searchText: `${p.name} ${p.shortDescription.en}`.toLowerCase(),
      },
      select: { id: true },
    });

    // Reset media so re-running is idempotent.
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.createMany({
      data: urls.map((url, i) => ({
        productId: product.id,
        type: "IMAGE" as const,
        url,
        alt: L(`${p.name} inflatable water slide`, `Glissade d'eau gonflable ${p.name}`),
        order: i,
        isPrimary: i === 0,
      })),
    });
  }

  const total = await prisma.product.count();
  console.log(`\n✅ Done. ${PRODUCTS.length} products imported. Catalog now has ${total} products.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
