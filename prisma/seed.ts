import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import type { ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Default import (not named) for CJS/ESM interop when run via tsx.
const { PrismaClient } = pkg;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helpers
const L = (en: string, fr: string) => ({ en, fr });
const img = (seed: string) => `https://picsum.photos/seed/bws-${seed}/1200/800`;

const now = new Date();
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

// ───────────────────────── Permissions & Roles ─────────────────────────
const PERMISSIONS: { key: string; label: string; group: string }[] = [
  { key: "product.read", label: "View products", group: "Catalog" },
  { key: "product.write", label: "Edit products", group: "Catalog" },
  { key: "product.delete", label: "Delete products", group: "Catalog" },
  { key: "category.write", label: "Edit categories", group: "Catalog" },
  { key: "inventory.write", label: "Manage rental inventory", group: "Inventory" },
  { key: "booking.read", label: "View bookings", group: "Bookings" },
  { key: "booking.confirm", label: "Confirm bookings", group: "Bookings" },
  { key: "order.read", label: "View orders", group: "Orders" },
  { key: "order.update", label: "Update orders", group: "Orders" },
  { key: "order.invoice", label: "Send payment details", group: "Orders" },
  { key: "quote.read", label: "View quotes", group: "Quotes" },
  { key: "quote.update", label: "Update quotes", group: "Quotes" },
  { key: "blog.write", label: "Edit blog posts", group: "Content" },
  { key: "blog.publish", label: "Publish blog posts", group: "Content" },
  { key: "event.write", label: "Manage events", group: "Content" },
  { key: "service.write", label: "Manage services", group: "Content" },
  { key: "testimonial.moderate", label: "Moderate testimonials", group: "Content" },
  { key: "review.moderate", label: "Moderate reviews", group: "Content" },
  { key: "customer.read", label: "View customers (CRM)", group: "CRM" },
  { key: "customer.write", label: "Edit customers (CRM)", group: "CRM" },
  { key: "media.write", label: "Manage media library", group: "Media" },
  { key: "email.send", label: "Send emails", group: "Comms" },
  { key: "newsletter.manage", label: "Manage newsletter", group: "Comms" },
  { key: "contact.manage", label: "Manage contact inbox", group: "Comms" },
  { key: "settings.write", label: "Edit site settings", group: "Settings" },
  { key: "users.manage", label: "Manage admin users", group: "Governance" },
  { key: "roles.manage", label: "Manage roles", group: "Governance" },
  { key: "activity.read", label: "View activity logs", group: "Governance" },
];

const CONTENT_KEYS = [
  "blog.write",
  "blog.publish",
  "event.write",
  "service.write",
  "testimonial.moderate",
  "review.moderate",
  "media.write",
  "product.read",
];
const SALES_KEYS = [
  "order.read",
  "order.update",
  "order.invoice",
  "quote.read",
  "quote.update",
  "booking.read",
  "booking.confirm",
  "customer.read",
  "customer.write",
  "product.read",
];

async function seedRbac() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, group: p.group },
      create: p,
    });
  }
  const allKeys = PERMISSIONS.map((p) => p.key);

  await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: { permissions: { set: allKeys.map((key) => ({ key })) } },
    create: {
      name: "Super Admin",
      type: "SUPER_ADMIN",
      description: "Full access to everything.",
      permissions: { connect: allKeys.map((key) => ({ key })) },
    },
  });
  await prisma.role.upsert({
    where: { name: "Editor" },
    update: { permissions: { set: CONTENT_KEYS.map((key) => ({ key })) } },
    create: {
      name: "Editor",
      type: "EDITOR",
      description: "Content, media, and moderation.",
      permissions: { connect: CONTENT_KEYS.map((key) => ({ key })) },
    },
  });
  await prisma.role.upsert({
    where: { name: "Sales" },
    update: { permissions: { set: SALES_KEYS.map((key) => ({ key })) } },
    create: {
      name: "Sales",
      type: "SALES",
      description: "Orders, bookings, quotes, and CRM.",
      permissions: { connect: SALES_KEYS.map((key) => ({ key })) },
    },
  });

  const superRole = await prisma.role.findUnique({
    where: { name: "Super Admin" },
  });
  const passwordHash = await bcrypt.hash("BigWave!2026", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@bigwaveslides.com" },
    update: { roleId: superRole?.id },
    create: {
      name: "Big Wave Admin",
      email: "admin@bigwaveslides.com",
      passwordHash,
      roleId: superRole?.id,
    },
  });
}

