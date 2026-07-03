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
      ? `Louez ${name}, une ${kind}${priceHook} — livraison, installation, désinfection et assurance comprises pour anniversaires, fêtes de piscine, écoles, églises et événements. Devis gratuit, réservez votre date.`
      : `Rent the ${name} ${kind}${priceHook} — delivered, set up, sanitized and fully insured for birthdays, pool parties, school, church and community events. Get a free quote and book your date today.`,
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
      : `Buy the ${name} — Commercial ${kind.replace(/^inflatable /, "")} for Sale`,
    description: fr
      ? `Achetez ${name}, une ${kind} commerciale${priceHook} — qualité robuste conçue pour la location et la revente, livraison partout aux États-Unis. Parcourez nos gonflables à vendre et demandez un devis.`
      : `Buy the ${name} commercial ${kind}${priceHook} — heavy-duty, built for rentals and resale, with nationwide delivery. Perfect for starting or growing a rental business. Request a price quote.`,
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
