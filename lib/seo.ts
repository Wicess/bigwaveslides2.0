// lib/seo.ts
// One place that builds complete, consistent page metadata: canonical URL,
// Open Graph and Twitter cards, robots directives, and a dynamic OG image.
// Every page's generateMetadata should call buildMetadata so new pages and
// posts are SEO-complete automatically.
//
// NO HREFLANG. The site is English (en-US) only — see i18n/routing.ts. hreflang
// exists to map a page to its equivalents in other languages; with a single
// language version there is nothing to map and Google ignores a self-only
// annotation. Country targeting is instead carried by <html lang="en-US">
// (app/[locale]/layout.tsx) and the US signals on the LocalBusiness entity
// (lib/structured-data.ts): areaServed, currenciesAccepted: USD, knowsLanguage,
// a US postal address and phone. Those are the only levers left on a .com now
// that Search Console's International Targeting tool is retired.
import type { Metadata } from "next";
import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function abs(locale: string, path: string): string {
  return `${SITE}/${locale}${path === "/" ? "" : path}`;
}

/**
 * Extra art-direction for the generated Open Graph card. Ignored when the page
 * has a real photo (a product shot always beats a generated card).
 */
export type OgParams = {
  /** Small caps label above the headline, e.g. "Houston, TX". */
  eyebrow?: string;
  /** One-line supporting sentence under the headline. */
  subtitle?: string;
  /** Pill in the top-right, e.g. "Delivered nationwide". */
  badge?: string;
  /** Price hook rendered in the footer strip, e.g. "From $155/day". */
  price?: string;
};

/** Real product/post image when we have one, else a branded dynamic OG card. */
function ogImageUrl(
  title: string,
  image?: string | null,
  og?: OgParams,
): string {
  if (image) return image;
  const q = new URLSearchParams({ title });
  if (og?.eyebrow) q.set("eyebrow", og.eyebrow);
  if (og?.subtitle) q.set("subtitle", og.subtitle);
  if (og?.badge) q.set("badge", og.badge);
  if (og?.price) q.set("price", og.price);
  return `${SITE}/api/og?${q.toString()}`;
}

export type SeoInput = {
  locale: string;
  /** Path without locale prefix, e.g. "/rent" or "/rent/tropical-wave-18". */
  path: string;
  title: string;
  description: string;
  /** Absolute image URL (product/post photo). Falls back to dynamic OG. */
  image?: string | null;
  /** Art direction for the generated OG card (unused when `image` is set). */
  og?: OgParams;
  type?: "website" | "article";
  keywords?: string[];
  /**
   * Keep the page out of the index while leaving it crawlable and followable —
   * used for the non-priority city pages, which are real pages we simply don't
   * want competing for terms the domain can't win yet.
   */
  noindex?: boolean;
};

/**
 * Keyword-rich SEO copy for a RENTAL product page. Brand-free, high-intent —
 * leads with "Water Slide Rental" so an unknown brand doesn't waste the title.
 */
/**
 * Human label for a product's kind, derived from its category slug, so meta
 * copy is accurate for slides, bounce houses and combos alike (not always
 * "water slide").
 */
export function productKindLabel(
  categorySlug: string | null | undefined,
): string {
  switch (categorySlug) {
    case "bounce-houses":
      return "bounce house";
    case "combo-units":
      return "bounce & slide combo";
    case "party-attractions":
      return "inflatable party attraction";
    default:
      return "inflatable water slide";
  }
}

type ProductSeoOpts = { price?: string; kind?: string };

export function rentProductSeo(name: string, opts?: ProductSeoOpts) {
  const kind = opts?.kind ?? "inflatable water slide";
  const priceHook = opts?.price ? ` from ${opts.price}/day` : "";
  return {
    title: `Rent the ${name} — Delivered, Set Up & Insured`,
    description: `Rent the ${name} ${kind}${priceHook} — delivered, set up, sanitized and fully insured for birthdays, pool parties, school and church events. Free quote.`,
    keywords: [
      `${name} rental`,
      `${kind} rental`,
      "water slide rental near me",
      "bounce house rental near me",
      "party rental near me",
      "backyard water slide rental",
    ],
  };
}

/** Keyword-rich SEO copy for a SALE product page (buying intent). */
export function saleProductSeo(name: string, opts?: ProductSeoOpts) {
  const kind = opts?.kind ?? "inflatable water slide";
  const priceHook = opts?.price ? ` — ${opts.price}` : "";
  return {
    title: `${name} for Sale — Commercial ${kind.replace(/^inflatable /, "")}`,
    description: `Buy the ${name} commercial ${kind}${priceHook} — heavy-duty, built for rentals and resale, delivered anywhere in the USA. Request a price quote.`,
    keywords: [
      `buy ${name}`,
      `commercial ${kind} for sale`,
      "buy inflatable water slides",
      "commercial inflatables for sale",
      "start a water slide rental business",
    ],
  };
}

/** Keyword-rich SEO copy for a product category listing page. */
export function categorySeo(name: string) {
  return {
    title: `${name} — Rentals & For Sale | Inflatable Water Slides`,
    description: `Browse ${name.toLowerCase()} to rent or buy — inflatable water slides delivered, set up, and insured nationwide. Get a fast, free water slide rental quote.`,
    keywords: [
      `${name.toLowerCase()} rentals`,
      "water slide rentals",
      "inflatable water slide rentals",
      "commercial water slides for sale",
    ],
  };
}

export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  og,
  type = "website",
  keywords,
  noindex,
}: SeoInput): Metadata {
  const canonical = abs(locale, path);
  const img = ogImageUrl(title, image, og);

  return {
    title,
    description,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type,
      siteName: "Splash Republic",
      locale: "en_US",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
    ...(noindex
      ? // `noindex, follow` — NOT `nofollow`. Every page that reaches this
        // branch (a non-priority city, a French duplicate) is still a real,
        // linked page in the site graph: it lists products, guides and sibling
        // locations. `nofollow` would stop link equity flowing through those
        // links to the pages we *do* want to rank, which is the opposite of
        // what a de-indexed hub page is for. Genuinely private areas
        // (/cart, /checkout, /account, /admin) are blocked in robots.ts instead.
        { robots: { index: false, follow: true } }
      : {
          // Let Google show the biggest image thumbnail and an unlimited-length
          // snippet. Without `max-snippet:-1` Google caps the text it may quote,
          // which directly limits what AI Overviews and other answer engines can
          // lift from the page — the single cheapest AEO/GEO win available.
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-video-preview": -1,
              "max-image-preview": "large",
              "max-snippet": -1,
            },
          },
        }),
  };
}
