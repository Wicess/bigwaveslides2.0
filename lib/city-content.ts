import type { CityLocation } from "@/lib/locations";
import { getCityProfile } from "@/lib/city-profiles";
import { getCityLocal } from "@/lib/city-local";

/**
 * Content for the city rental pages.
 *
 * WHAT CHANGED AND WHY
 * This module used to spin: four intro paragraphs, a bank of FAQs, and a hash of
 * the city slug choosing which variant each of 748 cities received. It was built
 * to defeat the "identical templated pages" signal, and it did not — swapping a
 * city name into a fixed sentence is the definition of a doorway page, and
 * because a second site runs this same codebase the generator produced the SAME
 * variants there. 87% of the Houston page matched that site word for word.
 *
 * Content is now built from hand-written per-city facts (lib/city-profiles.ts):
 * how long the wet season actually runs, what the ground does, which venues get
 * booked, who issues permits, when dates go. Two cities cannot produce the same
 * page because the inputs are different prose, not different array indices.
 *
 * Cities without a profile get an honest short page and are noindex — see
 * PRIORITY_CITY_KEYS. They exist to serve a visitor who searches their town, not
 * to be indexed.
 */

const R2 = "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev";

// Real, existing R2 photos used elsewhere in the app — no invented URLs.
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
  seasonal: string;
  faqs: CityFaq[];
  /** Real venues locals book. Empty for unprofiled cities. */
  venues: string[];
  /** Ground/access notes. Empty for unprofiled cities. */
  setup: string;
  /** True when this page has hand-written local content (and is indexable). */
  profiled: boolean;
};

/** Stable hash → deterministic hero image per city. No runtime randomness. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function getCityContent(loc: CityLocation): CityContent {
  const { name, state: st } = loc;
  const place = `${name}, ${st.abbr}`;
  const hero = HERO_POOL[hashStr(`${st.slug}/${loc.slug}`) % HERO_POOL.length]!;
  const profile = getCityProfile(st.slug, loc.slug);
  const local = getCityLocal(st.slug, loc.slug);
  const areas = local?.areas ?? [];

  // ── Unprofiled city: short, honest, noindex ────────────────────────────────
  // Deliberately NOT padded out to look substantial. A thin page that admits it
  // is thin and points at the state hub is more useful to the one visitor who
  // lands here than 600 words of generated filler, and it is not pretending to
  // be a local business page it cannot back up.
  if (!profile) {
    // The suburbs were being fetched and thrown away here, which is why metros
    // with real local data — Chicago, Kansas City, Denver — read as generically
    // as a town we know nothing about. Naming the actual places we deliver to
    // is the one fact that is true of this city and false of every other, so it
    // is what makes the page worth indexing at all.
    const covers = areas.length
      ? ` We cover ${list(areas.slice(0, 8))} as well as ${name} itself.`
      : "";

    return {
      hero,
      heroDescription: areas.length
        ? `Water slide and bounce house rentals delivered across ${place} and nearby — ${list(areas.slice(0, 3))} included.`
        : `Water slide and bounce house rentals delivered to ${place}.`,
      intro: `We deliver inflatable water slides, bounce houses and combo units to ${place} — set up, anchored, sanitized and fully insured, from $155 a day.${covers} Tell us your date and where you are and we'll confirm what we can get to you.`,
      seasonal: "",
      faqs: [
        {
          q: `Do you deliver to ${name}?`,
          a: areas.length
            ? `Yes — across ${name} and the surrounding area, including ${list(areas.slice(0, 6))}. Give us your address and event date and we'll confirm delivery and any travel cost for ${place} before you commit to anything.`
            : `Yes. Give us your address and event date and we'll confirm delivery and any travel cost for ${place} before you commit to anything.`,
        },
        {
          q: `How far in advance should I book in ${name}?`,
          a: `Summer Saturdays go first — three to four weeks out is safe, and longer if your date is a holiday weekend. Midweek and off-season dates are usually available on shorter notice.`,
        },
        {
          q: "What does the price include?",
          a: "Delivery, professional setup and safe anchoring, sanitizing before every booking, and collection afterwards. You'll get one all-in number — nothing is charged online.",
        },
        {
          q: `Can you set up on grass or a driveway in ${name}?`,
          a: `Both. Grass is simplest — the unit is staked. On concrete, asphalt or any surface we cannot stake, we ballast with weighted bags instead. Tell us which you have when you book so the right anchoring comes on the truck.`,
        },
      ],
      venues: [],
      setup: "",
      // Cities with written suburbs carry real local content, so they are
      // indexable; see PRIORITY_CITY_KEYS. `profiled` stays false because that
      // flag means "has a full written profile", which drives the richer
      // seasonal and venue sections below.
      profiled: false,
    };
  }

  // ── Profiled city: built from written local facts ──────────────────────────
  const areaLine = areas.length
    ? ` We cover ${list(areas.slice(0, 6))} as well as ${name} itself.`
    : "";

  const intro = `${profile.climate}${areaLine}`;

  const seasonal = `The wet season in ${name} runs ${profile.wetSeason}. Outside those months the same units run dry, so a slide still works for a fall festival or a winter school event — it just goes out without the water. ${profile.demand}`;

  const faqs: CityFaq[] = [
    {
      q: `When should I book a water slide in ${name}?`,
      a: profile.demand,
    },
    {
      q: `How long is the water slide season in ${name}?`,
      a: `${profile.wetSeason.charAt(0).toUpperCase()}${profile.wetSeason.slice(1)}, realistically. ${profile.climate.split(". ")[0]}. Outside that window we set the same slides up dry.`,
    },
    {
      q: `Can you set up in my ${name} yard?`,
      a: profile.setup,
    },
    {
      q: `Do I need a permit for an inflatable in ${name}?`,
      a: `For a private yard, normally no. For a park, school or public site, usually yes. ${profile.permits} Ask us for a certificate of insurance early — that is the step that most often holds a booking up.`,
    },
    ...(profile.venues.length
      ? [
          {
            q: `Which ${name} venues do you deliver to?`,
            a: `We regularly deliver to ${list(profile.venues)}, along with private homes, schools and churches across the area. Every public site has its own reservation process, so confirm your spot before you book the slide.`,
          },
        ]
      : []),
    {
      q: "What is included in the price?",
      a: "Delivery, setup, safe anchoring, sanitizing and collection — one all-in number, quoted before you commit. Nothing is charged online.",
    },
  ];

  return {
    hero,
    heroDescription: `Inflatable water slide and bounce house rentals delivered across ${place} — set up, sanitized and fully insured.`,
    intro,
    seasonal,
    faqs,
    venues: profile.venues,
    setup: profile.setup,
    profiled: true,
  };
}
