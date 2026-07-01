// lib/locations.ts
// US states for the programmatic location landing pages. Big Wave Slides
// delivers nationwide, so every state gets its own SEO page targeting
// "water slide rentals in <state>". `cities` add local relevance + unique copy.

export type StateLocation = {
  slug: string;
  name: string;
  abbr: string;
  region: "Northeast" | "Midwest" | "South" | "West";
  cities: string[];
};

export const US_STATES: StateLocation[] = [
  {
    slug: "alabama",
    name: "Alabama",
    abbr: "AL",
    region: "South",
    cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile"],
  },
  {
    slug: "alaska",
    name: "Alaska",
    abbr: "AK",
    region: "West",
    cities: ["Anchorage", "Fairbanks", "Juneau"],
  },
  {
    slug: "arizona",
    name: "Arizona",
    abbr: "AZ",
    region: "West",
    cities: ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
  },
  {
    slug: "arkansas",
    name: "Arkansas",
    abbr: "AR",
    region: "South",
    cities: ["Little Rock", "Fayetteville", "Fort Smith"],
  },
  {
    slug: "california",
    name: "California",
    abbr: "CA",
    region: "West",
    cities: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
  },
  {
    slug: "colorado",
    name: "Colorado",
    abbr: "CO",
    region: "West",
    cities: ["Denver", "Colorado Springs", "Aurora", "Boulder"],
  },
  {
    slug: "connecticut",
    name: "Connecticut",
    abbr: "CT",
    region: "Northeast",
    cities: ["Bridgeport", "New Haven", "Hartford", "Stamford"],
  },
  {
    slug: "delaware",
    name: "Delaware",
    abbr: "DE",
    region: "South",
    cities: ["Wilmington", "Dover", "Newark"],
  },
  {
    slug: "florida",
    name: "Florida",
    abbr: "FL",
    region: "South",
    cities: ["Miami", "Orlando", "Tampa", "Jacksonville"],
  },
  {
    slug: "georgia",
    name: "Georgia",
    abbr: "GA",
    region: "South",
    cities: ["Atlanta", "Savannah", "Augusta", "Columbus"],
  },
  {
    slug: "hawaii",
    name: "Hawaii",
    abbr: "HI",
    region: "West",
    cities: ["Honolulu", "Hilo", "Kailua"],
  },
  {
    slug: "idaho",
    name: "Idaho",
    abbr: "ID",
    region: "West",
    cities: ["Boise", "Meridian", "Nampa"],
  },
  {
    slug: "illinois",
    name: "Illinois",
    abbr: "IL",
    region: "Midwest",
    cities: ["Chicago", "Aurora", "Naperville", "Springfield"],
  },
  {
    slug: "indiana",
    name: "Indiana",
    abbr: "IN",
    region: "Midwest",
    cities: ["Indianapolis", "Fort Wayne", "Carmel", "Bloomington"],
  },
  {
    slug: "iowa",
    name: "Iowa",
    abbr: "IA",
    region: "Midwest",
    cities: ["Des Moines", "Cedar Rapids", "Davenport"],
  },
  {
    slug: "kansas",
    name: "Kansas",
    abbr: "KS",
    region: "Midwest",
    cities: ["Wichita", "Overland Park", "Kansas City", "Topeka"],
  },
  {
    slug: "kentucky",
    name: "Kentucky",
    abbr: "KY",
    region: "South",
    cities: ["Louisville", "Lexington", "Bowling Green"],
  },
  {
    slug: "louisiana",
    name: "Louisiana",
    abbr: "LA",
    region: "South",
    cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  },
  {
    slug: "maine",
    name: "Maine",
    abbr: "ME",
    region: "Northeast",
    cities: ["Portland", "Lewiston", "Bangor"],
  },
  {
    slug: "maryland",
    name: "Maryland",
    abbr: "MD",
    region: "South",
    cities: ["Baltimore", "Columbia", "Germantown", "Annapolis"],
  },
  {
    slug: "massachusetts",
    name: "Massachusetts",
    abbr: "MA",
    region: "Northeast",
    cities: ["Boston", "Worcester", "Springfield", "Cambridge"],
  },
  {
    slug: "michigan",
    name: "Michigan",
    abbr: "MI",
    region: "Midwest",
    cities: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
  },
  {
    slug: "minnesota",
    name: "Minnesota",
    abbr: "MN",
    region: "Midwest",
    cities: ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  },
  {
    slug: "mississippi",
    name: "Mississippi",
    abbr: "MS",
    region: "South",
    cities: ["Jackson", "Gulfport", "Southaven"],
  },
  {
    slug: "missouri",
    name: "Missouri",
    abbr: "MO",
    region: "Midwest",
    cities: ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  },
  {
    slug: "montana",
    name: "Montana",
    abbr: "MT",
    region: "West",
    cities: ["Billings", "Missoula", "Bozeman"],
  },
  {
    slug: "nebraska",
    name: "Nebraska",
    abbr: "NE",
    region: "Midwest",
    cities: ["Omaha", "Lincoln", "Bellevue"],
  },
  {
    slug: "nevada",
    name: "Nevada",
    abbr: "NV",
    region: "West",
    cities: ["Las Vegas", "Henderson", "Reno"],
  },
  {
    slug: "new-hampshire",
    name: "New Hampshire",
    abbr: "NH",
    region: "Northeast",
    cities: ["Manchester", "Nashua", "Concord"],
  },
  {
    slug: "new-jersey",
    name: "New Jersey",
    abbr: "NJ",
    region: "Northeast",
    cities: ["Newark", "Jersey City", "Trenton", "Edison"],
  },
  {
    slug: "new-mexico",
    name: "New Mexico",
    abbr: "NM",
    region: "West",
    cities: ["Albuquerque", "Las Cruces", "Santa Fe"],
  },
  {
    slug: "new-york",
    name: "New York",
    abbr: "NY",
    region: "Northeast",
    cities: ["New York City", "Buffalo", "Rochester", "Albany"],
  },
  {
    slug: "north-carolina",
    name: "North Carolina",
    abbr: "NC",
    region: "South",
    cities: ["Charlotte", "Raleigh", "Greensboro", "Durham"],
  },
  {
    slug: "north-dakota",
    name: "North Dakota",
    abbr: "ND",
    region: "Midwest",
    cities: ["Fargo", "Bismarck", "Grand Forks"],
  },
  {
    slug: "ohio",
    name: "Ohio",
    abbr: "OH",
    region: "Midwest",
    cities: ["Columbus", "Cleveland", "Cincinnati", "Dublin"],
  },
  {
    slug: "oklahoma",
    name: "Oklahoma",
    abbr: "OK",
    region: "South",
    cities: ["Oklahoma City", "Tulsa", "Norman"],
  },
  {
    slug: "oregon",
    name: "Oregon",
    abbr: "OR",
    region: "West",
    cities: ["Portland", "Salem", "Eugene", "Bend"],
  },
  {
    slug: "pennsylvania",
    name: "Pennsylvania",
    abbr: "PA",
    region: "Northeast",
    cities: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg"],
  },
  {
    slug: "rhode-island",
    name: "Rhode Island",
    abbr: "RI",
    region: "Northeast",
    cities: ["Providence", "Warwick", "Cranston"],
  },
  {
    slug: "south-carolina",
    name: "South Carolina",
    abbr: "SC",
    region: "South",
    cities: ["Charleston", "Columbia", "Greenville", "Myrtle Beach"],
  },
  {
    slug: "south-dakota",
    name: "South Dakota",
    abbr: "SD",
    region: "Midwest",
    cities: ["Sioux Falls", "Rapid City", "Pierre"],
  },
  {
    slug: "tennessee",
    name: "Tennessee",
    abbr: "TN",
    region: "South",
    cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  },
  {
    slug: "texas",
    name: "Texas",
    abbr: "TX",
    region: "South",
    cities: ["Houston", "Dallas", "Austin", "San Antonio"],
  },
  {
    slug: "utah",
    name: "Utah",
    abbr: "UT",
    region: "West",
    cities: ["Salt Lake City", "Provo", "Ogden", "St. George"],
  },
  {
    slug: "vermont",
    name: "Vermont",
    abbr: "VT",
    region: "Northeast",
    cities: ["Burlington", "Montpelier", "Rutland"],
  },
  {
    slug: "virginia",
    name: "Virginia",
    abbr: "VA",
    region: "South",
    cities: ["Virginia Beach", "Richmond", "Arlington", "Norfolk"],
  },
  {
    slug: "washington",
    name: "Washington",
    abbr: "WA",
    region: "West",
    cities: ["Seattle", "Spokane", "Tacoma", "Bellevue"],
  },
  {
    slug: "west-virginia",
    name: "West Virginia",
    abbr: "WV",
    region: "South",
    cities: ["Charleston", "Huntington", "Morgantown"],
  },
  {
    slug: "wisconsin",
    name: "Wisconsin",
    abbr: "WI",
    region: "Midwest",
    cities: ["Milwaukee", "Madison", "Green Bay"],
  },
  {
    slug: "wyoming",
    name: "Wyoming",
    abbr: "WY",
    region: "West",
    cities: ["Cheyenne", "Casper", "Laramie"],
  },
  {
    slug: "washington-dc",
    name: "Washington, D.C.",
    abbr: "DC",
    region: "South",
    cities: ["Washington"],
  },
];

export function getStateBySlug(slug: string): StateLocation | undefined {
  return US_STATES.find((s) => s.slug === slug);
}

/** URL-safe slug for a city name, e.g. "St. Louis" → "st-louis". */
export function citySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'’]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type CityLocation = { name: string; slug: string; state: StateLocation };

/** Every city across all states, flattened — used for pSEO pages + sitemap. */
export function getAllCities(): CityLocation[] {
  return US_STATES.flatMap((state) =>
    state.cities.map((name) => ({ name, slug: citySlug(name), state })),
  );
}

/** Resolve a single city landing page from its state + city slug. */
export function getCity(
  stateSlug: string,
  cSlug: string,
): CityLocation | undefined {
  const state = getStateBySlug(stateSlug);
  if (!state) return undefined;
  const name = state.cities.find((c) => citySlug(c) === cSlug);
  return name ? { name, slug: cSlug, state } : undefined;
}
