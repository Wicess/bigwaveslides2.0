import type { CityLocation } from "@/lib/locations";
import { getCity } from "@/lib/locations";
import { getCityProfile } from "@/lib/city-profiles";
import { getCityLocal } from "@/lib/city-local";
import { getCityClimate, type CityClimate } from "@/lib/city-climate";

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
  /** NOAA climate normals for the nearest station, for the month-by-month
      table. Null on profiled cities, whose climate is already written prose. */
  climate: CityClimate | null;
  /** Other cities we serve within 60 miles, nearest first, with real distances. */
  nearby: { name: string; abbr: string; href: string; miles: number }[];
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "May through September", "all year", or null when no month qualifies. */
function seasonLabel(c: CityClimate): string | null {
  if (c.season === "all") return "all year";
  if (!c.season) return null;
  return `${MONTHS[c.season[0]]} through ${MONTHS[c.season[1]]}`;
}

/** Index of the warmest month by average high. */
function peakMonth(c: CityClimate): number {
  return c.high.reduce((best, h, i) => (h > c.high[best]! ? i : best), 0);
}

/**
 * The season paragraph, written entirely from measured normals.
 *
 * Every clause is either a figure from the station or something that follows
 * directly from one. Nothing about demand, venues or local custom — those are
 * the claims this data cannot support, and inventing them is exactly how a
 * page ends up confidently wrong about somewhere its author has never been.
 */
function seasonalFromClimate(name: string, c: CityClimate): string {
  const p = peakMonth(c);
  const peak = MONTHS[p]!;
  const high = c.high[p]!;
  const low = c.low[p]!;
  const hot = c.d90[p]!;
  const label = seasonLabel(c);
  const parts: string[] = [];

  if (c.season === "all") {
    parts.push(
      `${name} is warm enough for a wet slide all year round: every month averages at least ten days that reach 80°F, and a typical year has about ${c.warmDays} of them. ${peak} is the warmest month, with highs around ${high}°F.`,
    );
  } else if (label) {
    parts.push(
      `Water slide weather in ${name} runs ${label}. About ${c.warmDays} days a year reach 80°F — the point where a wet slide feels like summer rather than a dare — and ${peak} is the warmest month, with highs around ${high}°F.`,
    );
  } else {
    // San Francisco is the case this exists for: a real metro where no month
    // is reliably hot. Saying so is more useful than pretending otherwise.
    parts.push(
      `${name} rarely gets hot enough for a wet slide to feel like summer. Only about ${c.warmDays} days a year reach 80°F, and even ${peak}, the warmest month, averages a high of ${high}°F. A dry setup is the dependable choice here — book wet for a day the forecast says will be warm.`,
    );
  }

  if (hot >= 15) {
    parts.push(
      `${peak} also averages ${hot} days above 90°F, so a morning or early-afternoon slot is kinder than peak heat, and shade and drinking water near the slide matter.`,
    );
  }

  // Wide day-night swing at the height of summer: the water is only pleasant
  // while the sun is on it. Measured directly, not assumed from elevation.
  if (high - low >= 25) {
    parts.push(
      `Evenings cool quickly — ${peak} lows average ${low}°F even when afternoons reach ${high}°F — so a midday start gets the most out of the water.`,
    );
  }

  if (label && c.season !== "all") {
    parts.push(
      `Outside that window the same units run dry, so a slide still works for a fall festival or a school event.`,
    );
  }

  return parts.join(" ");
}

function nearbyFromClimate(c: CityClimate | null): CityContent["nearby"] {
  if (!c) return [];
  return c.nearby.flatMap(([key, miles]) => {
    const [stateSlug, citySlug] = key.split("/");
    const loc = stateSlug && citySlug ? getCity(stateSlug, citySlug) : null;
    return loc
      ? [
          {
            name: loc.name,
            abbr: loc.state.abbr,
            href: `/water-slide-rentals/${stateSlug}/${citySlug}`,
            miles,
          },
        ]
      : [];
  });
}

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
    const climate = getCityClimate(st.slug, loc.slug);
    const season = climate ? seasonLabel(climate) : null;
    const peak = climate ? peakMonth(climate) : 0;
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
      // Was hard-coded "" for every one of these 735 cities, which is most of
      // why they read as one page. Now it is this city's measured season.
      seasonal: climate ? seasonalFromClimate(name, climate) : "",
      faqs: [
        {
          q: `Do you deliver to ${name}?`,
          a: areas.length
            ? `Yes — across ${name} and the surrounding area, including ${list(areas.slice(0, 6))}. Give us your address and event date and we'll confirm delivery and any travel cost for ${place} before you commit to anything.`
            : `Yes. Give us your address and event date and we'll confirm delivery and any travel cost for ${place} before you commit to anything.`,
        },
        // Answered from NOAA normals, so each city's answer is its own — and
        // checkable. These replace nothing; they add the one question every
        // city genuinely answers differently.
        ...(climate
          ? [
              {
                q: `When is water slide season in ${name}?`,
                a:
                  climate.season === "all"
                    ? `All year. Every month in ${name} averages at least ten days that reach 80°F — about ${climate.warmDays} warm days in a typical year — so a wet slide works in any season.`
                    : season
                      ? `${season.charAt(0).toUpperCase()}${season.slice(1)}. That is when ${name} reliably reaches 80°F on ten or more days a month, and about ${climate.warmDays} days a year get that warm. Outside it, the same slides run dry.`
                      : `${name} has no month that is reliably warm enough — only about ${climate.warmDays} days a year reach 80°F. Book a dry setup, or go wet on a day the forecast calls warm.`,
              },
              {
                q: `How hot does ${name} get in summer?`,
                a: `${MONTHS[peak]} is the warmest month, with an average high of ${climate.high[peak]}°F and low of ${climate.low[peak]}°F${
                  climate.d90[peak]! > 0
                    ? `, and about ${climate.d90[peak]} of its days top 90°F`
                    : `, and it rarely tops 90°F`
                }. That is from NOAA's 1991–2020 climate normals for the nearest weather station, ${climate.stationMi} miles away.`,
              },
            ]
          : []),
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
      climate,
      nearby: nearbyFromClimate(climate),
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
    // Deliberately untouched. These 17 pages are the only city pages Google has
    // sent anyone to, and their climate is already hand-written.
    climate: null,
    nearby: [],
  };
}
