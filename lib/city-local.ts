// lib/city-local.ts
// Real, verifiable local detail for the wave-1 priority metros. The single
// strongest "this page is genuinely about <city>" signal — actual delivery
// suburbs/neighborhoods a local renter recognizes — woven into copy + rendered
// as service-area chips. Keyed "stateSlug/citySlug".
//
// Rule: only real, well-known places. No invented venues, no fabricated
// reviews. A metro with no entry falls back to the region-level copy.

export type CityLocal = {
  /** Real neighboring suburbs / neighborhoods we deliver to. */
  areas: string[];
};

export const CITY_LOCAL: Record<string, CityLocal> = {
  // ── Texas ──
  "texas/houston": {
    areas: [
      "Katy",
      "Sugar Land",
      "The Woodlands",
      "Pearland",
      "Cypress",
      "Spring",
      "Humble",
      "Pasadena",
    ],
  },
  "texas/san-antonio": {
    areas: [
      "Alamo Heights",
      "Stone Oak",
      "Schertz",
      "Boerne",
      "Helotes",
      "Converse",
      "Universal City",
      "Leon Valley",
    ],
  },
  "texas/dallas": {
    areas: [
      "Plano",
      "Frisco",
      "Irving",
      "Garland",
      "McKinney",
      "Richardson",
      "Mesquite",
      "Carrollton",
    ],
  },
  "texas/austin": {
    areas: [
      "Round Rock",
      "Cedar Park",
      "Pflugerville",
      "Georgetown",
      "Leander",
      "Kyle",
      "Buda",
      "Lakeway",
    ],
  },
  "texas/fort-worth": {
    areas: [
      "Arlington",
      "Keller",
      "North Richland Hills",
      "Mansfield",
      "Grapevine",
      "Southlake",
      "Burleson",
      "Haltom City",
    ],
  },
  "texas/el-paso": {
    areas: [
      "Horizon City",
      "Socorro",
      "Canutillo",
      "Ysleta",
      "Fort Bliss",
      "Northeast El Paso",
    ],
  },

  // ── California ──
  "california/los-angeles": {
    areas: [
      "Pasadena",
      "Glendale",
      "Santa Monica",
      "Burbank",
      "Torrance",
      "Downey",
      "West Covina",
      "Inglewood",
    ],
  },
  "california/san-diego": {
    areas: [
      "Chula Vista",
      "El Cajon",
      "Oceanside",
      "Escondido",
      "Carlsbad",
      "La Mesa",
      "Santee",
      "Poway",
    ],
  },
  "california/san-jose": {
    areas: [
      "Santa Clara",
      "Sunnyvale",
      "Milpitas",
      "Campbell",
      "Cupertino",
      "Mountain View",
      "Los Gatos",
      "Morgan Hill",
    ],
  },
  "california/san-francisco": {
    areas: [
      "Daly City",
      "South San Francisco",
      "San Mateo",
      "Oakland",
      "Berkeley",
      "Pacifica",
      "Brisbane",
    ],
  },
  "california/fresno": {
    areas: [
      "Clovis",
      "Madera",
      "Selma",
      "Sanger",
      "Reedley",
      "Kingsburg",
      "Fowler",
    ],
  },
  "california/sacramento": {
    areas: [
      "Elk Grove",
      "Roseville",
      "Folsom",
      "Citrus Heights",
      "Rancho Cordova",
      "Davis",
      "Rocklin",
      "West Sacramento",
    ],
  },
  "california/long-beach": {
    areas: [
      "Lakewood",
      "Signal Hill",
      "Seal Beach",
      "Carson",
      "Bellflower",
      "Cerritos",
      "Los Alamitos",
    ],
  },

  // ── Florida ──
  "florida/jacksonville": {
    areas: [
      "Orange Park",
      "Jacksonville Beach",
      "Ponte Vedra",
      "St. Augustine",
      "Fleming Island",
      "Nocatee",
      "Fernandina Beach",
    ],
  },
  "florida/miami": {
    areas: [
      "Hialeah",
      "Coral Gables",
      "Miami Beach",
      "Kendall",
      "Homestead",
      "Doral",
      "Aventura",
      "Cutler Bay",
    ],
  },
  "florida/tampa": {
    areas: [
      "St. Petersburg",
      "Clearwater",
      "Brandon",
      "Riverview",
      "Wesley Chapel",
      "Plant City",
      "Largo",
      "Lutz",
    ],
  },
  "florida/orlando": {
    areas: [
      "Kissimmee",
      "Winter Park",
      "Winter Garden",
      "Lake Nona",
      "Apopka",
      "Sanford",
      "Oviedo",
      "Windermere",
    ],
  },

  // ── New York ──
  "new-york/new-york-city": {
    areas: [
      "Staten Island",
      "Queens",
      "Brooklyn",
      "The Bronx",
      "Yonkers",
      "Nassau County",
      "New Rochelle",
    ],
  },
  "new-york/buffalo": {
    areas: [
      "Amherst",
      "Cheektowaga",
      "Tonawanda",
      "West Seneca",
      "Hamburg",
      "Lancaster",
      "Orchard Park",
      "Niagara Falls",
    ],
  },

  // ── Illinois / Arizona ──
  "illinois/chicago": {
    areas: [
      "Naperville",
      "Aurora",
      "Schaumburg",
      "Oak Park",
      "Evanston",
      "Cicero",
      "Arlington Heights",
      "Orland Park",
    ],
  },
  "arizona/phoenix": {
    areas: [
      "Scottsdale",
      "Mesa",
      "Tempe",
      "Chandler",
      "Gilbert",
      "Glendale",
      "Peoria",
      "Surprise",
    ],
  },
  "arizona/tucson": {
    areas: [
      "Oro Valley",
      "Marana",
      "Sahuarita",
      "Vail",
      "Catalina Foothills",
      "South Tucson",
    ],
  },
  "arizona/mesa": {
    areas: [
      "Gilbert",
      "Chandler",
      "Tempe",
      "Apache Junction",
      "Queen Creek",
      "Scottsdale",
    ],
  },

  // ── Pennsylvania / Ohio ──
  "pennsylvania/philadelphia": {
    areas: [
      "King of Prussia",
      "Cherry Hill",
      "Bensalem",
      "Norristown",
      "Upper Darby",
      "Levittown",
      "Media",
      "Willow Grove",
    ],
  },
  "pennsylvania/pittsburgh": {
    areas: [
      "Monroeville",
      "Bethel Park",
      "Cranberry Township",
      "Mt. Lebanon",
      "Ross Township",
      "McKeesport",
      "Wexford",
    ],
  },
  "ohio/columbus": {
    areas: [
      "Dublin",
      "Westerville",
      "Hilliard",
      "Grove City",
      "Gahanna",
      "Reynoldsburg",
      "Pickerington",
      "Powell",
    ],
  },
  "ohio/cleveland": {
    areas: [
      "Parma",
      "Lakewood",
      "Euclid",
      "Strongsville",
      "Westlake",
      "Mentor",
      "Shaker Heights",
      "Beachwood",
    ],
  },
  "ohio/cincinnati": {
    areas: [
      "Mason",
      "West Chester",
      "Florence",
      "Hamilton",
      "Fairfield",
      "Blue Ash",
      "Loveland",
      "Milford",
    ],
  },

  // ── North Carolina / Georgia / Michigan ──
  "north-carolina/charlotte": {
    areas: [
      "Concord",
      "Gastonia",
      "Huntersville",
      "Matthews",
      "Mint Hill",
      "Cornelius",
      "Pineville",
      "Ballantyne",
    ],
  },
  "north-carolina/raleigh": {
    areas: [
      "Cary",
      "Durham",
      "Apex",
      "Wake Forest",
      "Garner",
      "Holly Springs",
      "Morrisville",
      "Knightdale",
    ],
  },
  "georgia/atlanta": {
    areas: [
      "Marietta",
      "Alpharetta",
      "Roswell",
      "Sandy Springs",
      "Decatur",
      "Smyrna",
      "Duluth",
      "Kennesaw",
    ],
  },
  "michigan/detroit": {
    areas: [
      "Warren",
      "Dearborn",
      "Livonia",
      "Troy",
      "Sterling Heights",
      "Southfield",
      "Royal Oak",
      "Novi",
    ],
  },

  // ── West / Mountain ──
  "washington/seattle": {
    areas: [
      "Bellevue",
      "Tacoma",
      "Kent",
      "Renton",
      "Redmond",
      "Kirkland",
      "Everett",
      "Federal Way",
    ],
  },
  "colorado/denver": {
    areas: [
      "Aurora",
      "Lakewood",
      "Arvada",
      "Centennial",
      "Littleton",
      "Westminster",
      "Thornton",
      "Highlands Ranch",
    ],
  },
  "nevada/las-vegas": {
    areas: [
      "Henderson",
      "North Las Vegas",
      "Summerlin",
      "Paradise",
      "Spring Valley",
      "Enterprise",
      "Boulder City",
    ],
  },
  "oregon/portland": {
    areas: [
      "Beaverton",
      "Gresham",
      "Hillsboro",
      "Tigard",
      "Lake Oswego",
      "Milwaukie",
      "Oregon City",
      "Tualatin",
    ],
  },
  "new-mexico/albuquerque": {
    areas: [
      "Rio Rancho",
      "Los Lunas",
      "Bernalillo",
      "Corrales",
      "Belen",
      "South Valley",
    ],
  },

  // ── Northeast / Mid-Atlantic ──
  "washington-dc/washington": {
    areas: [
      "Arlington",
      "Alexandria",
      "Bethesda",
      "Silver Spring",
      "Fairfax",
      "Rockville",
      "Gaithersburg",
    ],
  },
  "massachusetts/boston": {
    areas: [
      "Cambridge",
      "Quincy",
      "Newton",
      "Somerville",
      "Brookline",
      "Framingham",
      "Waltham",
      "Medford",
    ],
  },
  "maryland/baltimore": {
    areas: [
      "Towson",
      "Columbia",
      "Dundalk",
      "Glen Burnie",
      "Ellicott City",
      "Catonsville",
      "Owings Mills",
      "Essex",
    ],
  },
  "virginia/virginia-beach": {
    areas: [
      "Norfolk",
      "Chesapeake",
      "Portsmouth",
      "Suffolk",
      "Hampton",
      "Newport News",
    ],
  },

  // ── Tennessee / Oklahoma / Kentucky / Louisiana ──
  "tennessee/nashville": {
    areas: [
      "Franklin",
      "Murfreesboro",
      "Hendersonville",
      "Brentwood",
      "Smyrna",
      "Mt. Juliet",
      "Gallatin",
      "Antioch",
    ],
  },
  "tennessee/memphis": {
    areas: [
      "Germantown",
      "Collierville",
      "Bartlett",
      "Cordova",
      "Southaven",
      "Millington",
      "Arlington",
    ],
  },
  "oklahoma/oklahoma-city": {
    areas: [
      "Edmond",
      "Norman",
      "Moore",
      "Midwest City",
      "Yukon",
      "Del City",
      "Mustang",
      "Bethany",
    ],
  },
  "oklahoma/tulsa": {
    areas: [
      "Broken Arrow",
      "Owasso",
      "Bixby",
      "Jenks",
      "Sand Springs",
      "Sapulpa",
      "Claremore",
      "Glenpool",
    ],
  },
  "kentucky/louisville": {
    areas: [
      "Jeffersontown",
      "St. Matthews",
      "Shively",
      "New Albany",
      "Jeffersonville",
      "Prospect",
      "Middletown",
    ],
  },
  "louisiana/new-orleans": {
    areas: [
      "Metairie",
      "Kenner",
      "Gretna",
      "Chalmette",
      "Marrero",
      "Harvey",
      "Slidell",
      "Harahan",
    ],
  },

  // ── Midwest ──
  "missouri/kansas-city": {
    areas: [
      "Overland Park",
      "Independence",
      "Lee's Summit",
      "Olathe",
      "Blue Springs",
      "Shawnee",
      "Liberty",
      "Gladstone",
    ],
  },
  "missouri/st-louis": {
    areas: [
      "Chesterfield",
      "Florissant",
      "Kirkwood",
      "Ballwin",
      "Wentzville",
      "O'Fallon",
      "University City",
      "Maryland Heights",
    ],
  },
  "indiana/indianapolis": {
    areas: [
      "Carmel",
      "Fishers",
      "Noblesville",
      "Greenwood",
      "Lawrence",
      "Avon",
      "Plainfield",
      "Zionsville",
    ],
  },
  "wisconsin/milwaukee": {
    areas: [
      "Waukesha",
      "West Allis",
      "Wauwatosa",
      "Brookfield",
      "Franklin",
      "Oak Creek",
      "Greenfield",
      "New Berlin",
    ],
  },
  "minnesota/minneapolis": {
    areas: [
      "St. Paul",
      "Bloomington",
      "Brooklyn Park",
      "Plymouth",
      "Maple Grove",
      "Eden Prairie",
      "Edina",
      "Minnetonka",
    ],
  },
};

/** Local detail for a city, or null if it isn't a filled-in priority metro. */
export function getCityLocal(
  stateSlug: string,
  cSlug: string,
): CityLocal | null {
  return CITY_LOCAL[`${stateSlug}/${cSlug}`] ?? null;
}