// ───────────────────────── Categories ─────────────────────────
const CATEGORIES = [
  {
    slug: "inflatable-water-slides",
    name: L("Inflatable Water Slides", "Toboggans gonflables"),
    description: L(
      "Towering inflatable slides for parties and events.",
      "Toboggans gonflables géants pour fêtes et événements.",
    ),
  },
  {
    slug: "slip-n-slides",
    name: L("Slip & Slides", "Tapis glissants"),
    description: L(
      "Dual-lane racing slip & slides for non-stop fun.",
      "Tapis glissants double voie pour s'amuser sans fin.",
    ),
  },
  {
    slug: "combo-units",
    name: L("Combo Bouncer Slides", "Combos château-toboggan"),
    description: L(
      "Bounce house and slide combos in one unit.",
      "Châteaux gonflables et toboggans réunis.",
    ),
  },
  {
    slug: "pool-slides",
    name: L("Pool Slides", "Toboggans de piscine"),
    description: L(
      "Commercial-grade slides built to own.",
      "Toboggans de qualité commerciale à acheter.",
    ),
  },
  {
    slug: "park-attractions",
    name: L("Water Park Attractions", "Attractions de parc aquatique"),
    description: L(
      "Flagship fiberglass flumes and rides.",
      "Toboggans en fibre de verre et attractions phares.",
    ),
  },
];

async function seedCategories() {
  const map = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]!;
    const row = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, order: i },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        order: i,
        image: img(`cat-${c.slug}`),
      },
    });
    map.set(c.slug, row.id);
  }
  return map;
}

// ───────────────────────── Products ─────────────────────────
type ProductSeed = {
  slug: string;
  sku: string;
  category: string;
  type: ProductType;
  name: ReturnType<typeof L>;
  shortDescription: ReturnType<typeof L>;
  salePriceCents?: number;
  dailyRateCents?: number;
  depositCents?: number;
  capacity?: number;
  ageRange?: string;
  featured?: boolean;
  rentalUnits?: number;
  rating?: { avg: number; count: number };
};

