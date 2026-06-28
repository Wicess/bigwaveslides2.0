// lib/seo.ts
// One place that builds complete, consistent page metadata: canonical URL,
// hreflang alternates (en/fr + x-default), Open Graph and Twitter cards, and a
// dynamic OG image. Every page's generateMetadata should call buildMetadata so
// new pages/posts are SEO-complete automatically.
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function abs(locale: string, path: string): string {
  return `${SITE}/${locale}${path === "/" ? "" : path}`;
}

/** Real product/post image when we have one, else a branded dynamic OG card. */
function ogImageUrl(title: string, image?: string | null): string {
  if (image) return image;
  return `${SITE}/api/og?title=${encodeURIComponent(title)}`;
}

export type SeoInput = {
  locale: string;
  /** Path without locale prefix, e.g. "/rent" or "/rent/tropical-wave-18". */
  path: string;
  title: string;
  description: string;
  /** Absolute image URL (product/post photo). Falls back to dynamic OG. */
  image?: string | null;
  type?: "website" | "article";
  keywords?: string[];
  /** Set true for cart/checkout/thank-you style pages. */
  noindex?: boolean;
};

export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  keywords,
  noindex,
}: SeoInput): Metadata {
  const canonical = abs(locale, path);
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = abs(l, path);
  languages["x-default"] = abs(routing.defaultLocale, path);

  const img = ogImageUrl(title, image);

  return {
    title,
    description,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      type,
      siteName: "Big Wave Slides",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
