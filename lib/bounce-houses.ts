// lib/bounce-houses.ts
// -----------------------------------------------------------------------------
// Content model for the /bounce-house-rentals page family.
//
// WHY A SECOND LOCATION FAMILY EXISTS
// The company already rents bounce houses and bounce-and-slide combos (15 units
// in the catalog), but every landing page on the site talked only about water
// slides. "Bounce house rental <city>" is a separate search — different season
// (it sells all year, not just summer), different buyer (younger kids, indoor
// venues, dry events), and materially less competition on the long tail than
// the water-slide terms. The inventory to serve it already existed; the pages
// to be found for it did not.
//
// WHY IT ISN'T DUPLICATE CONTENT
// Two page families over the same 51 states and the same metros is only safe if
// each one is genuinely about something different. Every element below is
// deliberately bounce-house-specific and shares no sentences with
// lib/city-content.ts (the water-slide equivalent):
//   • different catalog        — server/data/rentals.ts#getBounceHouseRentals
//   • different questions      — dry vs wet, socks, indoor setup, ages, blowers
//   • different seasonality    — year-round and indoor, not "summer weekends"
//   • different copy rotation  — four intros × four hero lines, seeded by slug
// Where the two families overlap in reality (a combo unit is both), the pages
// link to each other rather than repeat each other.
//
// All rotation is deterministic (hash of the slug), never random: the same city
// renders identical copy on every build, so pages stay cacheable and there is
// no hydration mismatch.
// -----------------------------------------------------------------------------

import type { StateLocation } from "@/lib/locations";

export type BounceFaq = { q: string; a: string };

const R2 = "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev";

/**
 * Hero images. Real, already-uploaded R2 product photography of bounce houses
 * and combo units — never a water-slide photo, which would undercut the whole
 * point of a separate page.
 */
const HERO_POOL = [
  `${R2}/products/1782943365076-rowj6k-inflatable-bounce-house-rental-c-202607012225.jpeg`,
  `${R2}/products/1783340836997-6q9pmj-circus-big-top-bounce-castle-202607061305.jpeg`,
  `${R2}/products/1783340822616-o6zdro-candy-castle-bounce-house-lawn-202607061257.jpeg`,
  `${R2}/products/1783340785084-1w4l4f-emerald-green-jungle-combo-with-vines-202607061253.jpeg`,
  `${R2}/products/1783340844828-tnu4q6-farm-barnyard-bounce-house-202607061308.jpeg`,
  `${R2}/products/1782943354960-claio7-inflatable-bounce-and-slide-202607012229.jpeg`,
];

/** Stable djb2-style hash → deterministic rotation per slug. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/**
 * Deterministic pick. `Math.abs` is load-bearing: `hashStr` returns an UNSIGNED
 * 32-bit value, so any hash at or above 2^31 turns negative the moment it meets
 * a signed operator — and `arr[-2]` is `undefined`, which then throws
 * "f(...) is not a function" when the caller invokes the result. That failed
 * the production build on roughly half of all cities.
 */
const pick = <T>(arr: readonly T[], seed: number): T =>
  arr[Math.abs(Math.trunc(seed)) % arr.length]!;

// ── Opening paragraphs ───────────────────────────────────────────────────────
const INTROS: readonly ((place: string, wider: string) => string)[] = [
  (place, wider) =>
    `Booking a bounce house in ${place}? Big Wave Slides delivers commercial-grade bouncers and bounce-and-slide combos across ${wider}, anchors them properly, and collects them when the party winds down. Because they run dry, they work indoors and out — a church hall in February books as easily as a back garden in July.`,
  (place, wider) =>
    `A bounce house is the one rental that keeps toddlers and ten-year-olds equally busy, which is what makes it such a dependable pick for ${place} parties. Every castle, combo and themed bouncer travels across ${wider} cleaned, anchored by a trained crew, and fully insured — you supply the space and an outlet, we handle the rest.`,
  (place, wider) =>
    `From first birthdays to school field days, Big Wave Slides sets up inflatable bounce houses right across ${place} and the wider ${wider} area. Pick a themed castle for the little ones or a combo unit that pairs bouncing with a slide, and we'll deliver, install and pick up — no pumps to haul and nothing to clean afterwards.`,
  (place, wider) =>
    `Bounce house rentals in ${place} are our year-round staple: no hose, no swimsuits, and no waiting for warm weather. We bring the unit anywhere in ${wider}, stake or sandbag it to the ground, walk you through the safety rules, and return to pack it away — so the only thing you plan is the cake.`,
];

