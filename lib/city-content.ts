import type { CityLocation, StateLocation } from "@/lib/locations";

/**
 * Per-city content variation for the 750+ programmatic city rental pages.
 *
 * Every page still answers the same core intent (delivery + price), but the
 * hero image, opening copy, a region/season-specific paragraph, and the FAQ
 * set all rotate deterministically by city. This kills the "750 identical
 * templated pages" signal that Google's scaled-content / helpful-content
 * systems penalise, without any runtime randomness (stable across builds, no
 * hydration mismatch — the same city always renders the same content).
 */

const R2 = "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev";

// Curated pool of real, existing R2 waterpark/slide photos (all landscape,
// used elsewhere in the app — no invented URLs, so no 404s).
const HERO_POOL = [
  `${R2}/services/1782552093459-u6mqiy-event-rentals.jpg`,
  `${R2}/hero/aquaforms.jpg`,
  `${R2}/about/1782501611506-twt9il-aquaforms-1800-island-waterpark-at-showboat-atlantic-city-usa-photo14-1536x1006.jpg`,
  `${R2}/blog/1782484385557-8bhjem-turnstiles-island-h2o-live-kissimmee-usa-1.jpg`,
  `${R2}/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg`,
  `${R2}/services/1782552076322-pu88b6-custom-builds.jpg`,
];

export type CityFaq = { q: string; a: string };

export type CityContent = {
  hero: string;
  heroDescription: string;
  intro: string;
  /** A genuinely region/climate-specific paragraph — unique content per state. */
  seasonal: string;
  faqs: CityFaq[];
};

