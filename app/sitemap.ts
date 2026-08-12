import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { hreflangAlternates } from "@/lib/seo";
import { getProductSlugs } from "@/server/data/products";
import { getRentalSlugs } from "@/server/data/rentals";
import {
  getPostSlugs,
  getBlogCategories,
  getPopularTags,
} from "@/server/data/blog";
import { US_STATES, getPriorityCities } from "@/lib/locations";
import { USE_CASES } from "@/lib/use-cases";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// A stable content date. We deliberately DON'T stamp `new Date()` on every
// build — telling Google all ~500 URLs "changed today" on every deploy is a
// low-trust signal. Bump this when location/static content is meaningfully
// revised; dynamic entries (products/posts) can carry their own dates later.
// 2026-07-31: bumped after a site-wide content refresh + recovery from a DB
// outage, to prompt Google to recrawl pages it saw erroring during downtime.
// 2026-08-03: refreshed again after the internal-linking, navigation and
// new-blog updates — nudge Google to recrawl the improved pages.
// 2026-08-12: the duplicate second domain now 301s here, the fabricated
// aggregateRating markup is gone, and the fall/Halloween cluster shipped. Every
// page's markup changed and six new URLs appeared, so a recrawl is genuinely
// warranted this time.
const CONTENT_UPDATED = new Date("2026-08-12T00:00:00Z");

// Fully-translated pages — indexed in BOTH locales (en + fr), with hreflang.
const BILINGUAL_STATIC = [
  "",
  "/about",
  "/services",
  "/shop",
  "/rent",
  "/blog",
  "/testimonials",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
];

// English-only programmatic pages. Their French variants render English copy
// (duplicates) and are `noindex`, so we keep them out of the sitemap entirely
// and concentrate crawl budget on the pages that can actually rank.
const EN_ONLY_STATIC = [
  "/water-slide-rentals",
  "/bounce-house-rentals",
  "/water-slides-for",
  "/answers",
];

// All 51 state hubs stay indexed (few, and genuine internal hubs). City pages
// are trimmed to the wave-1 priority metros only — the rest are noindex until
// the domain earns authority and we widen the net in waves.
const LOCATION_PATHS = US_STATES.map((s) => `/water-slide-rentals/${s.slug}`);
const CITY_PATHS = getPriorityCities().map(
  (c) => `/water-slide-rentals/${c.state.slug}/${c.slug}`,
);
// The bounce-house family mirrors the water-slide one exactly — same states,
// same wave-1 metros — because it is gated by the same indexing discipline.
const BOUNCE_STATE_PATHS = US_STATES.map(
  (s) => `/bounce-house-rentals/${s.slug}`,
);
const BOUNCE_CITY_PATHS = getPriorityCities().map(
  (c) => `/bounce-house-rentals/${c.state.slug}/${c.slug}`,
);
const USE_CASE_PATHS = USE_CASES.map((u) => `/water-slides-for/${u.slug}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, rentals, posts, blogCats, tags] = await Promise.all([
    getProductSlugs().catch(() => []),
    getRentalSlugs().catch(() => []),
    getPostSlugs().catch(() => []),
    getBlogCategories().catch(() => []),
    getPopularTags().catch(() => []),
  ]);

  const bilingualPaths = [
    ...BILINGUAL_STATIC,
    ...products.map((p) => `/shop/${p.slug}`),
    ...rentals.map((p) => `/rent/${p.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    // NOTE: /shop?category=… is deliberately NOT listed. Those pages
    // self-canonicalise to /shop, and Google drops non-canonical sitemap
    // entries as "Alternate page with proper canonical tag" while still
    // spending crawl budget on them. indexing-urls.txt already excludes them.
    ...blogCats.map((c) => `/blog/category/${c.slug}`),
    ...tags.map((t) => `/blog/tag/${t.slug}`),
  ];

  const enOnlyPaths = [
    ...EN_ONLY_STATIC,
    ...LOCATION_PATHS,
    ...CITY_PATHS,
    ...BOUNCE_STATE_PATHS,
    ...BOUNCE_CITY_PATHS,
    ...USE_CASE_PATHS,
  ];

  const en = routing.defaultLocale;

  // Bilingual: one entry per locale, cross-linked with hreflang alternates.
  const bilingualEntries: MetadataRoute.Sitemap = bilingualPaths.flatMap(
    (path) =>
      routing.locales.map((locale) => ({
        url: `${SITE}/${locale}${path}`,
        lastModified: CONTENT_UPDATED,
        changeFrequency: "weekly" as const,
        priority: path === "" ? 1 : 0.7,
        // Same hreflang codes the pages themselves emit (`en-US`, `fr`,
        // `x-default`). Google drops a pair whose HTML and sitemap annotations
        // disagree, so these MUST stay derived from one source — lib/seo.ts.
        alternates: { languages: hreflangAlternates(path) },
      })),
  );

  // English-only: a single canonical entry, no French alternate.
  const enOnlyEntries: MetadataRoute.Sitemap = enOnlyPaths.map((path) => ({
    url: `${SITE}/${en}${path}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...bilingualEntries, ...enOnlyEntries];
}
