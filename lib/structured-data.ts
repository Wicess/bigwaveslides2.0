import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const NAME = "Splash Republic";
// Real business facts (match lib/email.ts + site settings) — shown in rich
// results, so keep them in lockstep with the NAP used everywhere else. The
// phone deliberately has no constant here: it comes from Settings → Contact so
// schema never advertises a number the site itself doesn't show.
const EMAIL = "contact@bigwavesslides.com";
// Spans the WHOLE rentable catalog, not just the water slides: the cheapest
// unit is the Lil' Splash Junior at $149/day and the dearest the Mega Waterpark
// Combo at $550. The bounce-house pages advertise "From $159/day", so a range
// starting at $199 would have contradicted the visible price on those pages —
// and markup that disagrees with the page is what a rich-results spam check
// looks for. Keep this in step with the real daily rates in the database.
const PRICE_RANGE = "$149 - $550";

type Json = Record<string, unknown>;

/** Opening hours as stored in Settings → Hours ("8:00–18:00", en-dash). */
export type BusinessHours = {
  mon_fri?: string;
  sat?: string;
  sun?: string;
};

const HOUR_DAYS: Record<keyof BusinessHours, string[]> = {
  mon_fri: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  sat: ["Saturday"],
  sun: ["Sunday"],
};

/**
 * Turn the admin's free-text hours into `OpeningHoursSpecification`. Google
 * wants 24-hour `HH:MM`, so a range that doesn't parse is skipped rather than
 * emitted malformed — bad structured data is worse than none.
 */
function openingHours(hours: BusinessHours): Json[] {
  const out: Json[] = [];
  for (const [key, days] of Object.entries(HOUR_DAYS) as [
    keyof BusinessHours,
    string[],
  ][]) {
    const raw = hours[key]?.trim();
    if (!raw) continue;
    // Accept "8:00–18:00", "8:00-18:00" and "08:00 — 18:00".
    const m = raw.match(/^(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})$/);
    if (!m) continue;
    const pad = (t: string) => (t.length === 4 ? `0${t}` : t);
    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens: pad(m[1]!),
      closes: pad(m[2]!),
    });
  }
  return out;
}

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
  /** Real review aggregate → `aggregateRating` (star ratings in rich results). */
  rating?: { value: number; count: number },
  /** Settings → Hours, emitted as OpeningHoursSpecification when parseable. */
  hours?: BusinessHours,
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
    // ── United-States-only trading signals ────────────────────────────────
    // Google retired Search Console's International Targeting tool in 2022, so
    // on a .com there is no switch that says "this business is American". These
    // properties are the replacement: taken together (US-only service area, USD
    // pricing, US English, a US postal address and phone) they let Google infer
    // the country far more confidently than hreflang can on its own.
    areaServed: { "@type": "Country", name: "United States" },
    currenciesAccepted: "USD",
    knowsLanguage: "en-US",
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(address ? { address } : {}),
    ...(links.length ? { sameAs: links } : {}),
    // A ContactPoint that is itself scoped to the US and to American English.
    ...(contact?.phone || contact?.email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            areaServed: "US",
            availableLanguage: ["en-US"],
            ...(contact.phone ? { telephone: contact.phone } : {}),
            ...(contact.email ? { email: contact.email } : {}),
          },
        }
      : {}),
    ...(hours ? { openingHoursSpecification: openingHours(hours) } : {}),
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(rating.value.toFixed(1)),
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
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
  /** The STATE this page serves — emitted as `areaServed: {"@type":"State"}`. */
  area: string,
  url: string,
  anchor?: { city: string; region: string },
  contact?: { phone?: string },
  /**
   * What this location page is about, woven into the business name. Defaults to
   * water slides (the original page family); the bounce-house pages pass their
   * own so the schema doesn't advertise "Water Slide Rentals in Texas" on a page
   * about bounce houses — a mismatch between markup and visible content is
   * exactly what a structured-data spam check looks for.
   */
  service = "Water Slide Rentals",
  /**
   * What the business NAME says it serves. Defaults to `area` (correct for a
   * state hub). A city page passes "Houston, TX" so the name stays local while
   * `areaServed` still types Houston as a City inside the State of Texas —
   * previously a city page emitted `{"@type":"State","name":"Houston, TX"}`,
   * which labels a city as a state.
   */
  nameArea?: string,
): Json {
  const areaServed: Json[] = [];
  if (anchor) {
    areaServed.push({
      "@type": "City",
      name: `${anchor.city}, ${anchor.region}`,
    });
  }
  areaServed.push({ "@type": "State", name: area });
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    name: `${NAME} — ${service} in ${nameArea ?? area}`,
    url,
    logo: `${SITE}/icon.png`,
    image: `${SITE}/icon.png`,
    priceRange: PRICE_RANGE,
    ...(contact?.phone?.trim() ? { telephone: contact.phone } : {}),
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
