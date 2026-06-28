import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const NAME = "Big Wave Slides";

type Json = Record<string, unknown>;

// Cities/areas served — drives local-SEO relevance. Edit to match the real
// delivery area (Columbus, OH metro by default). Used by both schema and the
// programmatic location pages.
export const AREA_SERVED = [
  "Columbus",
  "Dublin",
  "Westerville",
  "Gahanna",
  "Hilliard",
  "Grove City",
  "Powell",
  "Pickerington",
  "Reynoldsburg",
  "Worthington",
  "New Albany",
  "Upper Arlington",
];

export function organizationLd(contact?: {
  email?: string;
  phone?: string;
  address?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    // LocalBusiness (rental) is far stronger than Organization for local rank.
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id": `${SITE}/#business`,
    name: NAME,
    url: SITE,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/api/og`,
    priceRange: "$$",
    areaServed: AREA_SERVED.map((city) => ({ "@type": "City", name: city })),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.address
      ? { address: { "@type": "PostalAddress", streetAddress: contact.address } }
      : {}),
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
    author: { "@type": a.author ? "Person" : "Organization", name: a.author ?? NAME },
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
