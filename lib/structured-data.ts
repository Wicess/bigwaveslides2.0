import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const NAME = "Big Wave Slides";

type Json = Record<string, unknown>;

export function organizationLd(
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  },
  /** Social profile URLs → `sameAs`, which helps Google build the brand entity. */
  sameAs?: (string | undefined)[],
): Json {
  const links = (sameAs ?? []).filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    // LocalBusiness (rental) is far stronger than Organization for local rank.
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id": `${SITE}/#business`,
    name: NAME,
    url: SITE,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/icon.png`,
    priceRange: "$$",
    // Nationwide delivery across the United States.
    areaServed: { "@type": "Country", name: "United States" },
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.address
      ? {
          address: { "@type": "PostalAddress", streetAddress: contact.address },
        }
      : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

/** Per-state LocalBusiness for the programmatic location landing pages. */
export function localBusinessAreaLd(area: string, url: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    name: `${NAME} — Water Slide Rentals in ${area}`,
    url,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/icon.png`,
    priceRange: "$$",
    areaServed: { "@type": "State", name: area },
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
