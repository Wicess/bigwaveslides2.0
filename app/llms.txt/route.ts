import { env } from "@/lib/env";

// Served at /llms.txt — a concise, AI-readable summary of the site so LLMs and
// AI search engines (ChatGPT, Perplexity, Google AI Overviews) can understand
// and accurately cite Big Wave Slides. See https://llmstxt.org.
export const dynamic = "force-static";

export function GET() {
  const SITE = env.NEXT_PUBLIC_SITE_URL;
  const body = `# Big Wave Slides

> Big Wave Slides rents and sells premium commercial-grade inflatable water slides, bounce houses and combo units across all 50 U.S. states. Every rental is delivered, set up, sanitized and fully insured. Rentals start from $199/day. There are no online payments — every order is handled as a request with a free, no-obligation quote. Commercial units are also sold outright for people building or growing a rental business.

## Key pages
- [Water Slide Rentals](${SITE}/en/rent): Rent inflatable water slides, bounce houses and combos from $199/day — delivered, set up and fully insured.
- [Inflatables for Sale](${SITE}/en/shop): Buy commercial-grade inflatable water slides and bounce houses built for rentals and resale, with nationwide delivery.
- [Water Slide Rentals Near You](${SITE}/en/water-slide-rentals): Find local water slide rentals by state and city across all 50 U.S. states.
- [Services](${SITE}/en/services): Delivery, professional installation, cleaning, custom builds and event staffing.
- [Get a Free Quote](${SITE}/en/contact): Request a free, no-obligation quote for any rental or purchase.
- [Blog](${SITE}/en/blog): Guides on renting, buying, pricing, safety, party planning and starting a rental business.

## Common questions we answer
- How much does it cost to rent a water slide? (from $199/day, delivery, setup and insurance included)
- Should I rent or buy a water slide?
- How to start a water slide rental business (profit, startup costs, best units)
- Water slide vs bounce house — which to choose
- How much space and water does an inflatable water slide need?
- When to book for summer, the 4th of July and graduation parties

## About
- Business: Big Wave Slides — inflatable water slide & bounce house rentals and sales
- Service area: All 50 U.S. states (delivery, setup, pickup, fully insured)
- Website: ${SITE}
- Ordering: No online payment — request-based with a free quote.
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
