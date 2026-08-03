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
import { getProductCategories } from "@/server/data/products";
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
const CONTENT_UPDATED = new Date("2026-08-03T00:00:00Z");

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
const USE_CASE_PATHS = USE_CASES.map((u) => `/water-slides-for/${u.slug}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, rentals, posts, productCats, blogCats, tags] =
    await Promise.all([
      getProductSlugs().catch(() => []),
      getRentalSlugs().catch(() => []),
      getPostSlugs().catch(() => []),
      getProductCategories().catch(() => []),
      getBlogCategories().catch(() => []),
      getPopularTags().catch(() => []),
    ]);

  const bilingualPaths = [
    ...BILINGUAL_STATIC,
    ...products.map((p) => `/shop/${p.slug}`),
    ...rentals.map((p) => `/rent/${p.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    ...productCats.map((c) => `/shop?category=${c.slug}`),
    ...blogCats.map((c) => `/blog/category/${c.slug}`),
    ...tags.map((t) => `/blog/tag/${t.slug}`),
  ];

  const enOnlyPaths = [
    ...EN_ONLY_STATIC,
    ...LOCATION_PATHS,
    ...CITY_PATHS,
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
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE}/${l}${path}`]),
          ),
        },
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
