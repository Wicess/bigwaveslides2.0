/**
 * Import the 8 AI-generated themed products in images/Products/ (the Jul-1
 * "*_202607012*" set) as catalog products. Each product's 4 angle shots are
 * matched from the folder by theme, ordered by capture time (front hero first =
 * primary), uploaded to R2, and upserted with bilingual copy, shop + rent
 * pricing, dimensions, capacity, age range, power and features.
 *
 * type = BOTH so every unit appears under BOTH /shop and /rent.
 * Idempotent: re-running re-uploads images and overwrites by slug.
 *
 * Run: dotenv -e .env.local -- tsx scripts/import-generated-products.ts
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
  const clean = file
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-");
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
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

/** Capture-time (12-digit stamp) + base-before-parenthesised for hero-first order. */
function orderFiles(files: string[]): string[] {
  const stamp = (f: string) => Number(f.match(/(\d{12})/)?.[1] ?? 0);
  const paren = (f: string) => (/\(\d+\)/.test(f) ? 1 : 0);
  return [...files].sort(
    (a, b) => stamp(a) - stamp(b) || paren(a) - paren(b) || a.localeCompare(b),
  );
}

type GenProduct = {
  slug: string;
  name: string;
  category: string;
  /** Files in images/Products/ are matched when their name starts with any prefix. */
  prefixes: string[];
  dailyRateCents: number;
  salePriceCents: number;
  depositCents: number;
  dimensions: { length: number; width: number; height: number };
  capacity: number;
  ageRange: string;
  powerRequired: string;
  ratingAvg: number;
  ratingCount: number;
  featured?: boolean;
  shortDescription: { en: string };
  description: { en: string };
  features: { en: string }[];
};

