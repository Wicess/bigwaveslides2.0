import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const NAME = "Big Wave Slides";
// Real business facts (match lib/email.ts + site settings) — shown in rich
// results, so keep them in lockstep with the NAP used everywhere else.
const PHONE = "+1 (614) 302-5899";
const EMAIL = "contact@bigwaveslides.com";
const PRICE_RANGE = "$199 - $550";

type Json = Record<string, unknown>;

export function organizationLd(
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  },
  /** Social profile URLs → `sameAs`, which helps Google build the brand entity. */
  sameAs?: (string | undefined)[],
): Json {
  const links = (sameAs ?? []).filter(Boolean) as string[];
  // Prefer a fully structured PostalAddress (city/state/ZIP); fall back to the
  // display string only if the structured parts aren't set.
  const address =
    contact?.addressLocality && contact?.addressRegion
      ? {
          "@type": "PostalAddress",
          ...(contact.streetAddress
            ? { streetAddress: contact.streetAddress }
            : {}),
          addressLocality: contact.addressLocality,
          addressRegion: contact.addressRegion,
          ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
          addressCountry: contact.addressCountry ?? "US",
        }
      : contact?.address
        ? { "@type": "PostalAddress", streetAddress: contact.address }
        : undefined;
  return {
    "@context": "https://schema.org",
    // LocalBusiness (rental) is far stronger than Organization for local rank.
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id": `${SITE}/#business`,
    name: NAME,
    url: SITE,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/icon.png`,
    priceRange: PRICE_RANGE,
    // Nationwide delivery across the United States.
    areaServed: { "@type": "Country", name: "United States" },
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(address ? { address } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

/**
 * LocalBusiness for the programmatic location landing pages. Optionally pins a
 * strategic anchor city (the state's largest-demand metro) so each state reads
 * as a location strategically positioned within it — without inventing a
 * physical street address (the real HQ stays the only postal address, set on
 * the site-wide Organization schema).
 */
export function localBusinessAreaLd(
  area: string,
  url: string,
  anchor?: { city: string; region: string },
): Json {
  const areaServed: Json[] = [];
  if (anchor) {
    areaServed.push({ "@type": "City", name: `${anchor.city}, ${anchor.region}` });
  }
  areaServed.push({ "@type": "State", name: area });
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    name: `${NAME} — Water Slide Rentals in ${area}`,
    url,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/icon.png`,
    priceRange: PRICE_RANGE,
    telephone: PHONE,
    email: EMAIL,
    // Ties every location page back to the one real business entity / HQ.
    provider: { "@type": "LocalBusiness", "@id": `${SITE}/#business` },
    areaServed: areaServed.length === 1 ? areaServed[0]! : areaServed,
  };
}

/**
 * ItemList of rentable products for location/hub pages — Product + Offer (real
 * daily price) + AggregateRating (real review data). Gives Google structured
 * price/rating context for the catalog each landing page displays.
 */
export function rentalItemListLd(
  locale: string,
  items: readonly {
    slug: string;
    name: unknown;
    dailyRateCents: number | null;
    ratingAvg: unknown;
    ratingCount: number;
    media?: { url: string }[];
  }[],
): Json {
  const name = (v: unknown) =>
    typeof v === "object" && v !== null
      ? ((v as Record<string, string>)[locale] ??
        (v as Record<string, string>).en ??
        "")
      : String(v ?? "");
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: name(p.name),
        url: `${SITE}/${locale}/rent/${p.slug}`,
        ...(p.media?.[0]?.url ? { image: p.media[0].url } : {}),
        brand: { "@type": "Brand", name: NAME },
        ...(p.dailyRateCents != null
          ? {
              offers: {
                "@type": "Offer",
                price: (p.dailyRateCents / 100).toFixed(2),
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                url: `${SITE}/${locale}/rent/${p.slug}`,
              },
            }
          : {}),
        ...(Number(p.ratingAvg) > 0 && p.ratingCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(p.ratingAvg).toFixed(1),
                reviewCount: p.ratingCount,
              },
            }
          : {}),
      },
    })),
  };
}

/** Service schema for the use-case landing pages (birthday parties, etc.). */
export function serviceLd(s: {
  name: string;
  description: string;
  url: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: s.name,
    name: s.name,
    description: s.description,
    url: s.url,
    areaServed: { "@type": "Country", name: "United States" },
    provider: {
      "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
      "@id": `${SITE}/#business`,
      name: NAME,
      url: SITE,
    },
  };
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NAME,
    url: SITE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/en/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productLd(p: {
  name: string;
  description?: string;
  image?: string | null;
  url: string;
  priceCents?: number | null;
  ratingAvg?: number;
  ratingCount?: number;
  sku?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    url: p.url,
    brand: { "@type": "Brand", name: NAME },
    ...(p.priceCents != null
      ? {
          offers: {
            "@type": "Offer",
            price: (p.priceCents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: p.url,
          },
        }
      : {}),
    ...(p.ratingCount && p.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (p.ratingAvg ?? 0).toFixed(1),
            reviewCount: p.ratingCount,
          },
        }
      : {}),
  };
}

export function articleLd(a: {
  title: string;
  description?: string;
  image?: string | null;
  url: string;
  datePublished?: string;
  author?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    ...(a.description ? { description: a.description } : {}),
    ...(a.image ? { image: a.image } : {}),
    url: a.url,
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    author: {
      "@type": a.author ? "Person" : "Organization",
      name: a.author ?? NAME,
    },
    publisher: { "@type": "Organization", name: NAME },
  };
}

export function eventLd(e: {
  name: string;
  description?: string;
  image?: string | null;
  url: string;
  startDate: string;
  endDate?: string;
  location?: string | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    ...(e.description ? { description: e.description } : {}),
    ...(e.image ? { image: e.image } : {}),
    url: e.url,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: e.location
      ? { "@type": "Place", name: e.location, address: e.location }
      : { "@type": "VirtualLocation", url: e.url },
    organizer: { "@type": "Organization", name: NAME, url: SITE },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function absoluteUrl(locale: string, path: string): string {
  return `${SITE}/${locale}${path}`;
}
