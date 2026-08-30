/*
 * fix-blog-brand-leaks.ts
 *
 * Removes the previous brand's name and its price point from the legacy blog
 * posts.
 *
 * WHY
 * Eighteen published posts still told the reader, in prose, that they were
 * buying from "Big Wave Slides" — the other company running this codebase.
 * That is the precise failure lib/brand.ts was created to end: two businesses
 * cannot hold one entity in a search index, and our own articles were naming
 * theirs. rebrand-catalog and fix-description-names both stopped at the
 * catalog; the blog was never swept.
 *
 * The same sentences carried "from $199/day", which is not a price this
 * business charges. The catalog's true minimum daily rate is $155 (the
 * Little Harbor Junior), so the figure is corrected rather than deleted —
 * a wrong price attached to the right brand would be worse than either
 * problem alone, which is why both fixes ship together.
 *
 * DELIBERATELY NOT TOUCHED: the 15% newsletter / 5% app / 20% combined
 * discount claims. Those were checked against lib/loyalty.ts
 * (LOYALTY_SUBSCRIBE_RATE 0.15 + LOYALTY_APP_BONUS_RATE 0.05) and they are
 * accurate for this site.
 *
 * Run: npm run db:fix-blog-brand-leaks [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { BRAND_NAME } from "../lib/brand";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

/**
 * Ordered: the longest form first, so "Big Wave Slides" is consumed before the
 * bare "Big Wave" pattern can bite into it and leave a stray "Slides".
 */
const REPLACEMENTS: [RegExp, string][] = [
  // Strip the title suffix rather than rebranding it. " | Big Wave Slides"
  // exists only as branding, and re-adding " | Splash Republic" pushes these
  // titles past the ~60 characters Google displays for no gain — the brand is
  // already in the URL and the site name.
  [/\s*[|–—-]\s*Big Wave Slides\s*$/g, ""],
  [/Big Wave Slides'/g, `${BRAND_NAME}'`],
  [/Big Wave Slides/g, BRAND_NAME],
  [/Big Wave Team/g, `${BRAND_NAME} Team`],
  [/Big Wave/g, BRAND_NAME],
  // Not our price. $155/day is the catalog minimum (Little Harbor Junior) and
  // $570 the maximum (Grand Waterworks Combo) — both read off the products.
  [/\$199\/day/g, "$155/day"],
  [/from \$199 a day/g, "from $155 a day"],
  [/Rentals start at \$199 a day\./g, "Rentals start at $155 a day."],
  [
    /typically \$250[–-]\$550\/day, from \$199/g,
    "typically $155–$570/day across the catalog",
  ],
  // The bare range survived the first sweep because only the "typically ...,
  // from $199" phrasing was matched. Same wrong numbers, different sentence.
  [/\$250\s*[–-]\s*\$550/g, "$230–$570"],
];

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  const text = (v: unknown) =>
    typeof v === "string" ? v : ((v as { en?: string })?.en ?? "");

  let changed = 0;
  let hits = 0;

  for (const post of posts) {
    const fields = {
      title: text(post.title),
      excerpt: text(post.excerpt),
      content: text(post.content),
      metaTitle: text(post.metaTitle),
      metaDescription: text(post.metaDescription),
    };

    const next = { ...fields };
    let postHits = 0;

    // metaTitle/metaDescription were missed on the first pass, and that is
    // where the leak survived longest: 9 published posts were still telling
    // Google "How Big Wave Slides keeps every party safe" in the snippet.
    for (const key of [
      "title",
      "excerpt",
      "content",
      "metaTitle",
      "metaDescription",
    ] as const) {
      let value = next[key];
      for (const [pattern, replacement] of REPLACEMENTS) {
        const found = value.match(pattern);
        if (!found) continue;
        postHits += found.length;
        value = value.replace(pattern, replacement);
      }
      next[key] = value;
    }

    if (!postHits) continue;

    changed++;
    hits += postHits;
    console.log(
      `${DRY ? "[dry] " : ""}${post.slug}  (${postHits} replacement${postHits === 1 ? "" : "s"})`,
    );

    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          title: { en: next.title },
          excerpt: { en: next.excerpt },
          content: { en: next.content },
          ...(next.metaTitle ? { metaTitle: { en: next.metaTitle } } : {}),
          ...(next.metaDescription
            ? { metaDescription: { en: next.metaDescription } }
            : {}),
        },
      });
    }
  }

  console.log(
    `\n${DRY ? "[dry] would make" : "made"} ${hits} replacements across ${changed} posts.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
