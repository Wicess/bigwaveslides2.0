// lib/business-facts.ts
// The one source of business FACTS for machine-readable surfaces: /llms.txt,
// /pricing.md, and the answer-first Q&As on the shop and use-case pages.
//
// WHY THIS FILE EXISTS
// public/llms.txt and public/pricing.md were hand-written on 2026-08-15 and
// drifted from the business within weeks: "no online checkout" after the owner
// retired that wording, while /answers still quoted a $49 base + $2.50/mile +
// $29 pickup delivery fee that the checkout stopped charging long ago (it adds
// one flat transportation line). Generated copy is written once from facts that
// later change, and nothing re-reads it. So every number here is DERIVED — from
// the live catalog (server/data/catalog-facts.ts) or from the constants the
// checkout itself computes with — never typed in by hand.
//
// Rule: if a fact cannot be traced to the database, a pricing/terms constant
// or lib/brand.ts, it does not go in. No ratings (the Review table is empty),
// no years in business, no event counts, no certifications.
//
// Plain module, no server-only: the shop page FAQ builders import it too.

import { BRAND_DESCRIPTION, BRAND_EMAIL, BRAND_NAME } from "@/lib/brand";
import { CANONICAL_ORIGIN } from "@/lib/site";
import {
  BALANCE_DUE_HOURS,
  DEPOSIT_RATE,
  REFUND_NOTICE_DAYS,
  TRANSPORT_CENTS,
} from "@/lib/pricing";
import { METHOD_DISCOUNT_RATES } from "@/lib/payment-plan";
import { LOYALTY_SUBSCRIBE_RATE } from "@/lib/loyalty";
import { formatPrice } from "@/lib/format";

export const FACTS = {
  name: BRAND_NAME,
  url: CANONICAL_ORIGIN,
  email: BRAND_EMAIL,
  description: BRAND_DESCRIPTION,
  /** lib/brand.ts + robots/schema: US-only trading. */
  serviceArea: "the United States",
  /** The other business built from the same codebase (see lib/site.ts). */
  notAffiliatedWith: "bigwaveslides.com (Big Wave Slides)",
  /** Flat checkout line (lib/pricing.ts), unless the owner toggles it off. */
  transportCents: TRANSPORT_CENTS,
  /** lib/pricing.ts — payment schedule + deposit/refund rule (legal terms). */
  depositRate: DEPOSIT_RATE,
  refundNoticeDays: REFUND_NOTICE_DAYS,
  balanceDueHours: BALANCE_DUE_HOURS,
  subscriberDiscountRate: LOYALTY_SUBSCRIBE_RATE,
  methodDiscountRates: METHOD_DISCOUNT_RATES,
  /** Rental terms, "What's included" (lib/legal-terms.ts). Insurance is
      left out of the machine-readable files on purpose: nothing on file
      (policy, carrier, limits) lets a reader verify the claim. */
  included: [
    "professional setup with anchoring",
    "a commercial blower",
    "sanitizing before delivery",
    "pickup",
  ],
  /** Rental terms: one rental day is one complete 24-hour period. */
  rentalDayHours: 24,
  /** Rental terms, "Site & safety". */
  maxSustainedWindMph: 20,
  powerOutletWithinFt: 50,
} as const;

/** Category slugs → plural label used in facts output. */
export const CATEGORY_LABELS: Record<string, string> = {
  "tall-slides": "Tall water slides",
  "racing-slides": "Racing (dual-lane) water slides",
  "backyard-slides": "Backyard water slides",
  "combo-units": "Combo units (bounce house + slide)",
  "bounce-houses": "Bounce houses",
  "toddler-slides": "Toddler slides",
  "party-attractions": "Party attractions",
};

/** One ACTIVE product, as read by server/data/catalog-facts.ts. */
export type CatalogProduct = {
  slug: string;
  name: string;
  category: string | null;
  dailyRateCents: number | null;
  salePriceCents: number | null;
  capacity: number | null;
  ageRange: string | null;
  power: string | null;
  space: string | null;
};

export type PriceRange = { min: number; max: number; count: number };

