/**
 * Import the second batch of AI-generated products (the Jul-6 "*_20260706*" set
 * in images/Products/). Matches each product's angle shots by theme keyword,
 * orders hero-first, uploads to R2, and upserts as type=BOTH (shop + rent).
 * Per-product meta tags are generated automatically by the page's
 * rentProductSeo/saleProductSeo helpers (price + kind aware).
 *
 * Run: dotenv -e .env.local -- tsx scripts/import-batch2-products.ts
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
const L = (en: string, fr: string) => ({ en, fr });

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

function orderFiles(files: string[]): string[] {
  const stamp = (f: string) => Number(f.match(/(\d{12})/)?.[1] ?? 0);
  const paren = (f: string) => (/\(\d+\)/.test(f) ? 1 : 0);
  return [...files].sort(
    (a, b) => stamp(a) - stamp(b) || paren(a) - paren(b) || a.localeCompare(b),
  );
}

type P = {
  slug: string;
  name: string;
  category: string;
  /** Case-insensitive keyword(s) the filename must contain (Jul-6 batch only). */
  match: RegExp;
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
  shortDescription: { en: string; fr: string };
  description: { en: string; fr: string };
  features: { en: string; fr: string }[];
};

const F = (...items: [string, string][]) => items.map(([en, fr]) => L(en, fr));

