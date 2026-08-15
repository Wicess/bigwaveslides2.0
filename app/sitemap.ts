import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
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
const EN = routing.defaultLocale;

// A stable content date. We deliberately DON'T stamp `new Date()` on every
// build — telling Google all ~570 URLs "changed today" on every deploy is a
// low-trust signal. Bump this when content is meaningfully revised.
// 2026-08-03: internal-linking, navigation and new-blog updates.
// 2026-08-12: duplicate second domain now 301s here, fabricated aggregateRating
// removed, fall/Halloween cluster shipped, bounce-house family added.
// 2026-08-13: French retired — every /fr URL now 301s to /en, so the whole
// sitemap changed shape. A recrawl is genuinely warranted.
// 2026-08-15: the largest content change the site has had — all 53 product
// descriptions rewritten, the 9-post blog cluster written and republished, and
// 312 dead internal product links repaired across 43 posts. Nearly every URL in
// this file now returns different text than it did on the last crawl, which is
// exactly the case `lastmod` exists for.
const CONTENT_UPDATED = new Date("2026-08-15T00:00:00Z");

/**
 * Every indexable path, without the locale prefix.
 *
 * There is ONE list because there is one language. The site was bilingual until
 * 2026-08-13, which needed the paths split into "translated" and "English-only"
 * buckets plus hreflang annotations on the former; retiring French collapsed all
 * of that. The old /fr URLs are not listed anywhere — they 301 to /en (see
 * middleware.ts), and a sitemap should only ever contain final, canonical,
 * 200-returning URLs. Listing a redirect wastes crawl budget and is reported in
 * Search Console as "Page with redirect".
 */
const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/shop",
  "/rent",
  "/blog",
  "/testimonials",
  "/contact",
  "/faq",
  "/answers",
  "/water-slide-rentals",
  "/bounce-house-rentals",
  "/water-slides-for",
  "/privacy-policy",
  "/terms-of-service",
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

  const paths = [
    ...STATIC_PATHS,
    ...products.map((p) => `/shop/${p.slug}`),
    ...rentals.map((p) => `/rent/${p.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    // NOTE: /shop?category=… is deliberately NOT listed. Those pages
    // self-canonicalise to /shop, and Google drops non-canonical sitemap
    // entries as "Alternate page with proper canonical tag" while still
    // spending crawl budget on them.
    ...blogCats.map((c) => `/blog/category/${c.slug}`),
    ...tags.map((t) => `/blog/tag/${t.slug}`),
    ...LOCATION_PATHS,
    ...CITY_PATHS,
    ...BOUNCE_STATE_PATHS,
    ...BOUNCE_CITY_PATHS,
    ...USE_CASE_PATHS,
  ];

  // No `alternates` — with a single language there is nothing to point at, and
  // a self-only hreflang is ignored by Google (see lib/seo.ts).
  return paths.map((path) => ({
    url: `${SITE}/${EN}${path === "/" ? "" : path}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