const HERO_DESCRIPTIONS: readonly ((place: string) => string)[] = [
  (place) =>
    `Commercial bounce houses and bounce-and-slide combos delivered, set up and collected across ${place} — indoors or out, all year round.`,
  (place) =>
    `Themed castles, toddler bouncers and combo units for ${place} birthdays, school days, church halls and community events. Delivered, anchored and insured.`,
  (place) =>
    `The easiest party win in ${place}: we drop the bounce house off, set it up safely, and pick it up afterwards. You just open the door.`,
  (place) =>
    `Dry-play inflatables for every age in ${place} — sanitized before delivery, professionally anchored, and fully insured from drop-off to pickup.`,
];

/** Seasonality copy per region — the dry-play counterpart to the slide pages. */
const REGION_SEASONAL: Record<StateLocation["region"], (p: string) => string> =
  {
    Northeast: (p) =>
      `Because bounce houses run dry, ${p} isn't limited to the short Northeast summer. From roughly May to September most bookings go up outdoors; the rest of the year they move into gyms, parish halls and rec centers, where a standard ceiling of 16 ft or more clears almost every unit we carry. Indoor dates are also the easiest to lock in at short notice.`,
    Midwest: (p) =>
      `The Midwest party calendar splits cleanly in two, and bounce houses cover both halves. Outdoor season in ${p} runs late spring through early fall, while winter birthdays move indoors to church halls, school gyms and community centers — one of the reasons dry-play units book steadily here in months when nobody is renting a water slide.`,
    South: (p) =>
      `${p} gets a long outdoor season, but it also gets the heat. A dry bounce house in a shaded yard, a covered pavilion or an air-conditioned hall is often the more comfortable call in July and August, and combo units give you the middle ground: bouncing indoors now, the slide attachment added when you want it wet.`,
    West: (p) =>
      `Across the West the constraint is usually surface and wind rather than temperature. We anchor to grass with stakes wherever possible and switch to weighted sandbags on concrete, patios and gym floors, so a bounce house works on a ${p} yard, a hardscaped courtyard or an indoor court. Dry units go up year-round in the milder parts of the region.`,
  };

/**
 * Bounce-house-specific questions. Deliberately the ones renters actually ask
 * about dry units — none of these appear on the water-slide pages, and each
 * answer is self-contained and ~40–60 words so answer engines can lift it whole.
 */
