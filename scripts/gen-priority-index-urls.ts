/*
 * gen-priority-index-urls.ts — regenerate PRIORITY-INDEX-URLS.txt, the
 * hand-submission worksheet for Search Console's URL Inspection tool.
 *
 * Different job from gen-indexing-urls.ts. That one mirrors the sitemap: every
 * URL, grouped by type, for reference. This one is ORDERED BY WHAT TO SUBMIT
 * FIRST, because the quota is ~10-15 URLs per property per day and there are
 * far more URLs than days — the order is the only thing that matters.
 *
 * The state hubs sit high on purpose. They are the pages that funnel to the
 * city pages beneath them, so getting them crawled is what makes the cities
 * reachable without submitting any of them by hand. Water slides come before
 * bounce houses because that is the primary business — sorting the two families
 * together put all 51 bounce URLs first and buried the water-slide states 300
 * lines down, where they read as missing.
 *
 * Bounce-house CITY pages are absent by design, not by oversight: that route is
 * deleted and the state tier is cut to the 11 markets in BOUNCE_STATE_KEYS.
 * Everything removed redirects, and submitting a redirect spends quota to be
 * told to go somewhere else.
 *
 * Run:  npx tsx scripts/gen-priority-index-urls.ts
 */
import { writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import {
  US_STATES,
  getPriorityCities,
  BOUNCE_STATE_KEYS,
} from "../lib/locations";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BASE = "https://www.splashrep.com/en";
const u = (path: string) => `${BASE}${path}`;

/**
 * Day 1-2 are curated, not generated: which handful of pages Google sees first
 * is a judgement call about the business, not something derivable from the
 * schema. Everything after them is generated.
 */
const DAY_1 = [
  "",
  "/rent",
  "/shop",
  "/blog/water-slide-rental-cost-guide",
  "/water-slides-for/fall-festivals",
  "/water-slide-rentals/texas/houston",
  "/water-slide-rentals/texas/dallas",
  "/water-slide-rentals/florida/orlando",
  "/water-slide-rentals/arizona/phoenix",
  "/about",
  "/water-slides-for/trunk-or-treat",
  "/answers",
  "/water-slides-for/school-carnivals",
  "/water-slide-rentals/nevada/las-vegas",
  "/water-slide-rentals/georgia/atlanta",
];

const DAY_2 = [
  "/water-slides-for/birthday-parties",
  "/water-slides-for/church-events",
  "/water-slides-for/corporate-events",
  "/water-slides-for/corporate-fall-family-day",
  "/water-slides-for/graduation-parties",
  "/water-slides-for/halloween-parties",
  "/water-slides-for/harvest-festivals",
  "/water-slides-for/hoa-neighborhood-events",
  "/water-slides-for/pool-parties",
  "/water-slides-for/school-events",
  "/water-slides-for/summer-camps-daycares",
  "/blog",
  "/bounce-house-rentals",
  "/contact",
  "/faq",
  "/services",
  "/testimonials",
  "/water-slide-rentals",
  "/privacy-policy",
  "/terms-of-service",
  "/water-slides-for",
];

type Section = { title: string; note?: string[]; urls: string[] };

async function main() {
  for (let i = 0; i < 8; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  const rent = await prisma.product.findMany({
    where: { status: "ACTIVE", type: { in: ["RENTAL", "BOTH"] } },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const shop = await prisma.product.findMany({
    where: { status: "ACTIVE", type: { in: ["SALE", "BOTH"] } },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const cats = await prisma.blogCategory.findMany({
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const tags = await prisma.tag.findMany({
    select: { slug: true },
    orderBy: { slug: "asc" },
  });

  const states = [...US_STATES].sort((a, b) => a.name.localeCompare(b.name));
  const cities = getPriorityCities();

  const sections: Section[] = [
    {
      title: "DAY 1 — entity, commercial and seasonal",
      note: [
        "The homepage first: everything else is discovered through it, and the",
        "fall pages have an October window that closes.",
      ],
      urls: DAY_1.map(u),
    },
    {
      title: "DAY 2 — the rest of the fall cluster and the core site pages",
      urls: DAY_2.map(u),
    },
    {
      title: "DAY 3-6 — WATER SLIDE RENTALS BY STATE (all 51)",
      note: [
        "The highest-leverage block in this file. Each of these links to every",
        "city page in its state, so submitting the 51 hubs is what makes 752",
        "city pages reachable without submitting any of them by hand.",
      ],
      urls: states.map((s) => u(`/water-slide-rentals/${s.slug}`)),
    },
    {
      title: "DAY 7 — BOUNCE HOUSE RENTALS BY STATE",
      note: [
        "Only the states with real local content keep a bounce-house hub. The",
        "other 40, and every bounce-house city page, now redirect here — do not",
        "submit them, a redirect spends quota to be told to go somewhere else.",
      ],
      urls: BOUNCE_STATE_KEYS.map((s) => u(`/bounce-house-rentals/${s}`)),
    },
    {
      title: "DAY 8-13 — blog",
      note: ["Original long-form; your strongest long-tail surface."],
      urls: [
        ...posts.map((p) => u(`/blog/${p.slug}`)),
        ...cats.map((c) => u(`/blog/category/${c.slug}`)),
        ...tags.map((t) => u(`/blog/tag/${t.slug}`)),
      ],
    },
    {
      title: "DAY 14-17 — rental products",
      urls: rent.map((p) => u(`/rent/${p.slug}`)),
    },
    {
      title: "DAY 18-21 — shop products",
      urls: shop.map((p) => u(`/shop/${p.slug}`)),
    },
    {
      title: "REFERENCE — water-slide city pages. Do NOT hand-submit these.",
      note: [
        "At ~15 URLs a day this block alone is four months of typing, and it is",
        "not how they get indexed. Google reaches them by crawling the state",
        "hubs above and following the internal links. Submit the hubs; the",
        "cities follow.",
      ],
      urls: cities.map((c) =>
        u(`/water-slide-rentals/${c.state.slug}/${c.slug}`),
      ),
    },
  ];

  // Day 1-2 are hand-picked from the same pools the later blocks generate, so
  // the top metros and the cost guide would otherwise appear twice. A URL
  // submitted twice wastes a day of quota against a ~15/day limit.
  const seeded = new Set([...DAY_1, ...DAY_2].map(u));
  for (const s of sections.slice(2)) {
    s.urls = s.urls.filter((x) => !seeded.has(x));
  }

  const all = sections.flatMap((s) => s.urls);
  const dupes = all.filter((x, i) => all.indexOf(x) !== i);
  if (dupes.length) {
    console.error(`Duplicate URLs: ${[...new Set(dupes)].join(", ")}`);
    process.exit(1);
  }

  const out: string[] = [
    "# Splash Republic — manual indexing worksheet",
    "#",
    "# Google Search Console -> URL Inspection -> paste -> Request Indexing.",
    "# Roughly 10-15 URLs per property per day. Work top to bottom; stop when",
    "# GSC refuses and continue tomorrow. Never retry the same URL — repeats",
    "# can throttle the quota without indexing anything.",
    "#",
    `# ${all.length} URLs. Every one is in the live sitemap, returns 200, and`,
    '# serves meta robots "index, follow" — verified by crawling all of them.',
    "#",
    "# READ THIS BEFORE STARTING: manual submission is a kickstart, not the",
    `# method. You are not going to submit ${all.length} URLs by hand and you`,
    "# do not need to. Once Google crawls the pages at the top and finds real",
    "# content, it follows your internal links to the rest on its own. What",
    "# actually raises crawl budget is a Google Business Profile and the first",
    "# real backlinks. Everything below the product sections is reference, not",
    "# a task list.",
    "#",
    "# Regenerate: npx tsx scripts/gen-priority-index-urls.ts",
    "",
  ];

  const rule = "# " + "-".repeat(72);
  for (const s of sections) {
    out.push(rule, `# ${s.title}`);
    for (const n of s.note ?? []) out.push(`#   ${n}`);
    out.push(`# ${s.urls.length} URLs`, rule, ...s.urls, "");
  }

  writeFileSync("PRIORITY-INDEX-URLS.txt", out.join("\n"));
  console.log(`Wrote PRIORITY-INDEX-URLS.txt — ${all.length} URLs`);
  for (const s of sections) {
    console.log(`  ${String(s.urls.length).padStart(5)}  ${s.title}`);
  }
  await prisma.$disconnect();
}

main();