/** Stable djb2-style string hash → deterministic per city slug. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

const pick = <T>(arr: T[], seed: number): T => arr[seed % arr.length]!;

// ── Opening paragraph variants (city + state woven in) ────────────────────
const INTROS: ((name: string, state: string) => string)[] = [
  (name, state) =>
    `Planning a party in ${name}? Splash Republic brings the waterpark to your ${name} backyard, park, school, or church. We deliver premium, freshly sanitized inflatable water slides across ${state}, set them up safely, and pick them up when the fun's done — so all you do is enjoy the day.`,
  (name, state) =>
    `From backyard birthdays to big community events, Splash Republic is how ${name} keeps cool. Every commercial-grade water slide is delivered anywhere in ${name} — and right across ${state} — professionally installed and anchored, then collected afterward, so there's no hauling, no cleanup, and no stress on your part.`,
  (name, state) =>
    `Give the kids (and the grown-ups) in ${name} a day they'll talk about all summer. We rent giant inflatable water slides across ${state} — sanitized before every booking, delivered and set up by a trained crew, and fully insured — so your only job in ${name} is to hand out the towels.`,
  (name, state) =>
    `Splash Republic turns any ${name} yard, cul-de-sac, or field into a private splash park. Pick your slide, tell us your date, and we handle delivery, setup, and pickup throughout ${name} and the wider ${state} area — freshly cleaned and ready to ride the moment we leave.`,
];

const HERO_DESCRIPTIONS: ((name: string) => string)[] = [
  (name) =>
    `Commercial-grade inflatable water slides delivered, set up, and picked up across ${name}. Perfect for birthdays, backyard bashes, schools, churches, and community events.`,
  (name) =>
    `Delivered, installed, and fully insured throughout ${name} — giant water slides that turn any backyard or park into the best party of the summer.`,
  (name) =>
    `The easiest way to cool off in ${name}: we drop off, set up, and collect the slide — you just bring the swimsuits.`,
];

// ── Region / climate-specific paragraph + FAQ (genuinely unique content) ──
type Region = StateLocation["region"];

const SEASONAL: Record<
  Region,
  {
    paragraph: (name: string, state: string) => string;
    faq: (name: string) => CityFaq;
  }
> = {
  South: {
    paragraph: (name, state) =>
      `${name} summers are long, hot, and humid — which is exactly why water slides are a warm-weather staple here. Across ${state} we stay booked from early spring straight through October, so peak weekends in ${name} (holidays, end-of-school, graduation parties) fill up fast. Lock in your date early and beat the heat.`,
    faq: (name) => ({
      q: `When is water slide season in ${name}?`,
      a: `In ${name} the season runs long — roughly March through October — thanks to the warm Southern climate. Summer weekends and holidays book out first, so we recommend reserving your ${name} slide 2–3 weeks ahead for peak dates.`,
    }),
  },
  West: {
    paragraph: (name, state) =>
      `With ${name}'s sunny, dry-heat summers, an inflatable water slide is one of the best ways to cool the whole crew down. We deliver throughout ${state}, and because Western summers run warm and long, ${name} bookings stretch from spring pool parties to late-season backyard bashes. Shaded setup spots keep the water refreshing all afternoon.`,
    faq: (name) => ({
      q: `Do water slides hold up in ${name}'s summer heat?`,
      a: `Absolutely — that's what they're built for. In ${name}'s dry heat the slide's constant water flow keeps everyone cool. We'll help you pick a setup spot with some afternoon shade so the surface stays comfortable for bare feet.`,
    }),
  },
  Northeast: {
    paragraph: (name, state) =>
      `The ${name} summer is glorious but short, so the prime water-slide window — roughly late May through early September — packs in a lot of parties. Across ${state}, ${name}'s peak weekends (Memorial Day, the Fourth, end-of-school) are our busiest, so booking early is the difference between getting your date and missing it.`,
    faq: (name) => ({
      q: `How early should I book a water slide in ${name}?`,
      a: `Because the ${name} summer season is compact (late May to early September), popular weekends go quickly. Aim to reserve 3–4 weeks ahead for holidays and school's-out dates, though we'll always try to fit in last-minute ${name} requests.`,
    }),
  },
  Midwest: {
    paragraph: (name, state) =>
      `${name} makes the most of its warm months, and nothing anchors a summer weekend like a backyard water slide. We cover ${state} from June through September, with ${name}'s graduation parties, Fourth of July cookouts, and county-fair season keeping the calendar full. Reserve ahead and your slide will be set up and ready before the first guest arrives.`,
    faq: (name) => ({
      q: `What's the best time of year for a water slide rental in ${name}?`,
      a: `${name}'s water-slide season runs June through September, peaking around graduations, the Fourth of July, and late-summer block parties. Those weekends book first, so reserve your ${name} rental a few weeks out to secure the date.`,
    }),
  },
};

// ── Rotating FAQ bank (core two always shown; two more picked per city) ───
function coreFaqs(name: string, stateName: string, place: string): CityFaq[] {
  return [
    {
      q: `Do you deliver water slides in ${name}?`,
      a: `Yes — Splash Republic delivers, sets up, and picks up water slides throughout ${name} and the surrounding ${stateName} area. Share your venue and date and we'll confirm delivery in your free quote.`,
    },
    {
      q: `How much does a water slide rental cost in ${name}?`,
      a: `Pricing in ${name} depends on the slide size and how long you rent it. Most backyard rentals start around $295/day with delivery, setup, and insurance included. Request a free, no-obligation quote for exact ${place} pricing.`,
    },
  ];
}

function faqBank(name: string): CityFaq[] {
  return [
    {
      q: `What do you need to set up a water slide in ${name}?`,
      a: `Just a reasonably flat area (grass is ideal), access to a standard water spigot, and a power outlet within about 100 ft — or we can bring a generator. Our ${name} crew handles the rest, including anchoring and a safety check before you use it.`,
    },
    {
      q: `How does booking a ${name} water slide rental work?`,
      a: `Tell us your date, venue, and the slide you want, and we'll send a free quote. Once you approve it, we lock in your ${name} delivery window — no online payment required, and our team confirms every detail directly with you.`,
    },
    {
      q: `What events do you cover in ${name}?`,
      a: `Everything — backyard and birthday parties, church and school events, corporate and community days, family reunions, summer camps, festivals and more. If you're hosting it in ${name}, we can make it a splash.`,
    },
    {
      q: `Are your ${name} rentals insured and sanitized?`,
      a: `Every rental is fully insured and cleaned & sanitized before delivery, then installed by a trained crew with proper anchoring — so your ${name} event is safe from start to finish.`,
    },
    {
      q: `Can the water slides be used dry in ${name}?`,
      a: `Many of our slides run wet or dry, so if the ${name} weather turns cool you can still use them without water. Let us know when you book and we'll recommend the best slide for either setup.`,
    },
  ];
}

/**
 * Build the full, deterministically-varied content bundle for one city page.
 */
export function getCityContent(loc: CityLocation): CityContent {
  const { name, state: st } = loc;
  const stateName = st.name;
  const place = `${name}, ${st.abbr}`;
  const h = hashStr(`${st.slug}/${loc.slug}`);

  const season = SEASONAL[st.region];

  // Two rotating FAQs from the bank (kept distinct), plus the region FAQ.
  const bank = faqBank(name);
  const i1 = h % bank.length;
  let i2 = (h >>> 5) % bank.length;
  if (i2 === i1) i2 = (i2 + 1) % bank.length;

  const faqs: CityFaq[] = [
    ...coreFaqs(name, stateName, place),
    bank[i1]!,
    bank[i2]!,
    season.faq(name),
  ];

  return {
    hero: pick(HERO_POOL, h),
    heroDescription: pick(HERO_DESCRIPTIONS, h >>> 7)(name),
    intro: pick(INTROS, h >>> 3)(name, stateName),
    seasonal: season.paragraph(name, stateName),
    faqs,
  };
}
