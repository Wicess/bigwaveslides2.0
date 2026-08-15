// lib/city-profiles.ts
// Genuinely per-city facts for the location landing pages.
//
// WHY THIS REPLACED THE OLD GENERATOR
// City pages used to be spun: four intro paragraphs, a bank of FAQs, and a hash
// of the city slug deciding which variant each of 748 cities got. Swap the city
// name, keep the sentence. That is a doorway page by Google's own definition,
// and because a second site runs the same codebase it produced the SAME variants
// there — 87% of the Houston page was word-for-word identical across both.
//
// A city only earns a page here if there is something true to say about renting
// an inflatable IN THAT CITY that is not true of everywhere else: how long the
// wet season runs, what the ground is like, which venues people actually book,
// what the summer heat or the afternoon storms do to a booking. That cannot be
// generated, so it is written by hand — and the list stays short on purpose.
//
// INDEXING IS SELF-ENFORCING: isPriorityCity() is now "has a profile here".
// A city cannot be added to the sitemap without someone writing real content
// for it first, which is the guarantee the old hand-maintained list never gave.
//
// A note on accuracy: venues are real, publicly-known places. Permit guidance is
// deliberately phrased as "check with X" rather than asserting specific
// ordinances — inventing a rule that turns out to be wrong would be worse for
// the reader than sending them to the authority that actually decides.

export type CityProfile = {
  /** Months the wet season realistically runs, e.g. "March through October". */
  wetSeason: string;
  /** What makes booking here different. 2-4 sentences, city-specific. */
  climate: string;
  /** Real venues/parks locals book for parties and community events. */
  venues: string[];
  /** Ground, access and setup notes true of this metro. */
  setup: string;
  /** Who to check permits with. Named authority, never an invented rule. */
  permits: string;
  /** The local booking-pressure line — when dates actually go here. */
  demand: string;
};