const PRODUCTS: GenProduct[] = [
  {
    slug: "tropical-paradise-18",
    name: "Tropical Paradise 18",
    category: "tall-slides",
    prefixes: ["Inflatable_water_slide_rental_202607012223"],
    dailyRateCents: 39500,
    salePriceCents: 520000,
    depositCents: 10000,
    dimensions: { length: 32, width: 14, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 27,
    featured: true,
    shortDescription: L(
      "Turquoise & lime tropical water slide crowned with a toucan, palm leaves and hibiscus, splashing into a front pool.",
      "Glissade d'eau tropicale turquoise et citron vert coiffée d'un toucan, feuilles de palmier et hibiscus, se déversant dans une pataugeoire.",
    ),
    description: L(
      "Bring the islands home. The Tropical Paradise 18 is a lush turquoise-and-lime water slide airbrushed with palm leaves, hibiscus flowers and a friendly toucan perched on top. The slick chute pours into a generous front splash pool — an instant showstopper for backyard birthdays, pool parties and summer events. Delivered, set up, and fully insured.",
      "Ramenez les îles chez vous. La Tropical Paradise 18 est une glissade d'eau turquoise et citron vert habillée de feuilles de palmier, de fleurs d'hibiscus et d'un toucan sympathique perché au sommet. Le couloir glissant se déverse dans une grande pataugeoire avant — un incontournable pour anniversaires de jardin, fêtes de piscine et événements d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Vibrant tropical toucan theme", "Thème tropical toucan éclatant"),
      L(
        "Slick chute into a big splash pool",
        "Couloir glissant vers grande pataugeoire",
      ),
      L(
        "Perfect for pool & backyard parties",
        "Parfaite pour fêtes de piscine et jardin",
      ),
      L(
        "Cleaned & sanitized before delivery",
        "Nettoyée et désinfectée avant livraison",
      ),
    ],
  },
  {
    slug: "fire-dragon-18",
    name: "Fire Dragon 18",
    category: "tall-slides",
    prefixes: ["Dragon_water_slide_rental"],
    dailyRateCents: 44500,
    salePriceCents: 590000,
    depositCents: 12000,
    dimensions: { length: 34, width: 15, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 21,
    featured: true,
    shortDescription: L(
      "Fierce red-and-charcoal dragon slide tower with a sculpted dragon head, scales and a steep tail chute.",
      "Tour glissade dragon rouge et anthracite avec tête de dragon sculptée, écailles et couloir raide en queue.",
    ),
    description: L(
      "Unleash the legend. The Fire Dragon 18 is a bold red-and-charcoal slide tower topped with a sculpted 3D dragon head, overlapping scale texture and amber spikes down its spine. Its steep tail-shaped chute means serious thrills for older kids and teens — the centerpiece attraction for adventurous birthdays, festivals and community events. Delivered, set up, and fully insured.",
      "Libérez la légende. La Fire Dragon 18 est une tour glissade rouge et anthracite couronnée d'une tête de dragon sculptée en 3D, d'une texture d'écailles et d'épines ambrées le long de l'échine. Son couloir raide en forme de queue offre de vraies sensations aux plus grands — l'attraction phare des anniversaires aventureux, festivals et événements communautaires. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Sculpted 3D dragon head", "Tête de dragon sculptée en 3D"),
      L("Steep thrill chute", "Couloir raide à sensations"),
      L(
        "Statement piece for big events",
        "Pièce maîtresse pour grands événements",
      ),
      L("Pro setup & anchoring included", "Installation et ancrage pro inclus"),
    ],
  },
  {
    slug: "great-white-shark-18",
    name: "Great White Shark 18",
    category: "tall-slides",
    prefixes: ["Shark_"],
    dailyRateCents: 45500,
    salePriceCents: 595000,
    depositCents: 12000,
    dimensions: { length: 34, width: 15, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 18,
    featured: true,
    shortDescription: L(
      "Grey-and-white great white shark slide — riders drop through the open jaws into a deep foamy splash pool.",
      "Glissade requin blanc gris et blanc — les utilisateurs plongent par la gueule ouverte dans une pataugeoire écumante.",
    ),
    description: L(
      "Take the plunge — if you dare. The Great White Shark 18 sends riders straight through a set of open, toothy jaws and down a steep chute into a deep, foamy splash pool. Grey-and-white detailing, a towering dorsal fin and misting gills make it the ultimate ocean-themed thriller for summer parties and big backyard bashes. Delivered, set up, and fully insured.",
      "Faites le grand saut — si vous l'osez. La Great White Shark 18 propulse les utilisateurs à travers une gueule ouverte hérissée de dents puis dans un couloir raide vers une pataugeoire profonde et écumante. Les détails gris et blanc, l'aileron dorsal imposant et les branchies brumisantes en font le thriller océanique ultime des fêtes d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Ride through the shark's jaws", "Descente par la gueule du requin"),
      L("Deep foamy splash pool", "Pataugeoire profonde et écumante"),
      L(
        "Misting gills & dorsal fin",
        "Branchies brumisantes et aileron dorsal",
      ),
      L("Ocean-party showstopper", "Vedette des fêtes océan"),
    ],
  },
  {
    slug: "cosmic-rocket-18",
    name: "Cosmic Rocket 18",
    category: "tall-slides",
    prefixes: [
      "Inflatable_water_slide_rental_202607012231",
      "Inflatable_water_slide_rental_202607012232",
      "Inflatable_water_slide_rental_202607012233",
    ],
    dailyRateCents: 42500,
    salePriceCents: 565000,
    depositCents: 10000,
    dimensions: { length: 33, width: 15, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.8,
    ratingCount: 16,
    shortDescription: L(
      "Deep-space water slide in navy & violet with a chrome rocket on top, planets, Saturn and a galaxy-swirl chute.",
      "Glissade d'eau spatiale bleu marine et violet avec fusée chromée au sommet, planètes, Saturne et couloir galaxie.",
    ),
    description: L(
      "Blast off to another galaxy. The Cosmic Rocket 18 wraps a tall water slide in deep navy and violet with airbrushed planets, ringed Saturn, swirling galaxies and a gleaming chrome rocket at the summit. Riders launch down the star-streaked chute into a cosmic splash pool — an out-of-this-world hit for space-themed birthdays and summer events. Delivered, set up, and fully insured.",
      "Décollage vers une autre galaxie. La Cosmic Rocket 18 habille une grande glissade d'eau de bleu marine et violet avec planètes aérographiées, Saturne annelée, galaxies tourbillonnantes et une fusée chromée étincelante au sommet. Les utilisateurs s'élancent sur le couloir étoilé vers une pataugeoire cosmique — un succès interstellaire pour anniversaires sur le thème de l'espace. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Chrome rocket & planet artwork", "Fusée chromée et décor de planètes"),
      L("Galaxy-swirl slide chute", "Couloir de glissade galaxie"),
      L(
        "Space-theme party favorite",
        "Favori des fêtes sur le thème de l'espace",
      ),
      L(
        "Cleaned & sanitized before delivery",
        "Nettoyée et désinfectée avant livraison",
      ),
    ],
  },
  {
    slug: "volcano-blast-18",
    name: "Volcano Blast 18",
    category: "tall-slides",
    prefixes: ["Volcano_water_slide_rental"],
    dailyRateCents: 46500,
    salePriceCents: 620000,
    depositCents: 12000,
    dimensions: { length: 35, width: 16, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 15,
    featured: true,
    shortDescription: L(
      "Erupting black-and-red volcano slide with glowing lava, a smoking crater top and twin racing lanes.",
      "Glissade volcan en éruption noir et rouge avec lave rougeoyante, cratère fumant et deux couloirs de course.",
    ),
    description: L(
      "Feel the heat. The Volcano Blast 18 is a dramatic black-and-red erupting volcano with glowing orange lava airbrushed down its sides, a smoking crater at the peak and a lush tropical base. Two steep racing lanes send riders neck-and-neck into a bubbling splash pool — a jaw-dropping centerpiece for the biggest summer parties and events. Delivered, set up, and fully insured.",
      "Sentez la chaleur. La Volcano Blast 18 est un spectaculaire volcan en éruption noir et rouge avec de la lave orange rougeoyante aérographiée sur ses flancs, un cratère fumant au sommet et une base tropicale luxuriante. Deux couloirs de course raides propulsent les utilisateurs au coude-à-coude dans une pataugeoire bouillonnante — une pièce maîtresse époustouflante pour les plus grandes fêtes d'été. Livrée, installée et entièrement assurée.",
    ),
    features: [
      L("Twin racing lanes", "Deux couloirs de course"),
      L("Glowing lava & smoking crater", "Lave rougeoyante et cratère fumant"),
      L("Show-stopping centerpiece", "Pièce maîtresse spectaculaire"),
      L("Pro setup & anchoring included", "Installation et ancrage pro inclus"),
    ],
  },
  {
    slug: "rainbow-splash-combo",
    name: "Rainbow Splash Combo",
    category: "combo-units",
    prefixes: ["Inflatable_bounce_and_slide", "Inflatable_bounce_slide_combo"],
    dailyRateCents: 31500,
    salePriceCents: 420000,
    depositCents: 9000,
    dimensions: { length: 28, width: 15, height: 15 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 20,
    shortDescription: L(
      "Pastel rainbow combo with a cloud-topped bounce area and an attached slide — bounce, climb, slide, splash.",
      "Combiné arc-en-ciel pastel avec zone de saut nuage et toboggan attenant — sauter, grimper, glisser, éclabousser.",
    ),
    description: L(
      "One unit, endless fun. The Rainbow Splash Combo pairs a spacious cloud-topped bounce area with an attached slide, all in soft pastel rainbow arcs. Kids can bounce, climb, slide and splash for hours — and it runs wet for summer or dry the rest of the year. A versatile crowd-pleaser for birthdays, schools and church events. Delivered, set up, and fully insured.",
      "Une seule unité, un plaisir sans fin. Le Rainbow Splash Combo associe une grande zone de saut coiffée de nuages à un toboggan attenant, le tout en douces arches arc-en-ciel pastel. Les enfants peuvent sauter, grimper, glisser et éclabousser pendant des heures — utilisable humide l'été ou sec le reste de l'année. Un favori polyvalent pour anniversaires, écoles et églises. Livré, installé et entièrement assuré.",
    ),
    features: [
      L(
        "Bounce + climb + slide + splash",
        "Saut + escalade + toboggan + pataugeoire",
      ),
      L("Wet or dry use", "Usage humide ou sec"),
      L("Dreamy pastel rainbow look", "Look arc-en-ciel pastel féérique"),
      L("Great for mixed ages", "Idéal pour âges mélangés"),
    ],
  },
  {
    slug: "royal-castle-bouncer",
    name: "Royal Castle Bouncer",
    category: "bounce-houses",
    prefixes: ["Bounce_house_rental_on_lawn", "Inflatable_bounce_house_rental"],
    dailyRateCents: 26500,
    salePriceCents: 310000,
    depositCents: 7000,
    dimensions: { length: 15, width: 15, height: 13 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 23,
    shortDescription: L(
      "Sapphire-blue & silver medieval castle bounce house with four turrets, faux-stone walls and mesh safety windows.",
      "Château gonflable médiéval bleu saphir et argent avec quatre tourelles, murs façon pierre et fenêtres de sécurité.",
    ),
    description: L(
      "Hold court at your next party. The Royal Castle Bouncer is a majestic sapphire-blue and silver castle with four turrets, faux-stone airbrushing and waving pennant flags. A roomy open bounce floor and full mesh safety windows keep kids jumping, visible and safe for hours. A timeless favorite for birthdays, schools and community days. Delivered, set up, and fully insured.",
      "Tenez cour à votre prochaine fête. Le Royal Castle Bouncer est un majestueux château bleu saphir et argent avec quatre tourelles, effet pierre aérographié et fanions flottants. Un grand plancher de saut ouvert et des fenêtres en filet gardent les enfants en plein saut, visibles et en sécurité pendant des heures. Un favori intemporel pour anniversaires, écoles et journées communautaires. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Four-turret castle design", "Château à quatre tourelles"),
      L("Large open bounce floor", "Grand plancher de saut ouvert"),
      L("Full mesh safety windows", "Fenêtres de sécurité en filet"),
      L("Indoor or outdoor, wet-free", "Intérieur ou extérieur, sans eau"),
    ],
  },
  {
    slug: "unicorn-dreamland-bouncer",
    name: "Unicorn Dreamland Bouncer",
    category: "bounce-houses",
    prefixes: [
      "Unicorn_bounce_house_on_lawn",
      "Photorealistic_commercial_advertising",
    ],
    dailyRateCents: 28500,
    salePriceCents: 340000,
    depositCents: 7000,
    dimensions: { length: 15, width: 13, height: 13 },
    capacity: 6,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 5.0,
    ratingCount: 19,
    featured: true,
    shortDescription: L(
      "White & pastel unicorn castle bouncer with a rainbow mane, gold spiral horn and shimmer turrets.",
      "Château gonflable licorne blanc et pastel avec crinière arc-en-ciel, corne dorée en spirale et tourelles nacrées.",
    ),
    description: L(
      "Every little dreamer's favorite. The Unicorn Dreamland Bouncer is a magical white-and-pastel castle crowned with a sculpted unicorn head, flowing rainbow mane and gold spiral horn. Iridescent shimmer panels, star cut-outs and pastel turrets make it the most photogenic bouncer around — perfect for unicorn birthdays, showers and stylish celebrations. Delivered, set up, and fully insured.",
      "Le favori de toutes les petites rêveuses. Le Unicorn Dreamland Bouncer est un château magique blanc et pastel couronné d'une tête de licorne sculptée, d'une crinière arc-en-ciel et d'une corne dorée en spirale. Des panneaux nacrés irisés, des étoiles découpées et des tourelles pastel en font le château le plus photogénique qui soit — parfait pour anniversaires licorne, baby showers et célébrations élégantes. Livré, installé et entièrement assuré.",
    ),
    features: [
      L("Sculpted unicorn head & horn", "Tête et corne de licorne sculptées"),
      L("Iridescent shimmer panels", "Panneaux nacrés irisés"),
      L("Super photogenic centerpiece", "Pièce maîtresse très photogénique"),
      L("Cleaned before every event", "Nettoyé avant chaque événement"),
    ],
  },
];

async function main() {
  if (!PUBLIC_BASE) throw new Error("R2_PUBLIC_URL is not set in .env.local");

  const allFiles = (await readdir(DIR)).filter((f) =>
    /\.(jpe?g|png|webp)$/i.test(f),
  );

  // Resolve category ids (all already exist).
  const catIds = new Map<string, string>();
  for (const slug of ["tall-slides", "combo-units", "bounce-houses"]) {
    const row = await prisma.productCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (row) catIds.set(slug, row.id);
  }

  for (const p of PRODUCTS) {
    const files = orderFiles(
      allFiles.filter((f) => p.prefixes.some((pre) => f.startsWith(pre))),
    );
    if (files.length === 0) {
      console.log(`\n⚠️  ${p.name}: NO images matched — skipping`);
      continue;
    }
    console.log(`\n• ${p.name} (${files.length} images)`);

    const urls: string[] = [];
    for (const file of files) {
      urls.push(await upload(file));
      console.log(`    ↑ ${file}`);
    }

    const data = {
      name: L(p.name, p.name),
      type: "BOTH" as const,
      status: "ACTIVE" as const,
      dailyRateCents: p.dailyRateCents,
      salePriceCents: p.salePriceCents,
      depositCents: p.depositCents,
      dimensions: p.dimensions,
      capacity: p.capacity,
      ageRange: p.ageRange,
      powerRequired: p.powerRequired,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      featured: p.featured ?? false,
      shortDescription: p.shortDescription,
      description: p.description,
      features: p.features,
      categoryId: catIds.get(p.category) ?? null,
      searchText: `${p.name} ${p.shortDescription.en}`.toLowerCase(),
    };

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, sku: `BWS-${p.slug.toUpperCase()}`, ...data },
      select: { id: true },
    });

    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.createMany({
      data: urls.map((url, i) => ({
        productId: product.id,
        type: "IMAGE" as const,
        url,
        alt: L(`${p.name} inflatable rental`, `Location gonflable ${p.name}`),
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
