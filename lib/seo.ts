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
export function rentProductSeo(name: string, locale: string) {
  const fr = locale === "fr";
  return {
    title: fr
      ? `Location ${name} — glissade d'eau gonflable`
      : `${name} Water Slide Rental — Delivered & Set Up`,
    description: fr
      ? `Louez la glissade d'eau gonflable ${name} : livraison, installation et assurance comprises pour anniversaires, fêtes de piscine, écoles et églises. Obtenez un devis gratuit.`
      : `Rent the ${name} inflatable water slide — delivered, set up and fully insured for birthday parties, pool parties, and school & church events. Get a free water slide rental quote.`,
    keywords: fr
      ? [`location ${name}`, "location glissade d'eau", "glissade d'eau gonflable", "location glissade d'eau gonflable", "location glissade d'eau près de moi"]
      : [`${name} rental`, "water slide rental", "inflatable water slide rental", "water slide rental near me", "backyard water slide rental", "party water slide rental"],
  };
}

/** Keyword-rich SEO copy for a SALE product page (buying intent). */
export function saleProductSeo(name: string, locale: string) {
  const fr = locale === "fr";
  return {
    title: fr
      ? `${name} — glissade d'eau gonflable à vendre`
      : `${name} — Commercial Water Slide for Sale`,
    description: fr
      ? `Achetez la glissade d'eau gonflable commerciale ${name} : qualité robuste, idéale pour la location et la revente, livraison partout aux États-Unis. Demandez un devis.`
      : `Buy the ${name} commercial inflatable water slide — heavy-duty, built for rentals and resale, with nationwide delivery. Request a water slide price quote.`,
    keywords: fr
      ? [`${name} à vendre`, "glissade d'eau à vendre", "glissade d'eau gonflable à vendre", "acheter glissade d'eau", "glissade d'eau commerciale"]
      : [`buy ${name}`, "commercial water slides for sale", "buy inflatable water slides", "inflatable water slides for sale", "commercial inflatable water slides"],
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
      ? [`location ${name.toLowerCase()}`, "location glissade d'eau", "glissade d'eau gonflable"]
      : [`${name.toLowerCase()} rentals`, "water slide rentals", "inflatable water slide rentals", "commercial water slides for sale"],
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
