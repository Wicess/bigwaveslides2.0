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
import {
  BOUNCE_STATE_KEYS,
  US_STATES,
  getPriorityCities,
} from "@/lib/locations";
import { USE_CASES } from "@/lib/use-cases";
import { PROFILED_CITY_KEYS } from "@/lib/city-profiles";

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

// ─── Per-group content dates ─────────────────────────────────────────────────
// The single date above stopped being true and nobody bumped it. By mid-
// September every one of the 752 city pages still claimed it had not changed
// since August 15 — after all 752 became indexable (Sep 6), the bounce-house
// tree was cut and every city page re-linked (Sep 7), and 735 of them were
// rewritten around their own measured climate (Sep 13). lastmod is the signal
// Google uses to decide what to recrawl, so the largest content change these
// pages have ever had was invisible to it.
//
// Bumping the one constant would have been a different lie: it would claim the
// homepage, contact page and every use-case page changed too. A lastmod that
// over-claims is how a crawler learns to ignore it for the whole site. So each
// group carries the date its content actually changed, taken from git — commits
// that only change how a page runs (perf, chore, refactor) do not count, unless
// they also change what the page says.
//
// When you change what one of these pages SAYS, update its date here.
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** City pages rewritten around NOAA climate data (lib/city-climate.ts). */
const CITIES_UPDATED = d("2026-09-13");
/** The 17 hand-profiled cities: not rewritten on Sep 13, re-linked on Sep 7. */
const PROFILED_CITIES_UPDATED = d("2026-09-07");
/** State hubs: bounce-house cross-links gated to surviving pages. */
const STATE_HUBS_UPDATED = d("2026-09-07");
/** Use-case pages: meta fitted to display width. */
const USE_CASES_UPDATED = d("2026-08-31");

/** Static pages, each from its own last content commit. */
const STATIC_UPDATED: Record<string, Date> = {
  "": CONTENT_UPDATED,
  "/about": d("2026-08-31"),
  "/services": CONTENT_UPDATED,
  "/testimonials": d("2026-09-06"),
  "/contact": CONTENT_UPDATED,
  "/faq": d("2026-09-06"),
  "/answers": CONTENT_UPDATED,
  // Its city grid was cut from 752 links to the 123 with local data. That
  // commit was labelled perf, but it changed what the page lists.
  "/water-slide-rentals": d("2026-09-06"),
  "/bounce-house-rentals": d("2026-09-07"),
  "/water-slides-for": USE_CASES_UPDATED,
  "/privacy-policy": d("2026-09-06"),
  "/terms-of-service": d("2026-09-06"),
};

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
const PROFILED = new Set(PROFILED_CITY_KEYS);
const CITY_ENTRIES = getPriorityCities().map((c) => ({
  path: `/water-slide-rentals/${c.state.slug}/${c.slug}`,
  lastModified: PROFILED.has(`${c.state.slug}/${c.slug}`)
    ? PROFILED_CITIES_UPDATED
    : CITIES_UPDATED,
}));
// The bounce-house family keeps its 51 state hubs and drops its city tier. It
// used to mirror the water-slide family city for city, which put two
// near-identical pages about the same town in the sitemap and made bounce
// houses 44% of it — on a water-slide business. See BOUNCE_STATE_KEYS.
const BOUNCE_STATE_PATHS = BOUNCE_STATE_KEYS.map(
  (s) => `/bounce-house-rentals/${s}`,
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

  // Per-URL lastModified where we genuinely know it. Bing's guidelines (§3)
  // ask for accurate lastmod because it is how it decides what to re-crawl,
  // and a single site-wide date is a worse signal than a real one: it claims
  // every URL changed whenever any did. Products and posts carry updatedAt, so
  // those are exact. Static, location and use-case pages have no per-row date
  // and keep CONTENT_UPDATED, which is what that constant is actually for.
  const dated: { path: string; lastModified: Date }[] = [
    ...products.map((p) => ({
      path: `/shop/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...rentals.map((p) => ({
      path: `/rent/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];

  // A listing changes whenever its newest item does, so date it from that
  // rather than from a constant that would never move.
  const newest = (rows: { updatedAt: Date }[]) =>
    rows.reduce<Date>(
      (latest, r) => (r.updatedAt > latest ? r.updatedAt : latest),
      CONTENT_UPDATED,
    );
  const listingDates: Record<string, Date> = {
    "/shop": newest(products),
    "/rent": newest(rentals),
    "/blog": newest(posts),
  };

  const staticEntries = STATIC_PATHS.map((path) => ({
    path,
    lastModified: listingDates[path] ?? STATIC_UPDATED[path] ?? CONTENT_UPDATED,
  }));

  const grouped = [
    ...staticEntries,
    ...CITY_ENTRIES,
    ...LOCATION_PATHS.map((path) => ({
      path,
      lastModified: STATE_HUBS_UPDATED,
    })),
    ...BOUNCE_STATE_PATHS.map((path) => ({
      path,
      lastModified: STATE_HUBS_UPDATED,
    })),
    ...USE_CASE_PATHS.map((path) => ({
      path,
      lastModified: USE_CASES_UPDATED,
    })),
    // NOTE: /shop?category=… is deliberately NOT listed. Those pages
    // self-canonicalise to /shop, and Google drops non-canonical sitemap
    // entries as "Alternate page with proper canonical tag" while still
    // spending crawl budget on them.
    //
    // Category and tag listings keep the site-wide date. Dating them from the
    // newest post overall would claim a category changed when a post went into
    // a different one; an old date only means they are recrawled a little
    // later, which is the safe direction to be wrong in.
    ...[
      ...blogCats.map((c) => `/blog/category/${c.slug}`),
      ...tags.map((t) => `/blog/tag/${t.slug}`),
    ].map((path) => ({ path, lastModified: CONTENT_UPDATED })),
  ];

  const entries = [...grouped, ...dated];

  // No `alternates` — with a single language there is nothing to point at, and
  // a self-only hreflang is ignored by Google (see lib/seo.ts).
  return entries.map(({ path, lastModified }) => ({
    url: `${SITE}/${EN}${path === "" ? "" : path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