function range(values: (number | null)[]): PriceRange | null {
  const v = values.filter((x): x is number => x != null && x > 0);
  if (!v.length) return null;
  return { min: Math.min(...v), max: Math.max(...v), count: v.length };
}

export type CatalogSummary = {
  total: number;
  rentable: number;
  forSale: number;
  daily: PriceRange | null;
  sale: PriceRange | null;
  byCategory: {
    slug: string;
    label: string;
    count: number;
    daily: PriceRange | null;
    sale: PriceRange | null;
  }[];
};

export function summarizeCatalog(products: CatalogProduct[]): CatalogSummary {
  const groups = new Map<string, CatalogProduct[]>();
  for (const p of products) {
    const k = p.category ?? "other";
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  const byCategory = [...groups.entries()]
    .map(([slug, list]) => ({
      slug,
      label: CATEGORY_LABELS[slug] ?? slug,
      count: list.length,
      daily: range(list.map((p) => p.dailyRateCents)),
      sale: range(list.map((p) => p.salePriceCents)),
    }))
    .sort((a, b) => (a.daily?.min ?? 0) - (b.daily?.min ?? 0));
  return {
    total: products.length,
    rentable: products.filter((p) => (p.dailyRateCents ?? 0) > 0).length,
    forSale: products.filter((p) => (p.salePriceCents ?? 0) > 0).length,
    daily: range(products.map((p) => p.dailyRateCents)),
    sale: range(products.map((p) => p.salePriceCents)),
    byCategory,
  };
}

export const usd = (cents: number) => formatPrice(cents);
export const pct = (rate: number) => `${Number((rate * 100).toFixed(1))}%`;

export function rangeText(r: PriceRange | null): string {
  if (!r) return "";
  return r.min === r.max ? usd(r.min) : `${usd(r.min)} to ${usd(r.max)}`;
}

/** Instant-pay discounts as "Bitcoin 7.5%, Chime 3%" for the enabled rails. */
export function methodDiscountText(
  methods: { method: string; label: string }[],
): string {
  return methods
    .filter((m) => FACTS.methodDiscountRates[m.method])
    .map((m) => `${m.label} ${pct(FACTS.methodDiscountRates[m.method]!)}`)
    .join(", ");
}

/**
 * The payment-schedule sentence, from the same constants the invoice and the
 * rental terms use.
 */
export function paymentScheduleText(): string {
  return (
    `Bookings are made online and confirmed by the team before any payment. ` +
    `The customer then chooses to pay 50% to secure the date (the other 50% is due ` +
    `${FACTS.balanceDueHours} hours before the event) or to pay in full. ` +
    `${pct(FACTS.depositRate)} of the total acts as a refundable deposit, refunded in full ` +
    `when a booking is cancelled at least ${FACTS.refundNoticeDays} days before the event.`
  );
}

/**
 * "How much does it cost to rent a water slide for a <event>?" — answered from
 * the live catalog summary. Calendar-bound (fall) events lead with the units
 * usually run dry; warm-weather events lead with the water slides.
 */
export function rentalCostFaq(
  phrase: string,
  s: CatalogSummary,
  opts: { dryFirst?: boolean; transportCents?: number } = {},
): { q: string; a: string } | null {
  if (!s.daily) return null;
  const order = opts.dryFirst
    ? ["bounce-houses", "combo-units", "backyard-slides", "tall-slides"]
    : ["backyard-slides", "tall-slides", "combo-units", "bounce-houses"];
  const parts = order
    .map((slug) => s.byCategory.find((c) => c.slug === slug))
    .filter((c): c is CatalogSummary["byCategory"][number] => !!c?.daily)
    .map((c) => `${c.label.toLowerCase()} ${rangeText(c.daily)}`);
  const fee = opts.transportCents
    ? ` The only added charge is a flat ${usd(opts.transportCents)} transportation fee per order.`
    : "";
  return {
    q: `How much does it cost to rent a water slide for a ${phrase}?`,
    a: `${FACTS.name} rents ${s.rentable} units at ${rangeText(s.daily)} per day: ${parts.join(", ")}. Setup with anchoring, sanitizing and pickup are included.${fee}`,
  };
}
