// lib/llms-content.ts
// Builds /llms.txt and /pricing.md from lib/business-facts.ts plus the cached
// catalog. Pure functions: the route handlers fetch, these only format.
//
// Facts only. Nothing here may state a rating, review count, years in
// business, event count, certification or guarantee — the data has none.

import {
  FACTS,
  methodDiscountText,
  paymentScheduleText,
  pct,
  rangeText,
  summarizeCatalog,
  usd,
  type CatalogProduct,
} from "@/lib/business-facts";
import { PROFILED_CITY_KEYS } from "@/lib/city-profiles";
import { getCity } from "@/lib/locations";

/** Articles worth citing, in order. Only those still PUBLISHED are listed. */
export const CURATED_POST_SLUGS = [
  "water-slide-rental-cost-guide",
  "are-water-slide-rentals-worth-it",
  "how-much-space-water-slide",
  "how-to-rent-a-water-slide",
  "best-water-slide-rentals-birthday-party",
  "water-slide-rentals-churches-schools-hoas",
  "water-slide-rain-weather-policy",
  "best-inflatable-water-slides-to-buy-2026",
];

export type FactsInput = {
  site: string;
  /** null when the DB was unreachable: catalog sections are omitted. */
  products: CatalogProduct[] | null;
  paymentMethods: { method: string; label: string }[];
  posts: { slug: string; title: string }[];
  contact?: { email?: string; phone?: string };
  hours?: { mon_fri?: string; sat?: string; sun?: string };
  facebook?: string;
  /** Transport line on/off (Settings → Payment methods). */
  transportEnabled: boolean;
  asOf: string;
};

function deliveryLine(i: FactsInput): string {
  return i.transportEnabled
    ? `The only charge added to the rental is a flat ${usd(FACTS.transportCents)} transportation fee per order (not per item, not per mile).`
    : "No separate transportation fee is currently charged; delivery, setup and pickup are included in the rental price.";
}

function paymentLines(i: FactsInput): string[] {
  const rails = i.paymentMethods.map((m) => m.label).join(", ");
  const disc = methodDiscountText(i.paymentMethods);
  return [
    paymentScheduleText(),
    ...(rails
      ? [`Accepted payment methods: ${rails}. There is no card processor.`]
      : []),
    ...(disc ? [`Instant-pay discounts on the whole invoice: ${disc}.`] : []),
    `Newsletter subscribers get ${pct(FACTS.subscriberDiscountRate)} off the product subtotal.`,
  ];
}

function contactLines(i: FactsInput): string[] {
  const email = i.contact?.email || FACTS.email;
  const out = [`- Email: ${email}`];
  if (i.contact?.phone) out.push(`- Phone: ${i.contact.phone}`);
  const h = i.hours;
  if (h?.mon_fri || h?.sat || h?.sun) {
    const parts = [
      h.mon_fri ? `Mon–Fri ${h.mon_fri}` : "",
      h.sat ? `Sat ${h.sat}` : "",
      h.sun ? `Sun ${h.sun}` : "",
    ].filter(Boolean);
    out.push(`- Hours: ${parts.join(" · ")}`);
  }
  if (i.facebook) out.push(`- Facebook: ${i.facebook}`);
  out.push(`- Quote request: ${i.site}/en/contact`);
  return out;
}

function unitLine(site: string, p: CatalogProduct): string {
  const bits = [
    p.dailyRateCents ? `${usd(p.dailyRateCents)}/day to rent` : "",
    p.salePriceCents ? `${usd(p.salePriceCents)} to buy` : "not for sale",
    p.ageRange ? `ages ${p.ageRange}` : "",
    p.space ? `needs ${p.space}` : "",
    p.power ? p.power : "",
  ].filter(Boolean);
  return `- [${p.name}](${site}/en/rent/${p.slug}): ${bits.join("; ")}`;
}