const PRODUCTS: ProductSeed[] = [
  {
    slug: "tropical-twist-18ft",
    sku: "BWS-TT18",
    category: "inflatable-water-slides",
    type: "RENTAL",
    name: L("Tropical Twist 18ft Water Slide", "Toboggan Tropical Twist 5,5 m"),
    shortDescription: L(
      "An 18ft splash-down slide with a tropical theme — the life of any backyard party.",
      "Un toboggan de 5,5 m à thème tropical — la vedette de toute fête.",
    ),
    dailyRateCents: 29900,
    depositCents: 10000,
    capacity: 1,
    ageRange: "5+",
    featured: true,
    rentalUnits: 3,
    rating: { avg: 4.9, count: 64 },
  },
  {
    slug: "blue-crush-double-lane",
    sku: "BWS-BC2L",
    category: "slip-n-slides",
    type: "RENTAL",
    name: L("Blue Crush Double Lane Slip & Slide", "Tapis glissant double voie Blue Crush"),
    shortDescription: L(
      "Race a friend down two slick lanes into a cushioned splash pool.",
      "Affrontez un ami sur deux voies glissantes vers un bassin moelleux.",
    ),
    dailyRateCents: 19900,
    depositCents: 7500,
    capacity: 2,
    ageRange: "6+",
    rentalUnits: 2,
    rating: { avg: 4.8, count: 41 },
  },
  {
    slug: "castle-splash-combo",
    sku: "BWS-CSC1",
    category: "combo-units",
    type: "RENTAL",
    name: L("Castle Splash Combo", "Combo Castle Splash"),
    shortDescription: L(
      "Bounce, climb, and slide — a castle-themed combo with a wet finish.",
      "Sautez, grimpez et glissez — un combo château avec arrivée aquatique.",
    ),
    dailyRateCents: 24900,
    depositCents: 9000,
    capacity: 8,
    ageRange: "3+",
    featured: true,
    rentalUnits: 2,
    rating: { avg: 5.0, count: 28 },
  },
  {
    slug: "cyclone-22ft-drop",
    sku: "BWS-CY22",
    category: "inflatable-water-slides",
    type: "RENTAL",
    name: L("Cyclone 22ft Drop Slide", "Toboggan Cyclone 6,7 m"),
    shortDescription: L(
      "Our tallest rental — a near-vertical drop for thrill-seekers.",
      "Notre plus grand toboggan — une descente quasi verticale.",
    ),
    dailyRateCents: 39900,
    depositCents: 15000,
    capacity: 1,
    ageRange: "8+",
    featured: true,
    rentalUnits: 1,
    rating: { avg: 4.7, count: 33 },
  },
  {
    slug: "aqualoop-commercial-pool-slide",
    sku: "BWS-AQL1",
    category: "pool-slides",
    type: "SALE",
    name: L("AquaLoop Commercial Pool Slide", "Toboggan de piscine AquaLoop"),
    shortDescription: L(
      "A commercial-grade pool slide engineered for years of service.",
      "Un toboggan de piscine commercial conçu pour durer des années.",
    ),
    salePriceCents: 1299900,
    ageRange: "All ages",
    rating: { avg: 4.9, count: 12 },
  },
  {
    slug: "riptide-fiberglass-flume",
    sku: "BWS-RTF1",
    category: "park-attractions",
    type: "SALE",
    name: L("Riptide Fiberglass Flume", "Toboggan en fibre Riptide"),
    shortDescription: L(
      "A flagship fiberglass flume to anchor your aquatic attraction.",
      "Un toboggan en fibre de verre phare pour votre parc aquatique.",
    ),
    salePriceCents: 2499900,
    featured: true,
    ageRange: "All ages",
    rating: { avg: 5.0, count: 7 },
  },
  {
    slug: "lagoon-kids-splash-pad",
    sku: "BWS-LKS1",
    category: "combo-units",
    type: "BOTH",
    name: L("Lagoon Kids Splash Pad", "Aire de jeux d'eau Lagoon"),
    shortDescription: L(
      "A gentle splash pad for little ones — available to rent or own.",
      "Une aire de jeux d'eau douce pour les petits — à louer ou à acheter.",
    ),
    dailyRateCents: 14900,
    depositCents: 5000,
    salePriceCents: 349900,
    capacity: 6,
    ageRange: "2+",
    rentalUnits: 2,
    rating: { avg: 4.8, count: 19 },
  },
];

async function seedProducts(categoryMap: Map<string, string>) {
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDescription: p.shortDescription,
        salePriceCents: p.salePriceCents ?? null,
        dailyRateCents: p.dailyRateCents ?? null,
        depositCents: p.depositCents ?? null,
        featured: p.featured ?? false,
        ratingAvg: p.rating?.avg ?? 0,
        ratingCount: p.rating?.count ?? 0,
        status: "ACTIVE",
        categoryId: categoryMap.get(p.category) ?? null,
      },
      create: {
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        shortDescription: p.shortDescription,
        description: L(
          "Professionally cleaned and inspected before every event. Delivery, setup, and pickup options available. Our team handles everything so you can focus on the fun.",
          "Nettoyé et inspecté avant chaque événement. Livraison, installation et reprise disponibles. Notre équipe s'occupe de tout.",
        ),
        type: p.type,
        status: "ACTIVE",
        salePriceCents: p.salePriceCents ?? null,
        dailyRateCents: p.dailyRateCents ?? null,
        depositCents: p.depositCents ?? null,
        capacity: p.capacity ?? null,
        ageRange: p.ageRange ?? null,
        spaceRequired: L(
          "Approx. 25 x 25 ft level area with access to water & power.",
          "Surface plane d'environ 7,5 x 7,5 m avec accès à l'eau et l'électricité.",
        ),
        powerRequired: "1x 110V outlet (blower included)",
        features: [
          L("Commercial-grade vinyl", "Vinyle de qualité commerciale"),
          L("Safety netting & soft landing", "Filets de sécurité et atterrissage moelleux"),
          L("Fully insured & inspected", "Entièrement assuré et inspecté"),
        ],
        searchText: `${p.name.en} ${p.shortDescription.en} ${p.sku}`,
        featured: p.featured ?? false,
        ratingAvg: p.rating?.avg ?? 0,
        ratingCount: p.rating?.count ?? 0,
        categoryId: categoryMap.get(p.category) ?? null,
        media: {
          create: [
            {
              url: img(`${p.slug}-1`),
              alt: p.name,
              isPrimary: true,
              order: 0,
              width: 1200,
              height: 800,
            },
            {
              url: img(`${p.slug}-2`),
              alt: p.name,
              order: 1,
              width: 1200,
              height: 800,
            },
          ],
        },
        reviews:
          p.rating && p.rating.count > 0
            ? {
                create: [
                  {
                    authorName: "Jessica M.",
                    rating: 5,
                    title: "Made our party!",
                    body: "Spotless, on time, and the kids did not want to leave. Booking again next summer.",
                    status: "APPROVED",
                  },
                ],
              }
            : undefined,
      },
    });

    // Rental units (idempotent: only create if none exist)
    if (p.rentalUnits && p.rentalUnits > 0) {
      const existing = await prisma.rentalUnit.count({
        where: { productId: product.id },
      });
      if (existing === 0) {
        await prisma.rentalUnit.createMany({
          data: Array.from({ length: p.rentalUnits }, (_, i) => ({
            productId: product.id,
            unitLabel: `${p.sku}-U${i + 1}`,
          })),
        });
      }
    }
  }
}