export const CITY_PROFILES: Record<string, CityProfile> = {
  "texas/houston": {
    wetSeason: "March through late October",
    climate:
      "Houston's humidity makes a wet slide the default from spring right through October, and the season runs longer here than almost anywhere else in the country. The trade-off is afternoon thunderstorms between June and September — they build fast, pass quickly, and it is wind rather than rain that pauses an inflatable. Book a morning slot in high summer and you usually miss the whole pattern.",
    venues: [
      "Hermann Park",
      "Memorial Park",
      "Discovery Green",
      "Terry Hershey Park",
      "Bear Creek Pioneer Park",
    ],
    setup:
      "Most of the metro is flat with soft turf, which stakes well. Gumbo clay in the older neighbourhoods inside the Loop holds water after a storm, so we bring boards for the blower on damp ground. Newer Katy and Cypress subdivisions have narrow side gates — measure the gate, not the yard, before you book a 20 ft unit.",
    permits:
      "Houston Parks and Recreation handles park reservations and will tell you whether your pavilion permits inflatables; HOAs in Sugar Land and The Woodlands often have their own rules on top.",
    demand:
      "Spring birthdays and end-of-school weekends in May go first, then the October fall-festival run. Memorial Day and Fourth of July weekends are typically gone a month out.",
  },

  "texas/dallas": {
    wetSeason: "April through early October",
    climate:
      "Dallas summers are dry-hot rather than humid-hot, which means a wet slide is less a nice-to-have and more the only way to keep a yard full of kids outside in July. Triple-digit afternoons are common from late June, so morning and early-evening bookings are far more comfortable than midday ones.",
    venues: [
      "Klyde Warren Park",
      "White Rock Lake Park",
      "Kiest Park",
      "Trinity Groves",
      "Addison Circle Park",
    ],
    setup:
      "North Texas clay shrinks and cracks in high summer, so stakes need depth and we check the pad before anchoring. Plano and Frisco yards are generally level and easy; older East Dallas lots slope more than people expect, and a slide needs a genuinely flat run.",
    permits:
      "Dallas Park and Recreation issues park permits and can confirm inflatable rules for your site; several suburbs including Plano and Frisco run their own separate process.",
    demand:
      "The DFW calendar is front-loaded — April and May weekends book heavily for school events, and October is contested by every church and school fall festival in the metroplex.",
  },

  "texas/austin": {
    wetSeason: "March through October",
    climate:
      "Austin's season opens early and closes late, and the city's outdoor culture means events run year-round with the slide switched to dry in the cooler months. July and August afternoons regularly clear 100°F, which pushes most bookings to mornings or after 5pm.",
    venues: [
      "Zilker Park",
      "Mueller Lake Park",
      "Republic Square",
      "Walnut Creek Metropolitan Park",
      "Old Settlers Park in Round Rock",
    ],
    setup:
      "Central Austin has thin soil over limestone — stakes sometimes will not go, so we bring ballast as standard rather than as an afterthought. Hill Country lots west of the city are frequently sloped; a slide needs a level pad, and photos of the intended spot save a wasted trip.",
    permits:
      "Austin Parks and Recreation handles facility reservations and amplified-event rules; Travis and Williamson County parks have separate requirements.",
    demand:
      "Spring is the peak here rather than midsummer — March through May weekends go early, and SXSW and ACL weekends distort availability across the whole metro.",
  },

  "texas/san-antonio": {
    wetSeason: "March through October",
    climate:
      "San Antonio holds warm weather longer than most of Texas, giving a genuine eight-month wet season. Summer heat is intense but the evenings cool off usefully, so late-afternoon parties are popular in a way they are not further north.",
    venues: [
      "Brackenridge Park",
      "Woodlawn Lake Park",
      "Phil Hardberger Park",
      "McAllister Park",
      "Comanche Lookout Park",
    ],
    setup:
      "Caliche under thin topsoil in parts of the north side resists staking, so ballast is often the right call. Older neighbourhoods near downtown have mature trees — overhead clearance matters as much as ground footprint for a tall slide.",
    permits:
      "San Antonio Parks and Recreation handles pavilion and park reservations and will confirm whether inflatables are allowed at your chosen site.",
    demand:
      "Fiesta in April is the busiest single stretch of the year, and quinceañera season keeps weekends tight right through summer. Book six weeks out for a Saturday in April or May.",
  },

  "florida/orlando": {
    wetSeason: "Year-round, peaking March through November",
    climate:
      "Orlando is one of the few markets where a wet slide genuinely works twelve months a year. The constraint is not cold, it is the daily summer storm cycle: from June to September a downpour arrives most afternoons around the same time and clears within the hour. Morning bookings almost always beat it.",
    venues: [
      "Lake Eola Park",
      "Bill Frederick Park at Turkey Lake",
      "Cranes Roost Park in Altamonte Springs",
      "Barnett Park",
      "Central Winds Park in Winter Springs",
    ],
    setup:
      "Sandy soil across most of Central Florida takes stakes easily but drains fast, which is ideal. Watch for irrigation lines in newer subdivisions — they sit shallow here, and we need them flagged before anchoring.",
    permits:
      "Orange County Parks and Recreation and the City of Orlando both issue park permits, and several venues require a certificate of insurance naming them before the day.",
    demand:
      "Demand is flatter than seasonal markets but spring break in March and the run-up to Easter are the tightest weeks, along with the fall festival stretch in October.",
  },

  "florida/tampa": {
    wetSeason: "Year-round, peaking March through November",
    climate:
      "Tampa's Gulf humidity makes water the default for most of the year, and coastal breezes keep evenings usable through summer. Wind off the bay is the real scheduling factor — an inflatable comes down in a gust well before rain would stop it.",
    venues: [
      "Al Lopez Park",
      "Curtis Hixon Waterfront Park",
      "Lettuce Lake Park",
      "Philippe Park in Safety Harbor",
      "Flatwoods Park",
    ],
    setup:
      "Sand and sandy loam across most of the area stake well. Waterfront and near-bay sites are the exception — the open exposure means we assess wind on arrival and may reposition away from the water line.",
    permits:
      "Tampa Parks and Recreation and Hillsborough County Parks each run their own reservation process; beach and waterfront sites carry extra restrictions.",
    demand:
      "March and April are the busiest months, driven by spring break and school events, with a second peak through October for fall festivals.",
  },

  "florida/miami": {
    wetSeason: "Year-round",
    climate:
      "Miami has no off-season for wet rentals — a slide works in January. Summer brings daily convective storms and, from June to November, hurricane-season watchfulness; we track forecasts closely on bookings in that window and would always rather move a date than run an inflatable in wind.",
    venues: [
      "Tropical Park",
      "Amelia Earhart Park in Hialeah",
      "Kendall Indian Hammocks Park",
      "Greynolds Park",
      "Crandon Park on Key Biscayne",
    ],
    setup:
      "Limestone sits close to the surface across much of Miami-Dade, so staking is unreliable and ballast is the norm. Condo and townhouse yards are tight — the footprint plus clearance rarely fits where people assume it will, so measure first.",
    permits:
      "Miami-Dade Parks issues park permits and typically requires proof of insurance; individual municipalities such as Coral Gables and Hialeah run separate processes.",
    demand:
      "Winter is genuinely busy here, which is unusual. December through April is the strongest stretch, and quinceañera and graduation season keeps spring weekends full.",
  },

  "arizona/phoenix": {
    wetSeason: "March through October",
    climate:
      "Phoenix is the market where a water slide stops being entertainment and becomes the reason an outdoor party is survivable. From June through August, midday is genuinely dangerous heat — bookings cluster in early morning and evening, and shade over the queue matters more here than anywhere else we deliver.",
    venues: [
      "Encanto Park",
      "Steele Indian School Park",
      "Papago Park",
      "Kiwanis Park in Tempe",
      "Freestone Park in Gilbert",
    ],
    setup:
      "Caliche under desert landscaping is hard enough to stop a stake dead, so ballast is standard across the Valley. Artificial turf is common in newer builds and cannot be staked at all — tell us if your yard has it, because it changes the whole anchoring plan.",
    permits:
      "Phoenix Parks and Recreation handles ramada reservations, and Scottsdale, Tempe, Mesa and Gilbert each administer their own park rules.",
    demand:
      "March through May is peak, before the extreme heat sets in, then demand returns in September. Monsoon season from July brings dust storms that can cancel an afternoon at short notice.",
  },

  "nevada/las-vegas": {
    wetSeason: "April through October",
    climate:
      "Vegas heat is dry, which makes a wet slide enormously effective but also means water evaporates fast and the surface needs topping up through a long party. Summer afternoons are brutal; morning and post-sunset bookings are the norm rather than the exception.",
    venues: [
      "Sunset Park",
      "Floyd Lamb Park",
      "Craig Ranch Regional Park",
      "Desert Breeze Park",
      "Cornerstone Park in Henderson",
    ],
    setup:
      "Desert hardpan and decorative rock defeat stakes, so we ballast almost every job here. Many Summerlin and Henderson yards are compact with block walls — clearance from the wall matters, and gate width decides which units can physically reach the yard.",
    permits:
      "Clark County Parks and the City of Las Vegas both issue park permits; several regional parks require reservations well in advance for anything with equipment.",
    demand:
      "April, May and September are the sweet spots. Peak summer weekends still book but shift heavily toward evening slots.",
  },

  "california/los-angeles": {
    wetSeason: "April through October",
    climate:
      "LA's dry warmth gives a long, reliable season with very little weather disruption — one of the easiest markets in the country to plan an outdoor date in. Coastal neighbourhoods run cooler than inland ones by a wide margin; a slide that feels perfect in Woodland Hills can feel cold in Santa Monica on the same afternoon.",
    venues: [
      "Griffith Park",
      "Elysian Park",
      "Kenneth Hahn State Recreation Area",
      "Hansen Dam Recreation Area",
      "Whittier Narrows Recreation Area",
    ],
    setup:
      "Hillside lots across the Westside and the valleys are the main constraint — a slide needs a level run, and many LA yards simply do not have one. Street access and parking for the delivery vehicle is a genuine planning factor in dense neighbourhoods.",
    permits:
      "LA City Recreation and Parks and LA County Parks run separate permit systems, and most park sites require insurance documentation in advance.",
    demand:
      "Steady from spring through autumn without a dramatic peak, though graduation weekends in May and June are the tightest dates of the year.",
  },

  "california/san-diego": {
    wetSeason: "May through October",
    climate:
      "San Diego's mild coastal climate means summer rarely gets hot enough to make water essential, and the marine layer can keep mornings grey and cool into June. Inland areas like El Cajon and Escondido run considerably warmer and have a longer, more reliable wet season than the coast.",
    venues: [
      "Balboa Park",
      "Mission Bay Park",
      "Kate Sessions Park",
      "Santee Lakes",
      "Felicita County Park in Escondido",
    ],
    setup:
      "Canyon lots and steep driveways are common and both matter — the crew has to carry the unit from the vehicle to the pad. Coastal wind picks up through the afternoon and is the usual reason a beachside setup gets repositioned.",
    permits:
      "San Diego Parks and Recreation issues park permits; Mission Bay and shoreline parks carry additional restrictions on equipment and anchoring.",
    demand:
      "July through September is the real season here, later than most of the country, because June gloom suppresses early-summer demand.",
  },

  "georgia/atlanta": {
    wetSeason: "May through September",
    climate:
      "Atlanta's summer humidity makes water rentals popular from late spring, though the season is shorter than the Gulf states at both ends. Pop-up thunderstorms are frequent in July and August and tend to arrive late afternoon.",
    venues: [
      "Piedmont Park",
      "Grant Park",
      "Chastain Park",
      "Murphey Candler Park",
      "Sweetwater Creek State Park",
    ],
    setup:
      "Georgia red clay stakes well but turns slick when wet, and much of the metro is genuinely hilly — a level pad is the exception rather than the rule in older intown neighbourhoods. Tree cover is heavy, so overhead clearance needs checking for tall units.",
    permits:
      "Atlanta Department of Parks and Recreation handles park reservations, and surrounding counties including DeKalb, Cobb and Gwinnett each run their own.",
    demand:
      "Late May through June is peak for school events and graduations, with October busy for church and school fall festivals.",
  },

  "north-carolina/charlotte": {
    wetSeason: "May through September",
    climate:
      "Charlotte gets a solid but compact wet season — genuinely hot and humid from June through August, with the shoulder months better suited to dry setups. Afternoon storms are common in midsummer.",
    venues: [
      "Freedom Park",
      "Romare Bearden Park",
      "McAlpine Creek Park",
      "Reedy Creek Park",
      "Frank Liske Park in Concord",
    ],
    setup:
      "Clay soil holds water and stays soft for a day or two after rain, which affects both anchoring and vehicle access across a lawn. Newer south-Charlotte subdivisions are level and straightforward; older neighbourhoods slope more.",
    permits:
      "Mecklenburg County Park and Recreation issues park permits and can confirm inflatable rules for a specific site.",
    demand:
      "June is the busiest month, driven by end-of-school events, with a strong October fall-festival run.",
  },

  "tennessee/nashville": {
    wetSeason: "May through September",
    climate:
      "Nashville's summer is hot and humid enough to make water rentals the default from Memorial Day, but the season closes noticeably earlier than the Gulf states. Spring is unsettled and dry setups are the safer choice before May.",
    venues: [
      "Centennial Park",
      "Shelby Park",
      "Edwin Warner Park",
      "Cane Ridge Park",
      "Smith Springs Park",
    ],
    setup:
      "Middle Tennessee has shallow limestone in places, so staking is not guaranteed and we carry ballast. Many yards in the hills south of the city lack a level run long enough for a large slide.",
    permits:
      "Metro Nashville Parks and Recreation handles park reservations and special-event requirements.",
    demand:
      "Late May and June book hardest for school and church events; October fall festivals are the second peak.",
  },

  "louisiana/new-orleans": {
    wetSeason: "March through October",
    climate:
      "New Orleans has one of the longest wet seasons in the country and humidity that makes water genuinely necessary rather than optional. The flip side is a real hurricane-season awareness from June through November, and frequent short, heavy downpours in summer.",
    venues: [
      "City Park",
      "Audubon Park",
      "Lafreniere Park in Metairie",
      "Joe W. Brown Memorial Park",
      "Crescent Park",
    ],
    setup:
      "The water table sits high and ground stays soft, so anchoring is straightforward but standing water after rain is common — we look for the highest flat point in a yard. Narrow lots and tight street parking in Uptown and the Bywater affect access more than the yard itself does.",
    permits:
      "New Orleans Parks and Parkways and the City Park Conservancy handle their own sites separately, and Jefferson Parish runs its own process for Metairie and Kenner.",
    demand:
      "Spring is exceptionally busy — Mardi Gras through Easter and then crawfish-season weekends fill fast. Late summer slows as heat and storm risk peak.",
  },

  "south-carolina/charleston": {
    wetSeason: "April through October",
    climate:
      "Charleston's coastal humidity gives a long season, and the Lowcountry stays warm well into October. Coastal wind and afternoon storms are the two scheduling factors; wind is the one that actually stops a booking.",
    venues: [
      "Hampton Park",
      "James Island County Park",
      "Palmetto Islands County Park",
      "Wannamaker County Park",
      "Waterfront Park",
    ],
    setup:
      "Sandy soil stakes well across most of the area. Sites near the water are exposed and we assess wind on arrival; the high water table means some yards hold standing water after heavy rain.",
    permits:
      "Charleston County Parks and the City of Charleston each issue permits, and county parks generally require reservations for equipment.",
    demand:
      "April through June is the strongest run, ahead of peak summer heat and the height of hurricane season.",
  },

  "oklahoma/oklahoma-city": {
    wetSeason: "May through September",
    climate:
      "Oklahoma City summers are hot and dry enough to make a wet slide very effective, but spring brings serious wind and severe-storm risk. Wind is the single biggest cause of a rescheduled inflatable here — more so than in almost any other market we serve.",
    venues: [
      "Scissortail Park",
      "Will Rogers Park",
      "Lake Hefner",
      "Martin Park Nature Center",
      "Andrews Park in Norman",
    ],
    setup:
      "Ground stakes well in most of the metro. The dominant planning factor is exposure — open yards with no windbreak are common, and a sustained wind will close a unit even on a clear day.",
    permits:
      "Oklahoma City Parks and Recreation handles park reservations and can confirm equipment rules for a given site.",
    demand:
      "June and July are peak. Spring bookings carry genuine weather risk and we always agree a fallback date for April and May events.",
  },
};

/** True when a city has hand-written local content and can be indexed. */
export function hasCityProfile(stateSlug: string, citySlug: string): boolean {
  return Boolean(CITY_PROFILES[`${stateSlug}/${citySlug}`]);
}

export function getCityProfile(
  stateSlug: string,
  citySlug: string,
): CityProfile | undefined {
  return CITY_PROFILES[`${stateSlug}/${citySlug}`];
}

/** Every "state/city" key with a profile. The indexable set, by definition. */
export const PROFILED_CITY_KEYS: readonly string[] = Object.keys(CITY_PROFILES);