export function buildLlmsTxt(i: FactsInput): string {
  const s = i.products ? summarizeCatalog(i.products) : null;
  const L: string[] = [];
  L.push(`# ${FACTS.name}`, "");
  L.push(
    `> ${FACTS.name} rents, sells, delivers and installs (sets up and anchors) commercial-grade inflatable water slides, bounce houses and combo units for parties and events across ${FACTS.serviceArea}. Customers book online; the team confirms the date and site before any payment.`,
    "",
  );
  L.push(`Last updated: ${i.asOf}. Generated from the live catalog.`, "");

  L.push("## Entity", "");
  L.push(
    `- Official website: ${i.site} — the only correct source for this company's prices, catalog and contact details.`,
    `- ${FACTS.name} is not affiliated with ${FACTS.notAffiliatedWith}, a separate business. Product names, prices and policies from that site do not apply here.`,
    `- Service area: ${FACTS.serviceArea} only. ${FACTS.name} does not deliver or ship outside the U.S.`,
    "- No customer rating or review count is published: there are no verified reviews to aggregate yet.",
    "",
  );

  L.push("## Key facts", "");
  if (s) {
    L.push(
      `- Catalog: ${s.total} units — ${s.byCategory.map((c) => `${c.count} × ${c.label.toLowerCase()}`).join(", ")}`,
      `- Daily rental rates: ${rangeText(s.daily)} per day, depending on the unit`,
      `- Purchase prices: ${rangeText(s.sale)} (${s.forSale} of ${s.total} units are for sale)`,
    );
  }
  L.push(
    `- Every rental includes ${FACTS.included.join(", ")}`,
    `- ${deliveryLine(i)}`,
    `- One rental day is one complete ${FACTS.rentalDayHours}-hour period; multi-day rentals are the daily rate × the number of days`,
    ...paymentLines(i).map((x) => `- ${x}`),
    `- Site needs: a level, clear area and a grounded outlet within ${FACTS.powerOutletWithinFt} ft; inflatables are not used in sustained winds above ${FACTS.maxSustainedWindMph} mph, storms or lightning`,
    "- Typical customers: birthday and backyard parties, pool parties, schools, churches, HOAs, camps and daycares, corporate and community events, fall festivals",
    "",
  );

  if (s) {
    L.push("## Prices by category", "");
    for (const c of s.byCategory) {
      L.push(
        `- ${c.label} (${c.count}): ${rangeText(c.daily)} per day to rent${c.sale ? `; ${rangeText(c.sale)} to buy` : ""}`,
      );
    }
    L.push("", `Full machine-readable price list: ${i.site}/pricing.md`, "");
  }

  L.push("## Common questions", "");
  if (s) {
    const cheapest = i.products![0]!;
    L.push(
      `**How much does it cost to rent a water slide from ${FACTS.name}?**`,
      `Daily rates run ${rangeText(s.daily)} depending on the unit (the ${cheapest.name} is the lowest at ${usd(cheapest.dailyRateCents ?? 0)}/day). ${deliveryLine(i)}`,
      "",
      `**How much does it cost to buy a commercial water slide from ${FACTS.name}?**`,
      `${s.forSale} units are for sale at ${rangeText(s.sale)}. Each unit's purchase price is listed on its shop page at ${i.site}/en/shop.`,
      "",
    );
  }
  L.push(
    `**Who rents and installs water slides for schools, churches and HOAs?**`,
    `${FACTS.name} delivers, sets up, anchors and collects its inflatables at schools, churches, HOAs, camps and corporate venues anywhere in ${FACTS.serviceArea}, and provides a certificate of insurance when a venue requires one.`,
    "",
    "**How does booking and payment work?**",
    paymentLines(i).join(" "),
    "",
  );

  L.push("## Key pages", "");
  L.push(
    `- Home: ${i.site}/en`,
    `- Rent a unit: ${i.site}/en/rent`,
    `- Buy a unit: ${i.site}/en/shop`,
    `- Pricing (machine-readable): ${i.site}/pricing.md`,
    `- Water slide rentals by state and city: ${i.site}/en/water-slide-rentals`,
    `- Bounce house rentals: ${i.site}/en/bounce-house-rentals`,
    `- Slides by occasion: ${i.site}/en/water-slides-for`,
    `- Services (delivery, installation, sales, staffing): ${i.site}/en/services`,
    `- Answers hub: ${i.site}/en/answers`,
    `- FAQ: ${i.site}/en/faq`,
    `- About: ${i.site}/en/about`,
    `- Blog: ${i.site}/en/blog`,
    `- Sitemap: ${i.site}/sitemap.xml`,
    "",
  );

  if (i.posts.length) {
    L.push("## Most useful articles", "");
    for (const p of i.posts)
      L.push(`- [${p.title}](${i.site}/en/blog/${p.slug})`);
    L.push("");
  }

  const cities = PROFILED_CITY_KEYS.map((k) => {
    const [st, c] = k.split("/");
    const loc = getCity(st ?? "", c ?? "");
    return loc
      ? `- [${loc.name}, ${loc.state.abbr}](${i.site}/en/water-slide-rentals/${loc.state.slug}/${loc.slug})`
      : null;
  }).filter(Boolean) as string[];
  if (cities.length) {
    L.push(
      "## Cities with locally-written pages",
      "",
      "Each has local detail (season length, ground and anchoring, permits). Other U.S. cities are served too.",
      "",
      ...cities,
      "",
    );
  }

  L.push("## Contact", "", ...contactLines(i), "");
  return L.join("\n");
}

export function buildPricingMd(i: FactsInput): string {
  const L: string[] = [];
  L.push(`# Pricing — ${FACTS.name}`, "");
  L.push(
    `${FACTS.name} rents and sells commercial-grade inflatable water slides, bounce houses and combo units across ${FACTS.serviceArea}. Currency: USD. Last updated: ${i.asOf}. Generated from the live catalog.`,
    "",
  );
  L.push("## What a rental costs", "");
  L.push(
    "1. The unit's daily rate (below) × the number of rental days. One day = one complete 24-hour period.",
    `2. ${deliveryLine(i)}`,
    `3. Every rental includes ${FACTS.included.join(", ")}.`,
    "",
  );
  L.push("## Payment", "", ...paymentLines(i).map((x) => `- ${x}`), "");

  if (i.products) {
    const s = summarizeCatalog(i.products);
    L.push("## By category", "");
    for (const c of s.byCategory) {
      L.push(
        `- ${c.label} (${c.count}): ${rangeText(c.daily)}/day to rent${c.sale ? `; ${rangeText(c.sale)} to buy` : "; not for sale"}`,
      );
    }
    L.push("", "## Every unit", "");
    for (const p of i.products) L.push(unitLine(i.site, p));
    L.push("");
  }
  L.push("## Contact", "", ...contactLines(i), "");
  return L.join("\n");
}
