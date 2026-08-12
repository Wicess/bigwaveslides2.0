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

/**
 * hreflang codes, deliberately region-qualified for English.
 *
 * The business sells and delivers **only in the United States**, so the English
 * pages are annotated `en-US` rather than a bare `en`. A bare `en` invites every
 * English-speaking market on earth (UK, IE, AU, NZ, ZA, IN, NG, PH…) to be
 * served these pages; `en-US` tells Google plainly that this content is for US
 * searchers. `x-default` still points at the English page so anyone outside the
 * declared markets lands somewhere sensible instead of nowhere.
 *
 * Search Console's old International Targeting tool is gone (retired 2022), so
 * hreflang + on-page signals (USD prices, US phone/address, state pages) are
 * now the ONLY way to declare country targeting on a gTLD like .com.
 */
export const HREFLANG: Record<string, string> = { en: "en-US", fr: "fr" };

/** Build the hreflang alternates map (self-referencing + x-default). */
export function hreflangAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[HREFLANG[l] ?? l] = abs(l, path);
  languages["x-default"] = abs(routing.defaultLocale, path);
  return languages;
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
  /** Price hook rendered in the footer strip, e.g. "From $199/day". */
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
  /**
   * True when only the default-locale version is real content — the
   * programmatic pages (locations, occasions, answers) whose French routes
   * render the same English copy.
   *
   * Does two things that must always travel together:
   *   1. noindexes every non-default locale, and
   *   2. drops hreflang entirely.
   *
   * (2) is the part that's easy to miss. Declaring `hreflang="fr"` toward a
   * page that is itself `noindex` is a contradiction: Google is told a French
   * alternate exists, follows it, finds "don't index me", and discards the
   * whole cluster — so the English page's annotations are wasted too. A page
   * with one real version should simply declare no alternates.
   */
  enOnly?: boolean;
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
  locale: string,
): string {
  const fr = locale === "fr";
  switch (categorySlug) {
    case "bounce-houses":
      return fr ? "château gonflable" : "bounce house";
    case "combo-units":
      return fr ? "combiné saut et toboggan" : "bounce & slide combo";
    case "party-attractions":
      return fr
        ? "attraction de fête gonflable"
        : "inflatable party attraction";
    default:
      return fr ? "glissade d'eau gonflable" : "inflatable water slide";
  }
}

type ProductSeoOpts = { price?: string; kind?: string };

export function rentProductSeo(
  name: string,
  locale: string,
  opts?: ProductSeoOpts,
) {
  const fr = locale === "fr";
  const kind =
    opts?.kind ?? (fr ? "glissade d'eau gonflable" : "inflatable water slide");
  const priceHook = opts?.price
    ? fr
      ? ` dès ${opts.price}/jour`
      : ` from ${opts.price}/day`
    : "";
  return {
    title: fr
      ? `Location ${name} — livrée, installée et assurée`
      : `Rent the ${name} — Delivered, Set Up & Insured`,
    description: fr
      ? `Louez ${name}, une ${kind}${priceHook} — livraison, installation, désinfection et assurance comprises. Devis gratuit, réservez votre date.`
      : `Rent the ${name} ${kind}${priceHook} — delivered, set up, sanitized and fully insured for birthdays, pool parties, school and church events. Free quote.`,
    keywords: fr
      ? [
          `location ${name}`,
          `location ${kind}`,
          "location glissade d'eau près de moi",
          "location château gonflable",
          "location gonflable fête",
        ]
      : [
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
export function saleProductSeo(
  name: string,
  locale: string,
  opts?: ProductSeoOpts,
) {
  const fr = locale === "fr";
  const kind =
    opts?.kind ?? (fr ? "glissade d'eau gonflable" : "inflatable water slide");
  const priceHook = opts?.price
    ? fr
      ? ` — ${opts.price}`
      : ` — ${opts.price}`
    : "";
  return {
    title: fr
      ? `${name} à vendre — ${kind} commerciale`
      : `${name} for Sale — Commercial ${kind.replace(/^inflatable /, "")}`,
    description: fr
      ? `Achetez ${name}, une ${kind} commerciale${priceHook} — robuste, conçue pour la location et la revente, livraison partout aux États-Unis. Devis sur demande.`
      : `Buy the ${name} commercial ${kind}${priceHook} — heavy-duty, built for rentals and resale, delivered anywhere in the USA. Request a price quote.`,
    keywords: fr
      ? [
          `${name} à vendre`,
          `${kind} à vendre`,
          "gonflable commercial à vendre",
          "acheter glissade d'eau",
          "démarrer entreprise de location",
        ]
      : [
          `buy ${name}`,
          `commercial ${kind} for sale`,
          "buy inflatable water slides",
          "commercial inflatables for sale",
          "start a water slide rental business",
        ],
  };
}

/** Keyword-rich SEO copy for a product category listing page. */
export function categorySeo(name: string, locale: string) {
  const fr = locale === "fr";
  return {
    title: fr
      ? `${name} — location et vente de glissades d'eau`
      : `${name} — Rentals & For Sale | Inflatable Water Slides`,
    description: fr
      ? `Découvrez nos ${name.toLowerCase()} à louer et à vendre : glissades d'eau gonflables livrées, installées et assurées partout aux États-Unis. Devis gratuit.`
      : `Browse ${name.toLowerCase()} to rent or buy — inflatable water slides delivered, set up, and insured nationwide. Get a fast, free water slide rental quote.`,
    keywords: fr
      ? [
          `location ${name.toLowerCase()}`,
          "location glissade d'eau",
          "glissade d'eau gonflable",
        ]
      : [
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
  enOnly,
}: SeoInput): Metadata {
  const canonical = abs(locale, path);
  const img = ogImageUrl(title, image, og);
  const hidden =
    noindex || (enOnly === true && locale !== routing.defaultLocale);

  return {
    title,
    description,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: {
      canonical,
      ...(enOnly ? {} : { languages: hreflangAlternates(path) }),
    },
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
    ...(hidden
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