// ───────────────────────── Services ─────────────────────────
// Mirrors lib/services-content.ts (the single /services page). The DB copy
// powers the header mega-menu and footer links, which anchor to /services#slug.
const SERVICES = [
  { slug: "event-rentals", cat: "EVENT", t: L("Backyard & Party Rentals", "Locations pour fêtes et jardins"), s: L("Birthdays, pool days, and backyard blowouts — delivered and set up.", "Anniversaires, journées piscine et fêtes de jardin — livrés et installés.") },
  { slug: "corporate-community-events", cat: "EVENT", t: L("Corporate & Community Events", "Événements d'entreprise et communautaires"), s: L("Picnics, festivals, and municipal celebrations.", "Pique-niques, festivals et fêtes municipales.") },
  { slug: "school-camp-church", cat: "EVENT", t: L("School, Camp & Church Events", "Écoles, camps et événements paroissiaux"), s: L("Safe, insured, age-appropriate fun.", "Du plaisir sûr, assuré et adapté à l'âge.") },
  { slug: "water-slide-sales", cat: "INSTALL", t: L("Water Slide Sales", "Vente de toboggans"), s: L("Own commercial-grade slides built to last.", "Possédez des toboggans de qualité commerciale.") },
  { slug: "custom-builds", cat: "INSTALL", t: L("Custom Water Slide & Waterpark Construction", "Construction sur mesure de parcs aquatiques"), s: L("We design and build permanent attractions and waterparks.", "Nous concevons et construisons des attractions permanentes.") },
  { slug: "delivery-installation", cat: "INSTALL", t: L("Delivery, Installation & Anchoring", "Livraison, installation et ancrage"), s: L("Professional, by-the-book setup every time.", "Une installation professionnelle et rigoureuse.") },
  { slug: "maintenance-inspection", cat: "MAINTENANCE", t: L("Maintenance, Inspection & Repair", "Entretien, inspection et réparation"), s: L("Keep your investment safe and ready.", "Gardez votre investissement sûr et prêt.") },
  { slug: "event-staffing", cat: "SUPPORT", t: L("Event Staffing & On-Site Safety", "Personnel d'événement et sécurité"), s: L("Trained attendants who run the attraction for you.", "Des préposés formés qui opèrent l'attraction pour vous.") },
] as const;