const PRODUCTS: P[] = [
  {
    slug: "pirate-ship-slide",
    name: "Pirate Ship 18",
    category: "tall-slides",
    match: /pirate/i,
    dailyRateCents: 44500,
    salePriceCents: 590000,
    depositCents: 12000,
    dimensions: { length: 34, width: 15, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 22,
    featured: true,
    shortDescription: L(
      "Brown-and-crimson galleon water slide with billowing sails, a skull flag and a walk-the-plank chute into a splash pool.",
      "Glissade galleon brun et cramoisi avec voiles, drapeau tête de mort et couloir « planche » vers une pataugeoire.",
    ),
    description: L(
      "Ahoy! The Pirate Ship 18 is a swashbuckling galleon-shaped water slide with tan sails, rope rigging, a skull flag and a deck cannon. Riders walk the plank down a steep chute into a splash pool — the ultimate centerpiece for pirate birthdays and summer bashes. Delivered, set up, and fully insured.",
      "À l'abordage ! Le Pirate Ship 18 est une glissade en forme de galion avec voiles beiges, gréement, drapeau tête de mort et canon de pont. Les utilisateurs descendent un couloir abrupt vers une pataugeoire — la pièce maîtresse des anniversaires pirates. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Galleon ship design", "Design de galion"],
      ["Walk-the-plank chute", "Couloir « planche »"],
      ["Deep splash pool", "Pataugeoire profonde"],
      [
        "Delivery, setup & pickup included",
        "Livraison, installation et ramassage inclus",
      ],
    ),
  },
  {
    slug: "t-rex-dinosaur-slide",
    name: "T-Rex Dino 18",
    category: "tall-slides",
    match: /t-rex/i,
    dailyRateCents: 45500,
    salePriceCents: 595000,
    depositCents: 12000,
    dimensions: { length: 34, width: 15, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 19,
    featured: true,
    shortDescription: L(
      "Prehistoric green dinosaur slide with a giant roaring T-Rex head, scaly texture and a steep chute into a splash pool.",
      "Glissade dinosaure verte préhistorique avec une tête de T-Rex rugissante, écailles et couloir abrupt vers pataugeoire.",
    ),
    description: L(
      "Roar into summer. The T-Rex Dino 18 features a giant sculpted T-Rex head, jagged teeth, scaly skin and jungle-fern accents. A steep chute drops riders into a splash pool — a jaw-dropping hit for dinosaur birthdays and adventurous events. Delivered, set up, and fully insured.",
      "Rugissez vers l'été. Le T-Rex Dino 18 arbore une énorme tête de T-Rex sculptée, des dents acérées, une peau écailleuse et des fougères. Un couloir abrupt plonge dans une pataugeoire — un succès époustouflant pour les anniversaires dinosaures. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Sculpted T-Rex head", "Tête de T-Rex sculptée"],
      ["Steep thrill chute", "Couloir raide à sensations"],
      ["Dino-party favorite", "Favori des fêtes dino"],
      [
        "Cleaned & sanitized before delivery",
        "Nettoyée et désinfectée avant livraison",
      ],
    ),
  },
  {
    slug: "mermaid-lagoon-slide",
    name: "Mermaid Lagoon 18",
    category: "tall-slides",
    match: /mermaid/i,
    dailyRateCents: 42500,
    salePriceCents: 560000,
    depositCents: 11000,
    dimensions: { length: 33, width: 15, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 5.0,
    ratingCount: 21,
    featured: true,
    shortDescription: L(
      "Shimmering teal, purple and coral mermaid slide with a sculpted tail, seashells and an under-the-sea chute into a lagoon pool.",
      "Glissade sirène turquoise, violet et corail avec queue sculptée, coquillages et couloir sous-marin vers une pataugeoire lagon.",
    ),
    description: L(
      "Dive into a fairytale. The Mermaid Lagoon 18 shimmers in teal, purple and coral with a sculpted mermaid tail, seashells, pearls and starfish. The under-the-sea chute empties into a lagoon splash pool — a dreamy centerpiece for mermaid birthdays. Delivered, set up, and fully insured.",
      "Plongez dans un conte de fées. Le Mermaid Lagoon 18 scintille de turquoise, violet et corail avec une queue de sirène sculptée, coquillages, perles et étoiles de mer. Le couloir sous-marin se déverse dans une pataugeoire lagon — parfait pour les anniversaires sirène. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Sculpted mermaid tail", "Queue de sirène sculptée"],
      ["Under-the-sea theme", "Thème sous-marin"],
      ["Lagoon splash pool", "Pataugeoire lagon"],
      ["Super photogenic centerpiece", "Pièce maîtresse photogénique"],
    ),
  },
  {
    slug: "arctic-frost-slide",
    name: "Arctic Frost 18",
    category: "tall-slides",
    match: /arctic/i,
    dailyRateCents: 43500,
    salePriceCents: 575000,
    depositCents: 11000,
    dimensions: { length: 33, width: 15, height: 18 },
    capacity: 2,
    ageRange: "6+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.9,
    ratingCount: 16,
    shortDescription: L(
      "Icy pale-blue crystal glacier slide with faceted ice-shard textures, a polar bear and a glassy splash pool.",
      "Glissade glacier bleu glacé avec textures d'éclats de glace, un ours polaire et une pataugeoire cristalline.",
    ),
    description: L(
      "Cool down in style. The Arctic Frost 18 is an icy pale-blue glacier slide with faceted ice-shard textures, frosty sparkle and a friendly polar bear on top. A glassy chute drops into a cool splash pool — a refreshing standout for hot-day parties. Delivered, set up, and fully insured.",
      "Rafraîchissez-vous avec style. L'Arctic Frost 18 est une glissade glacier bleu glacé avec textures d'éclats de glace, éclat givré et un ours polaire au sommet. Un couloir cristallin plonge dans une pataugeoire — un incontournable rafraîchissant. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Icy glacier design", "Design glacier glacé"],
      ["Polar bear accent", "Ours polaire"],
      ["Glassy splash pool", "Pataugeoire cristalline"],
      [
        "Cleaned & sanitized before delivery",
        "Nettoyée et désinfectée avant livraison",
      ],
    ),
  },
  {
    slug: "tiki-surf-slide",
    name: "Tiki Surf 18",
    category: "tall-slides",
    match: /tiki/i,
    dailyRateCents: 41500,
    salePriceCents: 545000,
    depositCents: 11000,
    dimensions: { length: 32, width: 14, height: 18 },
    capacity: 2,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 4.8,
    ratingCount: 15,
    shortDescription: L(
      "Sun-soaked orange, teal and bamboo tiki-surf slide with tiki masks, surfboards and a wave chute into a splash pool.",
      "Glissade tiki-surf orange, turquoise et bambou avec masques tiki, planches de surf et couloir vague vers pataugeoire.",
    ),
    description: L(
      "Catch a wave. The Tiki Surf 18 brings island vibes with carved tiki-mask totems, crossed surfboards, palm fronds and a wave-shaped chute into a splash pool. A tropical showstopper for luau and beach-theme parties. Delivered, set up, and fully insured.",
      "Prenez la vague. Le Tiki Surf 18 apporte une ambiance des îles avec totems tiki sculptés, planches de surf croisées, palmes et un couloir en forme de vague vers une pataugeoire. Un incontournable pour les fêtes luau et plage. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Carved tiki-mask totems", "Totems tiki sculptés"],
      ["Surfboard accents", "Planches de surf"],
      ["Wave-shaped chute", "Couloir en forme de vague"],
      ["Luau & beach-party favorite", "Favori des fêtes luau et plage"],
    ),
  },
  {
    slug: "mega-waterpark-combo",
    name: "Mega Waterpark Combo",
    category: "combo-units",
    match: /waterpark/i,
    dailyRateCents: 55000,
    salePriceCents: 780000,
    depositCents: 15000,
    dimensions: { length: 40, width: 20, height: 18 },
    capacity: 12,
    ageRange: "5+",
    powerRequired: "Two 20A / 110V outlets",
    ratingAvg: 5.0,
    ratingCount: 24,
    featured: true,
    shortDescription: L(
      "All-in-one waterpark with two tall slides, a climbing wall, arch sprayers, a splash pool and a bounce zone.",
      "Parc aquatique tout-en-un avec deux grandes glissades, mur d'escalade, arches brumisantes, pataugeoire et zone de saut.",
    ),
    description: L(
      "The ultimate centerpiece. The Mega Waterpark Combo packs two tall slides, a climbing wall, misting arch sprayers, a splash pool and a bounce zone into one flagship unit — hours of fun for the whole crowd. Perfect for big backyard bashes, block parties and community events. Delivered, set up, and fully insured.",
      "La pièce maîtresse ultime. Le Mega Waterpark Combo réunit deux grandes glissades, un mur d'escalade, des arches brumisantes, une pataugeoire et une zone de saut en une seule unité phare — des heures de plaisir. Parfait pour les grandes fêtes et événements communautaires. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Two tall slides", "Deux grandes glissades"],
      ["Climbing wall & bounce zone", "Mur d'escalade et zone de saut"],
      ["Misting arch sprayers", "Arches brumisantes"],
      ["Flagship all-in-one unit", "Unité phare tout-en-un"],
    ),
  },
  {
    slug: "jungle-safari-combo",
    name: "Jungle Safari Combo",
    category: "combo-units",
    match: /jungle/i,
    dailyRateCents: 32500,
    salePriceCents: 430000,
    depositCents: 9000,
    dimensions: { length: 28, width: 15, height: 15 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 18,
    shortDescription: L(
      "Emerald-green jungle combo with lion, elephant and monkey characters, a climb wall, obstacles and a crawl tunnel.",
      "Combiné jungle vert émeraude avec lion, éléphant et singe, mur d'escalade, obstacles et tunnel.",
    ),
    description: L(
      "Go wild! The Jungle Safari Combo is draped in vines and leaves with friendly lion, elephant and monkey characters, a climb wall, pop-up obstacles and a crawl tunnel. Bounce, climb and slide — hours of adventure from one unit. Runs wet or dry. Delivered, set up, and fully insured.",
      "Devenez sauvage ! Le Jungle Safari Combo est habillé de lianes et feuilles avec lion, éléphant et singe sympathiques, mur d'escalade, obstacles et tunnel. Sauter, grimper, glisser — des heures d'aventure. Humide ou sec. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Bounce + climb + slide", "Saut + escalade + toboggan"],
      ["Fun animal characters", "Personnages animaux amusants"],
      ["Wet or dry use", "Usage humide ou sec"],
      ["Great for mixed ages", "Idéal pour âges mélangés"],
    ),
  },
  {
    slug: "superhero-city-combo",
    name: "Superhero City Combo",
    category: "combo-units",
    match: /superhero/i,
    dailyRateCents: 33500,
    salePriceCents: 450000,
    depositCents: 9000,
    dimensions: { length: 28, width: 15, height: 15 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 17,
    shortDescription: L(
      "Bold comic-book city combo with an airbrushed skyline, burst shapes, a climb wall, squeeze pillars and a slide.",
      "Combiné ville BD audacieux avec skyline aérographié, éclats, mur d'escalade, piliers et toboggan.",
    ),
    description: L(
      "Save the day. The Superhero City Combo bursts with red-blue-yellow comic-book energy — an airbrushed skyline, dynamic burst shapes, a climb wall, squeeze pillars and a slide. An action-packed favorite for superhero birthdays. Runs wet or dry. Delivered, set up, and fully insured.",
      "Sauvez la journée. Le Superhero City Combo éclate d'énergie BD rouge-bleu-jaune — skyline aérographié, éclats dynamiques, mur d'escalade, piliers et toboggan. Un favori plein d'action pour les anniversaires super-héros. Humide ou sec. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Comic-book city theme", "Thème ville BD"],
      ["Climb wall & obstacles", "Mur d'escalade et obstacles"],
      ["Wet or dry use", "Usage humide ou sec"],
      ["Action-packed fun", "Plaisir plein d'action"],
    ),
  },
  {
    slug: "neon-glow-combo",
    name: "Neon Glow Combo",
    category: "combo-units",
    match: /neon/i,
    dailyRateCents: 34500,
    salePriceCents: 460000,
    depositCents: 9000,
    dimensions: { length: 28, width: 15, height: 15 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 14,
    shortDescription: L(
      "Vivid neon glow-party combo in electric pink, lime, orange and blue, with a bounce area, climb wall and slide.",
      "Combiné néon fluo rose, citron vert, orange et bleu, avec zone de saut, mur d'escalade et toboggan.",
    ),
    description: L(
      "Light up the night. The Neon Glow Combo pops in electric pink, lime, orange and blue geometric patterns built for glow parties, with a bounce area, climb wall and slide. A vibrant standout for teen and glow-theme events. Delivered, set up, and fully insured.",
      "Illuminez la nuit. Le Neon Glow Combo éclate de motifs géométriques rose, citron vert, orange et bleu conçus pour les fêtes fluo, avec zone de saut, mur d'escalade et toboggan. Un incontournable pour les événements ados et fluo. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Vivid neon glow colors", "Couleurs néon fluo vives"],
      ["Built for glow parties", "Conçu pour fêtes fluo"],
      ["Bounce + climb + slide", "Saut + escalade + toboggan"],
      ["Teen-party favorite", "Favori des fêtes ados"],
    ),
  },
  {
    slug: "candy-land-bouncer",
    name: "Candy Land Bouncer",
    category: "bounce-houses",
    match: /candy/i,
    dailyRateCents: 26500,
    salePriceCents: 310000,
    depositCents: 7000,
    dimensions: { length: 15, width: 15, height: 13 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 20,
    shortDescription: L(
      "Bubblegum-pink candy castle bouncer with 3D lollipops, candy canes, gumdrops and swirl accents.",
      "Château gonflable bonbon rose avec sucettes 3D, cannes de bonbon, gommes et volutes.",
    ),
    description: L(
      "Sweet fun for everyone. The Candy Land Bouncer is a bubblegum-pink candy castle studded with 3D lollipops, striped candy canes and gumdrops. A big open jump floor and mesh safety windows keep kids bouncing for hours. A dreamy pick for candy-theme birthdays. Delivered, set up, and fully insured.",
      "Du plaisir sucré pour tous. Le Candy Land Bouncer est un château bonbon rose orné de sucettes 3D, cannes de bonbon et gommes. Un grand plancher ouvert et des fenêtres en filet gardent les enfants en plein saut. Parfait pour les anniversaires bonbon. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["3D candy decorations", "Décorations bonbon 3D"],
      ["Large open jump floor", "Grand plancher de saut"],
      ["Mesh safety windows", "Fenêtres de sécurité en filet"],
      ["Cleaned before every event", "Nettoyé avant chaque événement"],
    ),
  },
  {
    slug: "circus-big-top-bouncer",
    name: "Circus Big Top Bouncer",
    category: "bounce-houses",
    match: /circus/i,
    dailyRateCents: 27500,
    salePriceCents: 320000,
    depositCents: 7000,
    dimensions: { length: 15, width: 15, height: 14 },
    capacity: 8,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.8,
    ratingCount: 13,
    shortDescription: L(
      "Red-and-white striped circus big-top bouncer with a peaked tent, flags, gold trim and carnival stars.",
      "Château gonflable cirque rayé rouge et blanc avec chapiteau, drapeaux, dorures et étoiles de carnaval.",
    ),
    description: L(
      "Step right up! The Circus Big Top Bouncer is a red-and-white striped tent with waving flags, gold trim and carnival star accents. A roomy jump floor and mesh windows keep the show going for hours. A festive favorite for carnival and circus birthdays. Delivered, set up, and fully insured.",
      "Approchez ! Le Circus Big Top Bouncer est un chapiteau rayé rouge et blanc avec drapeaux, dorures et étoiles de carnaval. Un grand plancher de saut et des fenêtres en filet font durer le spectacle. Un favori festif pour les anniversaires cirque. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Big-top circus design", "Design chapiteau de cirque"],
      ["Roomy jump floor", "Grand plancher de saut"],
      ["Mesh safety windows", "Fenêtres de sécurité en filet"],
      ["Carnival-party favorite", "Favori des fêtes carnaval"],
    ),
  },
  {
    slug: "farm-barnyard-bouncer",
    name: "Farm Barnyard Bouncer",
    category: "bounce-houses",
    match: /farm/i,
    dailyRateCents: 25500,
    salePriceCents: 295000,
    depositCents: 6000,
    dimensions: { length: 15, width: 13, height: 12 },
    capacity: 6,
    ageRange: "3+",
    powerRequired: "One 20A / 110V outlet",
    ratingAvg: 4.9,
    ratingCount: 12,
    shortDescription: L(
      "Cheerful red-barn farm bouncer with cow, pig and rooster characters, hay-bale and picket-fence accents.",
      "Château gonflable ferme grange rouge avec vache, cochon et coq, bottes de foin et clôture.",
    ),
    description: L(
      "Down on the farm. The Farm Barnyard Bouncer is a cheerful red barn with sculpted cow, pig and rooster characters, hay-bale and picket-fence accents and a low, soft jump floor — perfect for toddlers and farm-theme birthdays. Delivered, set up, and fully insured.",
      "À la ferme. Le Farm Barnyard Bouncer est une joyeuse grange rouge avec vache, cochon et coq sculptés, bottes de foin et clôture, et un plancher de saut bas — parfait pour les tout-petits et les anniversaires ferme. Livré, installé et entièrement assuré.",
    ),
    features: F(
      ["Fun barnyard animals", "Animaux de la ferme amusants"],
      ["Low soft jump floor", "Plancher de saut bas et doux"],
      ["Great for toddlers", "Idéal pour les tout-petits"],
      ["Cleaned before every event", "Nettoyé avant chaque événement"],
    ),
  },
];

async function main() {
  if (!PUBLIC_BASE) throw new Error("R2_PUBLIC_URL is not set in .env.local");

  const all = (await readdir(DIR)).filter(
    (f) => /\.(jpe?g|png|webp)$/i.test(f) && f.includes("20260706"),
  );

  const catIds = new Map<string, string>();
  for (const slug of ["tall-slides", "combo-units", "bounce-houses"]) {
    const row = await prisma.productCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (row) catIds.set(slug, row.id);
  }

  for (const p of PRODUCTS) {
    const files = orderFiles(all.filter((f) => p.match.test(f)));
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