const CORE_FAQS: readonly ((place: string) => BounceFaq)[] = [
  (place) => ({
    q: `How much does it cost to rent a bounce house in ${place}?`,
    a: `Bounce house rentals in ${place} start at $159 per day, with most themed castles running about $229–$285 and bounce-and-slide combos about $269–$550. Delivery, professional setup and anchoring, sanitizing and pickup are included in every price. Your exact rate is confirmed in a free quote.`,
  }),
  (place) => ({
    q: `Can a bounce house be set up indoors in ${place}?`,
    a: `Yes. Bounce houses run dry, so they go up in gyms, church halls and community centers across ${place}. We need about 16 ft of ceiling clearance for a standard castle, a doorway the deflated unit can pass through, and a power outlet. Indoors we anchor with weighted sandbags instead of stakes.`,
  }),
  (place) => ({
    q: `What ages is a bounce house best for?`,
    a: `Most bounce houses suit ages 3 to 12, and we carry toddler-scale units for ages 2 to 6. Group riders by size rather than mixing them, with a typical limit of 6 to 8 children at once and roughly 150 lb per rider. Every ${place} delivery includes a safety walkthrough covering the rules.`,
  }),
  (place) => ({
    q: `What surface and space do I need in ${place}?`,
    a: `Allow the unit's footprint plus about 5 ft of clear space on all sides and 16 ft overhead. Level grass is ideal because we can stake into it, but concrete, asphalt, turf and indoor floors all work — we switch to weighted sandbags. We can't set up on gravel, sand or a slope.`,
  }),
  (place) => ({
    q: `Do bounce houses need electricity?`,
    a: `Yes. The blower runs continuously and needs a standard grounded 110–120V outlet within about 50 ft of the setup spot, ideally on its own circuit. If there's no outlet in range — a ${place} park or open field, for example — we can supply a generator; just flag it when you request your quote.`,
  }),
  (place) => ({
    q: `Are your bounce houses cleaned and insured?`,
    a: `Every unit is cleaned and sanitized before it leaves for your event, and Big Wave Slides carries full commercial liability insurance. If your ${place} venue, school or park district needs a certificate of insurance naming them as additional insured, tell us when you book and we'll send it ahead of the date.`,
  }),
  () => ({
    q: `What's the difference between a bounce house and a combo unit?`,
    a: `A bounce house is a single dry jumping chamber. A combo unit adds a slide, and often a basketball hoop or obstacle, to the same footprint — and most of ours can run wet or dry. Combos cost more but hold a wider age range's attention for longer, which is why they're the usual pick for mixed-age parties.`,
  }),
  () => ({
    q: `Can you set up a bounce house in the rain?`,
    a: `Light drizzle is workable, but we don't operate dry units in steady rain, thunderstorms, or sustained winds above 15–20 mph — wet vinyl gets slippery and wind is the real hazard with inflatables. If the forecast turns, we'll reschedule your date or refund the booking rather than set up in unsafe conditions.`,
  }),
];

export type BounceContent = {
  hero: string;
  heroDescription: string;
  intro: string;
  seasonal: string;
  faqs: BounceFaq[];
};

/**
 * Build the page content for a bounce-house location page.
 *
 * @param slug   Unique key for the page (e.g. "texas" or "texas/houston") —
 *               drives the deterministic copy rotation.
 * @param place  What the copy calls the location ("Houston" / "Texas").
 * @param wider  The surrounding area ("Texas" for a city, the region for a state).
 * @param region Used to pick the seasonality paragraph.
 */
export function getBounceContent(
  slug: string,
  place: string,
  wider: string,
  region: StateLocation["region"],
): BounceContent {
  const seed = hashStr(slug);
  return {
    hero: pick(HERO_POOL, seed),
    // `>>>`, never `>>` — the unsigned shift keeps the hash in 0..2^32-1. The
    // signed variant flips large hashes negative (see `pick`).
    heroDescription: pick(HERO_DESCRIPTIONS, seed >>> 2)(place),
    intro: pick(INTROS, seed >>> 3)(place, wider),
    seasonal: REGION_SEASONAL[region](place),
    // Rotate which question leads, so the 100+ pages don't all open on the same
    // accordion item, while every page still carries the full set.
    faqs: CORE_FAQS.map((_, i) =>
      CORE_FAQS[(i + (seed % CORE_FAQS.length)) % CORE_FAQS.length]!(place),
    ),
  };
}

/** Long-tail keyword set for a bounce-house location page. */
export function bounceKeywords(place: string, abbr?: string): string[] {
  const withAbbr = abbr ? `${place} ${abbr}` : place;
  return [
    `bounce house rentals ${withAbbr}`,
    `bounce house rental ${place}`,
    `inflatable bounce house rental ${place}`,
    `bouncy castle rental ${place}`,
    `moon bounce rental ${place}`,
    `jumper rental ${place}`,
    `bounce house and slide combo rental ${place}`,
    `toddler bounce house rental ${place}`,
    `birthday party bounce house rental ${place}`,
    `church bounce house rental ${place}`,
    `indoor bounce house rental ${place}`,
    `bounce house rentals near me`,
  ];
}

/** Trust points shown on every bounce-house location page. */
export const BOUNCE_TRUST = [
  "Fully insured",
  "Sanitized before delivery",
  "Delivery, setup & pickup included",
  "Indoor or outdoor",
] as const;