async function seedServices() {
  // Drop services that are no longer part of the lineup (old per-event slugs).
  await prisma.service.deleteMany({
    where: { slug: { notIn: SERVICES.map((s) => s.slug) } },
  });
  for (let i = 0; i < SERVICES.length; i++) {
    const sv = SERVICES[i]!;
    await prisma.service.upsert({
      where: { slug: sv.slug },
      update: { title: sv.t, summary: sv.s, order: i },
      create: {
        slug: sv.slug,
        title: sv.t,
        summary: sv.s,
        description: L(
          "Our team brings the equipment, sets everything up, and ensures a safe, spotless experience from start to finish.",
          "Notre équipe apporte le matériel, installe tout et garantit une expérience sûre et impeccable.",
        ),
        category: sv.cat,
        heroImage: img(`svc-${sv.slug}`),
        included: [
          L("Delivery & setup", "Livraison et installation"),
          L("On-site safety briefing", "Briefing sécurité sur place"),
          L("Pickup & cleanup", "Reprise et nettoyage"),
        ],
        order: i,
        featured: i < 4,
      },
    });
  }
}

// ───────────────────────── Blog ─────────────────────────
// Localized display names for the blog taxonomy.
const CATEGORY_NAMES: Record<string, { en: string; fr: string }> = {
  guides: L("Guides", "Guides"),
  planning: L("Planning", "Planification"),
  safety: L("Safety", "Sécurité"),
  events: L("Events", "Événements"),
  pricing: L("Pricing", "Tarifs"),
};
const TAG_NAMES: Record<string, { en: string; fr: string }> = {
  pricing: L("Pricing", "Tarifs"),
  rentals: L("Rentals", "Locations"),
  tips: L("Tips", "Conseils"),
  parties: L("Parties", "Fêtes"),
  safety: L("Safety", "Sécurité"),
  events: L("Events", "Événements"),
  corporate: L("Corporate", "Entreprises"),
};

type SeedPost = {
  slug: string;
  category: string;
  tags: string[];
  coverImage: string;
  featured: boolean;
  publishedDaysAgo: number;
  readingMinutes: number;
  title: { en: string; fr: string };
  excerpt: { en: string; fr: string };
  metaTitle: { en: string; fr: string };
  metaDescription: { en: string; fr: string };
  content: { en: string; fr: string };
};

async function seedBlog() {
  const author = await prisma.author.upsert({
    where: { id: "author-bigwave-team" },
    update: {},
    create: {
      id: "author-bigwave-team",
      name: "The Big Wave Team",
      bio: L(
        "The crew behind Big Wave Slides — water-fun experts who deliver, set up, and sweat the details so your event is effortless.",
        "L'équipe derrière Big Wave Slides — des experts du plaisir aquatique qui livrent, installent et soignent les détails pour que votre événement soit sans effort.",
      ),
      avatar: img("author-team"),
    },
  });

  // Rich, conversion-focused posts authored in Markdown. Stored in
  // prisma/blog-posts.json (with R2 cover images) so re-seeding restores them.
  const posts = JSON.parse(
    readFileSync(new URL("./blog-posts.json", import.meta.url), "utf8"),
  ) as SeedPost[];

  // Create every category referenced by the posts.
  const categoryIds = new Map<string, string>();
  for (const slug of new Set(posts.map((p) => p.category))) {
    const cat = await prisma.blogCategory.upsert({
      where: { slug },
      update: { name: CATEGORY_NAMES[slug] ?? L(slug, slug) },
      create: { slug, name: CATEGORY_NAMES[slug] ?? L(slug, slug) },
    });
    categoryIds.set(slug, cat.id);
  }

  for (const post of posts) {
    const tags = {
      connectOrCreate: post.tags.map((t) => ({
        where: { slug: t },
        create: { slug: t, name: TAG_NAMES[t] ?? L(t, t) },
      })),
    };
    const common = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      coverImage: post.coverImage,
      status: "PUBLISHED" as const,
      publishedAt: daysFromNow(-post.publishedDaysAgo),
      readingMinutes: post.readingMinutes,
      featured: post.featured,
      authorId: author.id,
      categoryId: categoryIds.get(post.category)!,
    };
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...common, tags: { set: [], ...tags } },
      create: { slug: post.slug, ...common, tags },
    });
  }
}

