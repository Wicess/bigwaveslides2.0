import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { getProductSlugs } from "@/server/data/products";
import { getRentalSlugs } from "@/server/data/rentals";
import { getPostSlugs, getBlogCategories, getPopularTags } from "@/server/data/blog";
import { getProductCategories } from "@/server/data/products";
import { US_STATES } from "@/lib/locations";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/shop",
  "/rent",
  "/blog",
  "/testimonials",
  "/contact",
  "/water-slide-rentals",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
];

// Programmatic nationwide location pages.
const LOCATION_PATHS = US_STATES.map((s) => `/water-slide-rentals/${s.slug}`);

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

  const dynamicPaths = [
    ...products.map((p) => `/shop/${p.slug}`),
    ...rentals.map((p) => `/rent/${p.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
    ...productCats.map((c) => `/shop/category/${c.slug}`),
    ...blogCats.map((c) => `/blog/category/${c.slug}`),
    ...tags.map((t) => `/blog/tag/${t.slug}`),
  ];

  const allPaths = [...STATIC_PATHS, ...LOCATION_PATHS, ...dynamicPaths];
  const now = new Date();

  // One entry per locale, with hreflang alternates linking the locale variants.
  return allPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE}/${l}${path}`]),
        ),
      },
    })),
  );
}
