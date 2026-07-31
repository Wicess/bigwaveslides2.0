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

  // ══════════════════════════════════════════════════════════════════
  // Wave 2 — real suburbs/neighborhoods for the second wave of metros.
  // Same rule: only genuine, well-known places a local renter recognizes.
  // ══════════════════════════════════════════════════════════════════

  // ── California ──
  "california/oakland": {
    areas: [
      "Berkeley",
      "Alameda",
      "Emeryville",
      "San Leandro",
      "Piedmont",
      "Hayward",
      "Richmond",
      "Castro Valley",
    ],
  },
  "california/bakersfield": {
    areas: [
      "Oildale",
      "Rosedale",
      "Shafter",
      "Delano",
      "Wasco",
      "Arvin",
      "Tehachapi",
    ],
  },
  "california/anaheim": {
    areas: [
      "Fullerton",
      "Orange",
      "Garden Grove",
      "Buena Park",
      "Placentia",
      "Yorba Linda",
      "Brea",
      "Cypress",
    ],
  },
  "california/riverside": {
    areas: [
      "Moreno Valley",
      "Corona",
      "Jurupa Valley",
      "Eastvale",
      "Norco",
      "Perris",
      "Rubidoux",
    ],
  },
  "california/santa-ana": {
    areas: [
      "Garden Grove",
      "Tustin",
      "Orange",
      "Fountain Valley",
      "Costa Mesa",
      "Westminster",
      "Irvine",
    ],
  },
  "california/stockton": {
    areas: [
      "Lodi",
      "Manteca",
      "Tracy",
      "Lathrop",
      "Ripon",
      "Escalon",
      "Modesto",
    ],
  },
  "california/chula-vista": {
    areas: [
      "National City",
      "Bonita",
      "Imperial Beach",
      "Eastlake",
      "Otay Ranch",
      "San Ysidro",
      "Coronado",
    ],
  },
  "california/irvine": {
    areas: [
      "Tustin",
      "Lake Forest",
      "Newport Beach",
      "Costa Mesa",
      "Aliso Viejo",
      "Laguna Hills",
      "Mission Viejo",
    ],
  },

  // ── Texas ──
  "texas/arlington": {
    areas: [
      "Grand Prairie",
      "Mansfield",
      "Kennedale",
      "Pantego",
      "Euless",
      "Bedford",
      "Fort Worth",
    ],
  },
  "texas/corpus-christi": {
    areas: [
      "Portland",
      "Robstown",
      "Aransas Pass",
      "Ingleside",
      "Kingsville",
      "Rockport",
      "Bishop",
    ],
  },
  "texas/plano": {
    areas: [
      "Frisco",
      "Allen",
      "McKinney",
      "Richardson",
      "Murphy",
      "Wylie",
      "Carrollton",
      "The Colony",
    ],
  },
  "texas/lubbock": {
    areas: [
      "Wolfforth",
      "Slaton",
      "Shallowater",
      "Idalou",
      "New Deal",
      "Ransom Canyon",
    ],
  },
  "texas/laredo": {
    areas: ["Rio Bravo", "El Cenizo", "United", "Del Mar"],
  },
  "texas/garland": {
    areas: [
      "Rowlett",
      "Sachse",
      "Mesquite",
      "Richardson",
      "Wylie",
      "Plano",
      "Sunnyvale",
    ],
  },
  "texas/irving": {
    areas: [
      "Coppell",
      "Grand Prairie",
      "Farmers Branch",
      "Euless",
      "Grapevine",
      "Bedford",
    ],
  },

  // ── Florida ──
  "florida/st-petersburg": {
    areas: [
      "Clearwater",
      "Largo",
      "Pinellas Park",
      "Seminole",
      "Gulfport",
      "Dunedin",
      "Tarpon Springs",
      "Tampa",
    ],
  },
  "florida/hialeah": {
    areas: [
      "Miami Lakes",
      "Miami Springs",
      "Hialeah Gardens",
      "Opa-locka",
      "Doral",
      "Medley",
      "Miami",
    ],
  },
  "florida/fort-lauderdale": {
    areas: [
      "Plantation",
      "Sunrise",
      "Pompano Beach",
      "Davie",
      "Pembroke Pines",
      "Hollywood",
      "Coral Springs",
      "Weston",
    ],
  },
  "florida/tallahassee": {
    areas: [
      "Crawfordville",
      "Havana",
      "Quincy",
      "Monticello",
      "Woodville",
      "Midway",
    ],
  },
  "florida/cape-coral": {
    areas: [
      "Fort Myers",
      "North Fort Myers",
      "Lehigh Acres",
      "Punta Gorda",
      "Estero",
      "Bonita Springs",
      "Sanibel",
    ],
  },
  "florida/port-st-lucie": {
    areas: [
      "Fort Pierce",
      "Stuart",
      "Jensen Beach",
      "Palm City",
      "Hobe Sound",
      "Vero Beach",
    ],
  },

  // ── Arizona ──
  "arizona/chandler": {
    areas: [
      "Gilbert",
      "Tempe",
      "Mesa",
      "Queen Creek",
      "Ahwatukee",
      "Sun Lakes",
      "Scottsdale",
    ],
  },
  "arizona/gilbert": {
    areas: [
      "Chandler",
      "Mesa",
      "Queen Creek",
      "Tempe",
      "Higley",
      "Apache Junction",
    ],
  },
  "arizona/scottsdale": {
    areas: [
      "Tempe",
      "Paradise Valley",
      "Fountain Hills",
      "Mesa",
      "Cave Creek",
      "Carefree",
      "Phoenix",
    ],
  },
  "arizona/glendale": {
    areas: [
      "Peoria",
      "Surprise",
      "Sun City",
      "Youngtown",
      "Tolleson",
      "Litchfield Park",
      "Phoenix",
    ],
  },
  "arizona/tempe": {
    areas: [
      "Mesa",
      "Chandler",
      "Scottsdale",
      "Ahwatukee",
      "Guadalupe",
      "Phoenix",
    ],
  },

  // ── Colorado ──
  "colorado/colorado-springs": {
    areas: [
      "Fountain",
      "Monument",
      "Manitou Springs",
      "Falcon",
      "Security-Widefield",
      "Woodland Park",
      "Peyton",
    ],
  },
  "colorado/aurora": {
    areas: [
      "Denver",
      "Centennial",
      "Parker",
      "Englewood",
      "Commerce City",
      "Greenwood Village",
    ],
  },

  // ── North Carolina ──
  "north-carolina/greensboro": {
    areas: [
      "High Point",
      "Burlington",
      "Kernersville",
      "Summerfield",
      "Oak Ridge",
      "Jamestown",
      "Gibsonville",
    ],
  },
  "north-carolina/durham": {
    areas: [
      "Chapel Hill",
      "Cary",
      "Morrisville",
      "Hillsborough",
      "Research Triangle Park",
      "Raleigh",
    ],
  },
  "north-carolina/winston-salem": {
    areas: [
      "Kernersville",
      "Clemmons",
      "Lewisville",
      "Walkertown",
      "King",
      "Pfafftown",
      "Rural Hall",
    ],
  },

  // ── Ohio ──
  "ohio/toledo": {
    areas: [
      "Sylvania",
      "Maumee",
      "Perrysburg",
      "Oregon",
      "Rossford",
      "Holland",
      "Waterville",
    ],
  },
  "ohio/akron": {
    areas: [
      "Cuyahoga Falls",
      "Stow",
      "Barberton",
      "Fairlawn",
      "Tallmadge",
      "Green",
      "Hudson",
      "Kent",
    ],
  },

  // ── Tennessee ──
  "tennessee/knoxville": {
    areas: [
      "Farragut",
      "Maryville",
      "Oak Ridge",
      "Alcoa",
      "Powell",
      "Halls",
      "Sevierville",
    ],
  },
  "tennessee/chattanooga": {
    areas: [
      "East Ridge",
      "Red Bank",
      "Soddy-Daisy",
      "Hixson",
      "Ooltewah",
      "Signal Mountain",
      "Cleveland",
    ],
  },

  // ── Nevada ──
  "nevada/henderson": {
    areas: [
      "Las Vegas",
      "Green Valley",
      "Boulder City",
      "Anthem",
      "Paradise",
      "Enterprise",
    ],
  },
  "nevada/reno": {
    areas: [
      "Sparks",
      "Carson City",
      "Sun Valley",
      "Spanish Springs",
      "Cold Springs",
      "Fernley",
    ],
  },

  // ── Washington ──
  "washington/spokane": {
    areas: [
      "Spokane Valley",
      "Cheney",
      "Liberty Lake",
      "Airway Heights",
      "Mead",
      "Deer Park",
    ],
  },
  "washington/tacoma": {
    areas: [
      "Lakewood",
      "Puyallup",
      "University Place",
      "Federal Way",
      "Gig Harbor",
      "Fircrest",
      "Bonney Lake",
    ],
  },

  // ── Virginia ──
  "virginia/richmond": {
    areas: [
      "Henrico",
      "Chesterfield",
      "Midlothian",
      "Glen Allen",
      "Mechanicsville",
      "Short Pump",
      "Petersburg",
    ],
  },
  "virginia/norfolk": {
    areas: [
      "Virginia Beach",
      "Chesapeake",
      "Portsmouth",
      "Suffolk",
      "Hampton",
      "Newport News",
    ],
  },
  "virginia/chesapeake": {
    areas: [
      "Norfolk",
      "Virginia Beach",
      "Portsmouth",
      "Suffolk",
      "Hampton",
      "Great Bridge",
    ],
  },

  // ── New York ──
  "new-york/rochester": {
    areas: [
      "Greece",
      "Irondequoit",
      "Henrietta",
      "Brighton",
      "Webster",
      "Pittsford",
      "Fairport",
      "Penfield",
    ],
  },
  "new-york/syracuse": {
    areas: [
      "Cicero",
      "Clay",
      "Camillus",
      "DeWitt",
      "Liverpool",
      "Baldwinsville",
      "Manlius",
      "Fayetteville",
    ],
  },
  "new-york/yonkers": {
    areas: [
      "Mount Vernon",
      "New Rochelle",
      "White Plains",
      "Bronxville",
      "Hastings-on-Hudson",
      "Tuckahoe",
    ],
  },
  "new-york/albany": {
    areas: [
      "Schenectady",
      "Troy",
      "Colonie",
      "Guilderland",
      "Bethlehem",
      "Cohoes",
      "Watervliet",
    ],
  },

  // ── Georgia ──
  "georgia/augusta": {
    areas: [
      "Martinez",
      "Evans",
      "Grovetown",
      "North Augusta",
      "Hephzibah",
      "Fort Gordon",
    ],
  },
  "georgia/columbus": {
    areas: [
      "Phenix City",
      "Fort Benning",
      "Fortson",
      "Midland",
      "Cataula",
      "Upatoi",
    ],
  },
  "georgia/savannah": {
    areas: [
      "Pooler",
      "Garden City",
      "Richmond Hill",
      "Port Wentworth",
      "Tybee Island",
      "Bloomingdale",
      "Hinesville",
    ],
  },

  // ── Michigan ──
  "michigan/grand-rapids": {
    areas: [
      "Wyoming",
      "Kentwood",
      "Walker",
      "Grandville",
      "Rockford",
      "Cascade",
      "East Grand Rapids",
      "Ada",
    ],
  },

  // ── Minnesota ──
  "minnesota/saint-paul": {
    areas: [
      "Minneapolis",
      "Maplewood",
      "Roseville",
      "West St. Paul",
      "Woodbury",
      "Eagan",
      "Mendota Heights",
      "Oakdale",
    ],
  },

  // ── Kansas ──
  "kansas/wichita": {
    areas: [
      "Derby",
      "Andover",
      "Haysville",
      "Park City",
      "Maize",
      "Bel Aire",
      "Goddard",
      "Valley Center",
    ],
  },
  "kansas/overland-park": {
    areas: [
      "Olathe",
      "Lenexa",
      "Shawnee",
      "Leawood",
      "Prairie Village",
      "Merriam",
      "Kansas City",
    ],
  },

  // ── Nebraska ──
  "nebraska/omaha": {
    areas: [
      "Bellevue",
      "Papillion",
      "La Vista",
      "Elkhorn",
      "Ralston",
      "Gretna",
      "Council Bluffs",
    ],
  },
  "nebraska/lincoln": {
    areas: ["Waverly", "Hickman", "Milford", "Seward", "Crete", "Roca"],
  },

  // ── New Jersey ──
  "new-jersey/newark": {
    areas: [
      "East Orange",
      "Irvington",
      "Bloomfield",
      "Belleville",
      "Nutley",
      "Kearny",
      "Harrison",
      "Orange",
    ],
  },
  "new-jersey/jersey-city": {
    areas: [
      "Hoboken",
      "Bayonne",
      "Union City",
      "Weehawken",
      "Secaucus",
      "North Bergen",
      "Kearny",
    ],
  },

  // ── Indiana / Kentucky ──
  "indiana/fort-wayne": {
    areas: [
      "New Haven",
      "Huntertown",
      "Leo-Cedarville",
      "Woodburn",
      "Grabill",
      "Auburn",
    ],
  },
  "kentucky/lexington": {
    areas: [
      "Nicholasville",
      "Georgetown",
      "Richmond",
      "Versailles",
      "Winchester",
      "Wilmore",
      "Paris",
    ],
  },

  // ── Louisiana ──
  "louisiana/baton-rouge": {
    areas: [
      "Baker",
      "Zachary",
      "Central",
      "Denham Springs",
      "Gonzales",
      "Prairieville",
      "Port Allen",
    ],
  },
  "louisiana/shreveport": {
    areas: [
      "Bossier City",
      "Haughton",
      "Benton",
      "Blanchard",
      "Greenwood",
      "Stonewall",
    ],
  },

  // ── Utah ──
  "utah/salt-lake-city": {
    areas: [
      "West Valley City",
      "Sandy",
      "West Jordan",
      "Murray",
      "Draper",
      "Millcreek",
      "Holladay",
      "South Jordan",
    ],
  },

  // ── South Carolina ──
  "south-carolina/charleston": {
    areas: [
      "Mount Pleasant",
      "North Charleston",
      "Summerville",
      "Goose Creek",
      "James Island",
      "Hanahan",
      "Folly Beach",
    ],
  },
  "south-carolina/columbia": {
    areas: [
      "Lexington",
      "West Columbia",
      "Cayce",
      "Irmo",
      "Forest Acres",
      "Blythewood",
      "Chapin",
    ],
  },

  // ── Alabama ──
  "alabama/birmingham": {
    areas: [
      "Hoover",
      "Vestavia Hills",
      "Homewood",
      "Mountain Brook",
      "Bessemer",
      "Trussville",
      "Alabaster",
      "Pelham",
    ],
  },
  "alabama/montgomery": {
    areas: ["Prattville", "Wetumpka", "Millbrook", "Pike Road", "Deatsville"],
  },
  "alabama/huntsville": {
    areas: [
      "Madison",
      "Decatur",
      "Athens",
      "Meridianville",
      "Hazel Green",
      "Harvest",
      "Owens Cross Roads",
    ],
  },

  // ── Iowa / Arkansas / Mississippi / Oregon ──
  "iowa/des-moines": {
    areas: [
      "West Des Moines",
      "Ankeny",
      "Urbandale",
      "Johnston",
      "Clive",
      "Altoona",
      "Waukee",
      "Windsor Heights",
    ],
  },
  "arkansas/little-rock": {
    areas: [
      "North Little Rock",
      "Conway",
      "Benton",
      "Bryant",
      "Sherwood",
      "Jacksonville",
      "Maumelle",
      "Cabot",
    ],
  },
  "mississippi/jackson": {
    areas: [
      "Clinton",
      "Pearl",
      "Ridgeland",
      "Madison",
      "Brandon",
      "Flowood",
      "Byram",
      "Canton",
    ],
  },
  "oregon/salem": {
    areas: [
      "Keizer",
      "Turner",
      "Independence",
      "Monmouth",
      "Dallas",
      "Silverton",
      "Stayton",
      "Woodburn",
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