// ───────────────────────── Events ─────────────────────────
async function seedEvents() {
  const EVENTS = [
    {
      slug: "summer-splash-festival-2026",
      title: L("Summer Splash Festival 2026", "Festival Summer Splash 2026"),
      excerpt: L("A day of slides, music, and sunshine.", "Une journée de toboggans, musique et soleil."),
      status: "UPCOMING" as const,
      startAt: daysFromNow(45),
      featured: true,
      registrationEnabled: true,
    },
    {
      slug: "schools-out-pool-bash",
      title: L("School's Out Pool Bash", "Fête de fin d'année à la piscine"),
      excerpt: L("Celebrate the last bell with a splash.", "Célébrez la dernière sonnerie en beauté."),
      status: "UPCOMING" as const,
      startAt: daysFromNow(20),
      registrationEnabled: true,
    },
    {
      slug: "big-wave-community-day-2025",
      title: L("Big Wave Community Day 2025", "Journée communautaire Big Wave 2025"),
      excerpt: L("Last year's free neighborhood splash day.", "Notre journée aquatique gratuite de l'an dernier."),
      status: "PAST" as const,
      startAt: daysFromNow(-120),
      featured: false,
    },
  ];

  for (const e of EVENTS) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: { title: e.title, excerpt: e.excerpt, status: e.status },
      create: {
        slug: e.slug,
        title: e.title,
        excerpt: e.excerpt,
        description: L(
          "Join us for a day of water-slide fun for the whole family.",
          "Rejoignez-nous pour une journée de toboggans en famille.",
        ),
        status: e.status,
        startAt: e.startAt,
        endAt: new Date(e.startAt.getTime() + 8 * 60 * 60 * 1000),
        location: "Riverside Park, Springfield",
        coverImage: img(`event-${e.slug}`),
        capacity: 500,
        registrationEnabled: e.registrationEnabled ?? false,
        featured: e.featured ?? false,
      },
    });
  }
}

// ───────────────────────── Testimonials ─────────────────────────
async function seedTestimonials() {
  const count = await prisma.testimonial.count();
  if (count > 0) return;
  await prisma.testimonial.createMany({
    data: [
      { authorName: "Maria G.", authorRole: "Parent", rating: 5, quote: L("Best birthday ever — the kids are still talking about it!", "Le plus bel anniversaire — les enfants en parlent encore !"), status: "APPROVED", featured: true, order: 0 },
      { authorName: "Pastor James", authorRole: "Community Church", organization: "Grace Fellowship", rating: 5, quote: L("Punctual, professional, and spotless. Highly recommended.", "Ponctuel, professionnel et impeccable. Vivement recommandé."), status: "APPROVED", featured: true, order: 1 },
      { authorName: "Coach Daniels", authorRole: "Lincoln Elementary", rating: 5, quote: L("Our field day was a massive hit thanks to Big Wave.", "Notre journée sportive fut un grand succès grâce à Big Wave."), status: "APPROVED", featured: false, order: 2 },
      { authorName: "The Reynolds Family", rating: 5, quote: L("Setup and pickup were effortless. We just had fun.", "Installation et reprise sans effort. On a juste profité."), status: "APPROVED", featured: false, order: 3 },
      { authorName: "Hotel Azure", authorRole: "Events Manager", organization: "Hotel Azure", rating: 4, quote: L("Our guests loved the poolside slides all summer.", "Nos clients ont adoré les toboggans tout l'été."), status: "APPROVED", featured: false, order: 4 },
    ],
  });
}

// ───────────────────────── Site Settings ─────────────────────────
async function seedSettings() {
  const SETTINGS = [
    { key: "contact", group: "contact", value: { email: "contact@bigwaveslides.com", phone: "+1 (614) 302-5899", whatsapp: "16143025899", address: "123 Riverside Ave, Springfield, USA" } },
    { key: "fees", group: "fees", value: { deliveryBaseCents: 4900, pickupCents: 2900, freeRadiusMiles: 15, perMileCents: 250 } },
    { key: "social", group: "social", value: { instagram: "https://instagram.com/bigwaveslides", facebook: "https://facebook.com/bigwaveslides", tiktok: "https://tiktok.com/@bigwaveslides" } },
    { key: "hours", group: "general", value: { mon_fri: "8:00–18:00", sat: "8:00–20:00", sun: "10:00–16:00" } },
  ];
  for (const s of SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }
}

async function main() {
  console.log("🌊 Seeding Big Wave Slides…");
  await seedRbac();
  const categories = await seedCategories();
  await seedProducts(categories);
  await seedServices();
  await seedBlog();
  await seedEvents();
  await seedTestimonials();
  await seedSettings();
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
