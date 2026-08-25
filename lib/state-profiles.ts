// lib/state-profiles.ts
// Genuinely per-state facts for the 51 state hub pages.
//
// WHY THIS EXISTS
// The state hubs were spun. Measured before this shipped: water-slide state
// pages were 96–97% identical to each other, bounce-house state pages 96.8%,
// and a state's two family pages 95.8% identical to one another. 800 words
// each, and the same 800 words with the name swapped. Google indexed 8 pages
// out of 343 and left the rest in "crawled – currently not indexed", which is
// exactly what it does with near-duplicates.
//
// This is the same fix lib/city-profiles.ts applied to cities, extended to
// states: a page earns its place by saying something true about renting an
// inflatable IN THAT STATE that is not true everywhere else. Season length,
// what the ground does to an anchor, which weather actually cancels a booking,
// and when local dates fill are all genuinely different in Vermont and Arizona.
//
// ACCURACY RULES, inherited from city-profiles:
//   - Climate, terrain and seasonality are described at the level they are
//     actually knowable — regional and directional, never a fabricated
//     statistic. No invented temperatures, no invented booking numbers.
//   - Permits name an authority to ASK rather than asserting an ordinance.
//     Inventing a rule that turns out to be wrong is worse for the reader than
//     pointing them at whoever actually decides.
//   - `dry` exists so the bounce-house hub says something different from the
//     water-slide hub for the same state, rather than the two being 95%
//     identical to each other. Bounce houses run dry and indoors, so the
//     seasonal story genuinely differs.

export type StateProfile = {
  /** Realistic wet-season window for this state. */
  season: string;
  /** What makes booking here different. 2-3 sentences. */
  climate: string;
  /** Ground, anchoring and access reality across the state. */
  ground: string;
  /** When dates actually fill locally. */
  demand: string;
  /** Who to ask about permits. A named authority, never an invented rule. */
  permits: string;
  /** Bounce-house angle — why the dry season story differs here. */
  dry: string;
};

export const STATE_PROFILES: Record<string, StateProfile> = {
  alabama: {
    season: "Late April through early October",
    climate:
      "Alabama runs one of the longer wet seasons in the country, with Gulf humidity that makes water the default from spring until the first cool snap. Afternoon thunderstorms build most days in July and August and pass within the hour, and it is the wind ahead of them rather than the rain that pauses an inflatable.",
    ground:
      "Red clay across most of the state stakes well but turns slick and holds water for a day or two after heavy rain. Sandy soil nearer the coast drains faster and anchors easily.",
    demand:
      "Late May and June book hardest around end-of-school events, with a second run through October for church and school fall festivals.",
    permits:
      "Alabama State Parks handles state-park sites; city parks departments in Birmingham, Montgomery and Mobile run their own reservations.",
    dry: "Because bounce houses run dry, they book straight through the Alabama winter for indoor birthdays and church halls, when a wet slide would sit idle.",
  },

  alaska: {
    season: "Mid-June through mid-August",
    climate:
      "Alaska has the shortest wet-rental window in the country — a genuine summer exists, but it is measured in weeks rather than months, and even July evenings cool off quickly. Long daylight is the compensation: a party can run late into the evening without losing the light.",
    ground:
      "Ground thaws late and stays soft in spring, so anchoring is straightforward once the season opens but standing water is common early on. Gravel pads are frequent and need ballast rather than stakes.",
    demand:
      "The season is so compressed that midsummer weekends are the whole year. Book as far ahead as you can rather than waiting for warm weather to arrive.",
    permits:
      "Alaska State Parks handles state sites; Anchorage and Fairbanks parks departments run their own permits.",
    dry: "Dry bounce houses are the practical year-round option here, and indoor gyms and community halls carry most of the winter demand.",
  },

  arizona: {
    season: "March through October",
    climate:
      "Arizona is the market where a water slide stops being entertainment and becomes the reason an outdoor party is survivable at all. From June through August the middle of the day is genuinely dangerous heat, so bookings cluster into early morning and evening, and shade over the queue matters more here than almost anywhere else.",
    ground:
      "Caliche under desert landscaping is hard enough to stop a stake dead, so ballast is standard across the state. Artificial turf is common in newer builds and cannot be staked at all — tell us if your yard has it, because it changes the whole anchoring plan.",
    demand:
      "March through May is the peak before extreme heat sets in, then demand returns in September. Monsoon season from July brings dust storms that can close an afternoon at short notice.",
    permits:
      "Arizona State Parks covers state sites, and Phoenix, Tucson, Scottsdale, Tempe, Mesa and Gilbert each administer their own park rules.",
    dry: "A dry bounce house indoors is the sane choice through the worst of an Arizona July, and they book steadily right through the winter when the weather is at its best.",
  },

  arkansas: {
    season: "May through September",
    climate:
      "Arkansas summers are hot and humid enough to make water the default from Memorial Day, though the season closes noticeably earlier than the Gulf states. Spring is unsettled, with severe-storm risk that makes a fallback date worth agreeing in advance.",
    ground:
      "Ground stakes well across most of the state. The Ozarks in the north are genuinely hilly and a level run long enough for a big slide is the exception rather than the rule.",
    demand:
      "June is the busiest month around end-of-school events, with October busy for fall festivals.",
    permits:
      "Arkansas State Parks handles state sites; Little Rock and Fayetteville parks departments run their own reservations.",
    dry: "Dry units carry the shoulder months here, indoors in church halls and school gyms when it is too cool to get wet.",
  },

  california: {
    season: "April through October",
    climate:
      "California is really several climates, and which one you are in decides the season. Inland valleys are reliably hot from April to October, while coastal neighbourhoods run cooler by a wide margin — a slide that feels perfect in Sacramento can feel cold in San Francisco on the same afternoon. Rain almost never disrupts a summer booking.",
    ground:
      "Hillside lots are the main constraint across much of the state, and a slide needs a genuinely level run that many California yards simply do not have. Street access and parking for the delivery vehicle is a real planning factor in dense neighbourhoods.",
    demand:
      "Steady from spring through autumn without a dramatic peak, though graduation weekends in May and June are the tightest dates of the year.",
    permits:
      "California State Parks covers state sites, and city and county parks departments run separate permit systems that usually require insurance documentation in advance.",
    dry: "The mild winters mean dry bounce houses stay bookable year-round through most of the state, which is not true of anywhere further north.",
  },

  colorado: {
    season: "June through early September",
    climate:
      "Colorado has a short, bright wet season and a large day-to-night temperature swing — afternoons warm enough for water routinely give way to evenings that are not. Altitude makes the sun harsher than the air temperature suggests, so shade matters more than the thermometer implies.",
    ground:
      "Ground is often rocky and shallow over the Front Range, so ballast is common where a stake will not seat. Foothill lots frequently lack a level run.",
    demand:
      "June and July are the whole season. Afternoon thunderstorms build over the mountains most summer days and can close a booking quickly.",
    permits:
      "Colorado Parks and Wildlife handles state sites; Denver, Colorado Springs and Boulder parks departments run their own.",
    dry: "Dry bounce houses extend the year here considerably, and indoor bookings carry the long Colorado winter.",
  },

  connecticut: {
    season: "Mid-June through August",
    climate:
      "Connecticut gets a compact but genuinely humid summer, hot enough for water from late June through August. Either side of that, a dry setup is the more reliable choice, and coastal areas stay cooler than the inland river valley.",
    ground:
      "Glacial soil with stone near the surface is common, so a stake can hit rock without warning and ballast is a frequent fallback. Mature tree cover means overhead clearance needs checking for tall units.",
    demand:
      "The season is short enough that late June through early August weekends fill first, driven by end-of-school parties.",
    permits:
      "Connecticut DEEP manages state parks; town parks and recreation departments handle local sites and often ask for a certificate of insurance.",
    dry: "Dry units are the year-round workhorse in Connecticut, running indoors through a long off-season when nothing wet will sell.",
  },

  delaware: {
    season: "Late May through September",
    climate:
      "Delaware's summer is humid and reliably warm, with a season that runs a little longer than its northern neighbours thanks to the Atlantic. Coastal breezes near the beaches are a genuine scheduling factor — wind closes an inflatable well before rain does.",
    ground:
      "Sandy soil across much of the state stakes easily and drains fast. Sites nearer the shore are exposed and may need repositioning away from the open wind line.",
    demand:
      "June and July are peak, and beach-area weekends are tight right through the summer.",
    permits:
      "Delaware State Parks handles state sites; Wilmington and Dover parks departments run their own reservations.",
    dry: "Dry bounce houses cover the off-season indoors, and they are the usual choice for spring and autumn dates when the water is not worth it.",
  },

  florida: {
    season: "Year-round, peaking March through November",
    climate:
      "Florida is one of the few states where a wet slide genuinely works twelve months a year. The constraint is not cold but the daily summer storm cycle: from June to September a downpour arrives most afternoons at roughly the same time and clears within the hour, so morning bookings almost always beat it. Hurricane season from June to November means forecasts get watched closely.",
    ground:
      "Sandy soil takes stakes easily and drains fast, which is close to ideal. Watch for irrigation lines in newer subdivisions — they sit shallow here and need flagging before anchoring.",
    demand:
      "Demand is flatter than in seasonal states, but spring break in March and the run-up to Easter are the tightest weeks, along with the October fall-festival stretch.",
    permits:
      "Florida State Parks covers state sites, and county and city parks departments issue their own permits — several venues require a certificate of insurance naming them.",
    dry: "Bounce houses run year-round here too, and they are the standard pick for indoor birthdays and for the wettest weeks of the summer storm season.",
  },

  georgia: {
    season: "May through September",
    climate:
      "Georgia's summer humidity makes water rentals popular from late spring, though the season is shorter at both ends than the Gulf states. Pop-up thunderstorms are frequent in July and August and tend to arrive in the late afternoon.",
    ground:
      "Georgia red clay stakes well but turns slick when wet, and much of the north of the state is genuinely hilly — a level pad is the exception rather than the rule in older intown neighbourhoods. Tree cover is heavy, so overhead clearance needs checking for tall units.",
    demand:
      "Late May through June is peak for school events and graduations, with October busy for church and school fall festivals.",
    permits:
      "Georgia State Parks handles state sites, and Atlanta plus surrounding counties including DeKalb, Cobb and Gwinnett each run their own.",
    dry: "Dry bounce houses carry the Georgia shoulder seasons, indoors through the cooler months when a wet slide would not sell.",
  },

  hawaii: {
    season: "Year-round",
    climate:
      "Hawaii has no off-season — a slide works in January. The real variables are trade winds and the difference between windward and leeward sides of an island, where one can be showery while the other stays dry all afternoon.",
    ground:
      "Volcanic soil and thin ground over rock are both common, so ballast is frequently the right call rather than stakes. Access on narrow residential roads is a genuine planning factor.",
    demand:
      "Demand is steady all year, with school holidays and graduation season the tightest stretches.",
    permits:
      "Hawaii State Parks handles state sites; county parks departments on each island run their own permits.",
    dry: "Dry bounce houses are just as viable year-round here, and they are the usual pick for windward sites where showers are frequent.",
  },

  idaho: {
    season: "Mid-June through early September",
    climate:
      "Idaho's wet season is short and concentrated in high summer, with hot, dry afternoons and evenings that cool quickly. The dryness means water evaporates fast and a long party needs topping up.",
    ground:
      "Ground is often rocky, particularly in the north and along the mountain valleys, so ballast is a frequent fallback where a stake will not seat.",
    demand:
      "July is the whole season in most of the state. Book early because the window is narrow.",
    permits:
      "Idaho Department of Parks and Recreation covers state sites; Boise Parks and Recreation runs city permits.",
    dry: "Dry units extend the Idaho calendar significantly, running indoors through a long winter.",
  },

  illinois: {
    season: "June through early September",
    climate:
      "Illinois summers are hot and humid enough to make water the default from June, though the season closes firmly by mid-September. Severe storms are a real risk through the spring and early summer, and wind is what actually stops an inflatable.",
    ground:
      "Ground stakes well across most of the state. Chicago-area lots are frequently narrow with tight side access — measure the gate rather than the yard before booking a large unit.",
    demand:
      "June and July are peak, driven by end-of-school parties and neighbourhood events, with October busy for fall festivals.",
    permits:
      "Illinois DNR manages state parks; the Chicago Park District and suburban park districts run their own permits and often require insurance.",
    dry: "Dry bounce houses run indoors right through the Illinois winter, which is most of the year — they are the steadier half of the business here.",
  },

  indiana: {
    season: "June through early September",
    climate:
      "Indiana gets a warm, humid summer that supports water rentals from June through August, with a firm close in September. Spring storms make a fallback date worth agreeing for early-season events.",
    ground:
      "Ground generally stakes well. Older neighbourhoods have mature tree cover, so overhead clearance matters for tall units.",
    demand:
      "June is the busiest month around end-of-school events, with a solid October fall-festival run.",
    permits:
      "Indiana DNR handles state parks; Indianapolis Parks and Recreation runs city permits.",
    dry: "Dry units carry the long Indiana off-season indoors, in gyms and church halls.",
  },

  iowa: {
    season: "June through August",
    climate:
      "Iowa's wet season is short and firmly midsummer. Humidity makes July genuinely hot, but the shoulder months are unreliable and severe-storm risk is real through the spring.",
    ground:
      "Ground is deep and stakes well across most of the state. Open rural sites have no windbreak, and a sustained wind will close a unit on an otherwise clear day.",
    demand:
      "June and July are the season. County fair season is a busy stretch for larger units.",
    permits:
      "Iowa DNR covers state parks; Des Moines Parks and Recreation runs city permits.",
    dry: "Dry bounce houses are the year-round option, and indoor bookings carry the winter entirely.",
  },

  kansas: {
    season: "Late May through September",
    climate:
      "Kansas summers are hot and dry enough to make a wet slide very effective, but spring brings serious wind and severe-storm risk. Wind is the single biggest cause of a rescheduled inflatable across the state.",
    ground:
      "Ground stakes well in most of Kansas. The dominant planning factor is exposure — open yards with no windbreak are the norm, and sustained wind closes a unit regardless of the sky.",
    demand:
      "June and July are peak. Spring bookings carry genuine weather risk and a fallback date is worth agreeing up front.",
    permits:
      "Kansas Department of Wildlife and Parks handles state sites; Wichita and Kansas City-area parks departments run their own.",
    dry: "Dry units book through the shoulder seasons indoors, and they are the safer choice on a windy spring date.",
  },

  kentucky: {
    season: "Late May through September",
    climate:
      "Kentucky's summer is warm and humid, supporting water rentals from late May into September. Afternoon storms are common in midsummer and spring is unsettled.",
    ground:
      "Ground stakes well, though the state is genuinely hilly outside the Bluegrass and a level run long enough for a large slide is not a given.",
    demand:
      "Late May and June book hardest for school events; October fall festivals are the second peak.",
    permits:
      "Kentucky State Parks covers state sites; Louisville and Lexington parks departments run their own permits.",
    dry: "Dry bounce houses carry the cooler half of the Kentucky year indoors.",
  },

  louisiana: {
    season: "March through October",
    climate:
      "Louisiana has one of the longest wet seasons in the country and humidity that makes water genuinely necessary rather than optional. The flip side is real hurricane-season awareness from June through November, and frequent short, heavy downpours through the summer.",
    ground:
      "The water table sits high and ground stays soft, so anchoring is straightforward but standing water after rain is common — the highest flat point in a yard is usually the right spot. Narrow lots and tight street parking affect access more than the yard itself does.",
    demand:
      "Spring is exceptionally busy — Mardi Gras through Easter and then crawfish-season weekends fill fast. Late summer slows as heat and storm risk peak.",
    permits:
      "Louisiana State Parks handles state sites; New Orleans Parks and Parkways, the City Park Conservancy and Jefferson Parish each run separate processes.",
    dry: "Dry bounce houses fill the deep-summer lull when the heat and storms make wet setups awkward, and they run indoors year-round.",
  },

  maine: {
    season: "Late June through August",
    climate:
      "Maine has one of the shortest wet-rental windows on the mainland — genuinely warm weather arrives late and leaves early, and even July evenings cool off fast. The coast runs cooler than inland by a noticeable margin.",
    ground:
      "Glacial soil with stone near the surface is normal, so stakes hit rock without warning and ballast is a routine fallback. Heavy tree cover means overhead clearance needs checking.",
    demand:
      "July is effectively the whole season, and those weekends go first.",
    permits:
      "Maine Bureau of Parks and Lands handles state sites; Portland Parks and Recreation runs city permits.",
    dry: "Dry units are the practical answer for most of the Maine calendar, indoors through a long off-season.",
  },

  maryland: {
    season: "Late May through September",
    climate:
      "Maryland's summer is humid and reliably hot from late May, with a season that runs later than its northern neighbours. Bay-adjacent sites get real wind, which closes an inflatable well before rain would.",
    ground:
      "Coastal-plain soil in the east stakes easily; the Piedmont to the west has rockier ground where ballast is sometimes needed. Waterfront sites are exposed and may need repositioning.",
    demand:
      "June is the busiest month for school events, with October strong for fall festivals.",
    permits:
      "Maryland Park Service handles state sites; Baltimore and county parks departments run their own permits.",
    dry: "Dry bounce houses carry the Maryland shoulder seasons and the whole winter indoors.",
  },

  massachusetts: {
    season: "Late June through August",
    climate:
      "Massachusetts gets a compact, humid summer — hot enough for water from late June, and closing firmly by early September. The coast and the Cape stay cooler and windier than the interior.",
    ground:
      "Glacial till with stone near the surface is common, so a stake can hit rock and ballast is a frequent fallback. Dense neighbourhoods make vehicle access and parking a real planning factor.",
    demand:
      "July weekends fill first, driven by end-of-school events, and Cape bookings are tight all summer.",
    permits:
      "Massachusetts DCR manages state parks; town parks and recreation departments handle local sites and commonly require a certificate of insurance.",
    dry: "Dry units run indoors through a long Massachusetts off-season, which is where most of the year's bookings actually sit.",
  },

  michigan: {
    season: "Mid-June through August",
    climate:
      "Michigan's wet season is short and firmly midsummer, though lake effect keeps shoreline areas cooler and breezier than inland. July is the reliable month; either side of it a dry setup is the safer choice.",
    ground:
      "Sandy soil in much of the Lower Peninsula stakes well and drains fast. Lakefront sites are exposed, and wind off the water is the usual reason a setup gets repositioned.",
    demand:
      "July is peak, with lakeside and cottage bookings tight across the whole summer.",
    permits:
      "Michigan DNR handles state parks; Detroit and Grand Rapids parks departments run their own permits.",
    dry: "Dry bounce houses carry the long Michigan winter indoors and are the steadier year-round product here.",
  },

  minnesota: {
    season: "Mid-June through August",
    climate:
      "Minnesota has a short, genuinely hot midsummer and a long off-season. July is the dependable month for water; spring and autumn are unreliable enough that a dry setup is usually the better call.",
    ground:
      "Ground stakes well once fully thawed. Lake-adjacent sites are exposed to wind, which closes an inflatable before rain does.",
    demand:
      "The compressed season means July weekends are the whole year and go early.",
    permits:
      "Minnesota DNR manages state parks; Minneapolis and Saint Paul park boards run their own permits.",
    dry: "Dry units are the backbone of the Minnesota calendar, running indoors through a winter that is most of the year.",
  },

  mississippi: {
    season: "April through October",
    climate:
      "Mississippi runs a long, humid season where water is the default from spring well into autumn. Gulf proximity brings hurricane-season awareness from June to November and frequent short, heavy summer downpours.",
    ground:
      "Ground is soft and stakes easily, but low-lying yards hold standing water after heavy rain, so the highest flat point is usually the right spot. Sandy soil nearer the coast drains faster.",
    demand:
      "Late spring books hardest, and October is busy for church and school fall festivals.",
    permits:
      "Mississippi Department of Wildlife, Fisheries and Parks handles state sites; Jackson Parks and Recreation runs city permits.",
    dry: "Dry bounce houses fill the peak-summer lull when heat and storms make a wet setup awkward.",
  },

  missouri: {
    season: "Late May through September",
    climate:
      "Missouri summers are hot and humid enough to make water the default from late May, with a season that closes in September. Spring brings genuine severe-storm and wind risk.",
    ground:
      "Ground stakes well across most of the state. The Ozarks in the south are hilly and a long level run is not a given.",
    demand:
      "June is the busiest month around school events, with October strong for fall festivals.",
    permits:
      "Missouri State Parks handles state sites; Kansas City and St. Louis parks departments run their own.",
    dry: "Dry units carry the Missouri shoulder seasons indoors, and they are the safer choice on an unsettled spring date.",
  },

  montana: {
    season: "Late June through August",
    climate:
      "Montana's wet season is short and concentrated in high summer, with warm, dry afternoons and evenings that cool quickly. The dry air means water evaporates fast over a long party.",
    ground:
      "Ground is frequently rocky and shallow, so ballast is a routine fallback where a stake will not seat. Open sites have no windbreak and wind closes a unit regardless of the sky.",
    demand: "July is effectively the whole season and those weekends go first.",
    permits:
      "Montana State Parks handles state sites; Billings and Missoula parks departments run their own permits.",
    dry: "Dry bounce houses extend the usable year considerably here, running indoors through a long winter.",
  },

  nebraska: {
    season: "June through early September",
    climate:
      "Nebraska summers are hot enough to make a wet slide very effective, but the state is exposed and wind is the dominant scheduling factor. Severe-storm risk runs through the spring and early summer.",
    ground:
      "Ground stakes well. The planning constraint is exposure — open yards with no windbreak are the norm, and sustained wind will close a unit on a clear day.",
    demand:
      "June and July are peak. County fair season is a busy stretch for larger units.",
    permits:
      "Nebraska Game and Parks handles state sites; Omaha and Lincoln parks departments run their own.",
    dry: "Dry units carry the shoulder months and the winter indoors, and they are the safer pick on a windy date.",
  },

  nevada: {
    season: "April through October",
    climate:
      "Nevada heat is dry, which makes a wet slide enormously effective but also means water evaporates fast and the surface needs topping up through a long party. Summer afternoons are brutal, so morning and post-sunset bookings are the norm rather than the exception.",
    ground:
      "Desert hardpan and decorative rock defeat stakes, so ballast is used on almost every job. Compact yards with block walls are common — clearance from the wall matters, and gate width decides which units can physically reach the yard.",
    demand:
      "April, May and September are the sweet spots. Peak summer weekends still book but shift heavily toward evening slots.",
    permits:
      "Nevada State Parks handles state sites; Clark County Parks and the City of Las Vegas both issue their own permits.",
    dry: "Dry bounce houses are the obvious pick for indoor venues through the worst of a Nevada July, and they book well all winter.",
  },

  "new-hampshire": {
    season: "Late June through August",
    climate:
      "New Hampshire's warm season is short and arrives late — genuinely hot weather is a July and early-August affair, and evenings cool quickly even then. The mountains run cooler and shorter than the seacoast.",
    ground:
      "Glacial soil with stone near the surface means a stake can hit rock without warning, and ballast is a routine fallback. Wooded lots need overhead clearance checked for tall units.",
    demand: "July is the season, and those weekends fill first.",
    permits:
      "New Hampshire State Parks handles state sites; Manchester and Nashua parks departments run their own permits.",
    dry: "Dry units are the practical answer for most of the New Hampshire year, indoors through a long off-season.",
  },

  "new-jersey": {
    season: "Late May through September",
    climate:
      "New Jersey gets a properly humid summer that supports water from late May into September, a little longer than its neighbours to the north. Shore towns are windier and cooler than the interior, and wind is what actually closes an inflatable.",
    ground:
      "Coastal-plain sand in the south stakes easily and drains fast; the north is rockier and sometimes needs ballast. Dense neighbourhoods make vehicle access and parking a genuine factor.",
    demand:
      "June is the busiest month for school events, and shore weekends are tight all summer.",
    permits:
      "New Jersey State Park Service handles state sites; municipal recreation departments run local permits and commonly ask for insurance.",
    dry: "Dry bounce houses carry the New Jersey off-season indoors and are the steadier year-round product.",
  },

  "new-mexico": {
    season: "April through October",
    climate:
      "New Mexico is dry-hot at altitude, which makes water very effective and also means it evaporates quickly. The monsoon from July through September brings sharp afternoon storms that can close a booking at short notice, and the sun is harsher than the air temperature suggests.",
    ground:
      "Caliche and rocky ground defeat stakes across much of the state, so ballast is standard. Gravel and xeriscaped yards cannot be staked at all.",
    demand:
      "Spring and early autumn are the comfortable windows, with midsummer bookings shifting to mornings and evenings.",
    permits:
      "New Mexico State Parks handles state sites; Albuquerque and Santa Fe parks departments run their own permits.",
    dry: "Dry units work year-round here and are the standard choice for indoor venues during monsoon afternoons.",
  },

  "new-york": {
    season: "Mid-June through early September",
    climate:
      "New York spans a wide range — New York City and Long Island run warmer and longer than the Adirondacks or the western part of the state. Broadly the wet season is a mid-June to early-September affair, and humidity makes July genuinely hot downstate.",
    ground:
      "Upstate ground is often rocky with stone near the surface, so ballast is a frequent fallback. In the city and its inner suburbs, access is the real constraint: narrow gates, stairs and parking decide what can physically reach a yard.",
    demand:
      "July weekends fill first, driven by end-of-school events, and Long Island bookings are tight all summer.",
    permits:
      "New York State Parks handles state sites; NYC Parks and municipal recreation departments run their own permits, usually requiring insurance in advance.",
    dry: "Dry bounce houses run indoors through a long New York off-season and are the more consistent year-round option.",
  },

  "north-carolina": {
    season: "May through September",
    climate:
      "North Carolina gets a solid but compact wet season — genuinely hot and humid from June through August, with the shoulder months better suited to dry setups. Afternoon storms are common in midsummer, and the coast carries hurricane-season awareness into the autumn.",
    ground:
      "Clay soil holds water and stays soft for a day or two after rain, which affects both anchoring and driving a vehicle across a lawn. Sandy coastal-plain soil in the east drains far faster, and the mountains in the west are steep enough that a level run is not a given.",
    demand:
      "June is the busiest month, driven by end-of-school events, with a strong October fall-festival run.",
    permits:
      "North Carolina State Parks handles state sites; Mecklenburg County and Raleigh parks departments run their own permits.",
    dry: "Dry units carry the North Carolina shoulder seasons, indoors when it is too cool to get wet.",
  },

  "north-dakota": {
    season: "Late June through August",
    climate:
      "North Dakota has a short, hot midsummer and a very long off-season. July is the reliable month for water; either side of it a dry setup is the safer choice, and evenings cool quickly.",
    ground:
      "Ground stakes well once thawed. Exposure is the dominant factor — open prairie sites have no windbreak and sustained wind closes a unit on a clear day.",
    demand:
      "July is effectively the whole season, and those weekends go early.",
    permits:
      "North Dakota Parks and Recreation handles state sites; Fargo and Bismarck parks departments run their own.",
    dry: "Dry bounce houses are the year-round backbone here, running indoors through a winter that dominates the calendar.",
  },

  ohio: {
    season: "June through early September",
    climate:
      "Ohio summers are warm and humid enough for water from June through August, closing firmly in September. Spring is unsettled and severe storms are a real risk into early summer.",
    ground:
      "Ground stakes well across most of the state. Older neighbourhoods have heavy tree cover, so overhead clearance matters for tall units.",
    demand:
      "June is the busiest month for end-of-school events, with October strong for fall festivals.",
    permits:
      "Ohio Department of Natural Resources handles state parks; Columbus, Cleveland and Cincinnati parks departments run their own permits.",
    dry: "Dry units carry the long Ohio off-season indoors, in school gyms and church halls.",
  },

  oklahoma: {
    season: "May through September",
    climate:
      "Oklahoma summers are hot and dry enough to make a wet slide very effective, but spring brings serious wind and severe-storm risk. Wind is the single biggest cause of a rescheduled inflatable here — more so than in almost any other state.",
    ground:
      "Ground stakes well in most of the state. The dominant planning factor is exposure: open yards with no windbreak are common, and a sustained wind will close a unit even on a clear day.",
    demand:
      "June and July are peak. Spring bookings carry genuine weather risk and a fallback date is always worth agreeing.",
    permits:
      "Oklahoma State Parks handles state sites; Oklahoma City and Tulsa parks departments run their own reservations.",
    dry: "Dry bounce houses are the safer choice on an unsettled spring date and carry the shoulder months indoors.",
  },

  oregon: {
    season: "Late June through early September",
    climate:
      "Oregon's usable wet season is short and concentrated in high summer, and it differs sharply across the state — the Willamette Valley and the east run hot and dry in July and August, while the coast stays cool and breezy all year.",
    ground:
      "Ground stakes well in the valley. Coastal and hillside sites are the constraint, with wind on the coast and a shortage of level ground in the hills.",
    demand: "July and August are the season, and those weekends fill first.",
    permits:
      "Oregon Parks and Recreation Department handles state sites; Portland Parks and Recreation runs city permits.",
    dry: "Dry units cover the long wet Oregon off-season indoors, which is where most of the year's bookings sit.",
  },

  pennsylvania: {
    season: "Mid-June through early September",
    climate:
      "Pennsylvania gets a humid summer that supports water from mid-June through August, with the mountains running cooler and shorter than Philadelphia and the southeast. Afternoon storms are common in midsummer.",
    ground:
      "Rocky ground is common outside the southeast, so ballast is a frequent fallback. Older row-house neighbourhoods make access — gate width, stairs, parking — the deciding constraint.",
    demand:
      "June and July are peak for school events, with October busy for fall festivals.",
    permits:
      "Pennsylvania DCNR handles state parks; Philadelphia and Pittsburgh parks departments run their own permits.",
    dry: "Dry bounce houses run indoors through a long Pennsylvania off-season and are the steadier year-round product.",
  },

  "rhode-island": {
    season: "Late June through August",
    climate:
      "Rhode Island has a compact, humid summer — reliably warm from late June through August, and closing early in September. Coastal exposure means wind is a genuine scheduling factor across most of the state.",
    ground:
      "Glacial soil with stone near the surface is common and ballast is a routine fallback. Shoreline sites are exposed and may need repositioning away from the open wind line.",
    demand:
      "July weekends fill first, and coastal bookings are tight all summer.",
    permits:
      "Rhode Island DEM manages state parks; Providence Parks and Recreation runs city permits.",
    dry: "Dry units carry most of the Rhode Island calendar indoors, through a long off-season.",
  },

  "south-carolina": {
    season: "April through October",
    climate:
      "South Carolina's coastal humidity gives a long season, and the Lowcountry stays warm well into October. Coastal wind and afternoon storms are the two scheduling factors, and wind is the one that actually stops a booking.",
    ground:
      "Sandy soil stakes well across most of the state. Sites near the water are exposed, and the high water table means some yards hold standing water after heavy rain.",
    demand:
      "April through June is the strongest run, ahead of peak summer heat and the height of hurricane season.",
    permits:
      "South Carolina State Parks handles state sites; Charleston County Parks and the City of Charleston each issue their own permits.",
    dry: "Dry bounce houses fill the deep-summer heat lull and run indoors through the mild off-season.",
  },

  "south-dakota": {
    season: "Late June through August",
    climate:
      "South Dakota has a short, hot midsummer with a long off-season either side. July is the dependable month for water, and evenings cool off quickly even in high summer.",
    ground:
      "Ground stakes well. Exposure is the dominant constraint — open sites have no windbreak, and sustained wind closes an inflatable on an otherwise clear day.",
    demand:
      "July is effectively the whole season. Sturgis week and county fairs are busy stretches for larger units.",
    permits:
      "South Dakota Game, Fish and Parks handles state sites; Sioux Falls and Rapid City parks departments run their own.",
    dry: "Dry units are the year-round option here and carry the winter entirely indoors.",
  },

  tennessee: {
    season: "May through September",
    climate:
      "Tennessee's summer is hot and humid enough to make water the default from Memorial Day, but the season closes noticeably earlier than the Gulf states. Spring is unsettled and dry setups are the safer choice before May.",
    ground:
      "Middle Tennessee has shallow limestone in places, so staking is not guaranteed and ballast gets used. The east is genuinely hilly and many yards lack a level run long enough for a large slide.",
    demand:
      "Late May and June book hardest for school and church events; October fall festivals are the second peak.",
    permits:
      "Tennessee State Parks handles state sites; Metro Nashville and Memphis parks departments run their own permits.",
    dry: "Dry bounce houses carry the Tennessee shoulder seasons indoors, either side of the wet window.",
  },

  texas: {
    season: "March through October",
    climate:
      "Texas is big enough to be several markets at once: the Gulf coast is humid with a season running from March into late October, while North and West Texas are dry-hot with triple-digit afternoons from late June. Across the state, morning and early-evening bookings are far more comfortable than midday ones in high summer.",
    ground:
      "Clay soil shrinks and cracks in high summer across North Texas, so stakes need depth. Gumbo clay near the coast holds water after a storm, and caliche in the centre and west resists staking altogether, which is where ballast comes in.",
    demand:
      "Spring is front-loaded — April and May weekends book heavily for school events — and October is contested by every church and school fall festival in the state.",
    permits:
      "Texas Parks and Wildlife handles state sites, and Houston, Dallas, Austin and San Antonio parks departments each run their own reservations; suburban HOAs frequently add rules on top.",
    dry: "Dry bounce houses cover the deep-summer heat lull and the mild Texas winter, when an indoor setup is the more comfortable option.",
  },

  utah: {
    season: "Late May through September",
    climate:
      "Utah is dry-hot through the summer, which makes water very effective and also means it evaporates quickly over a long party. Altitude makes the sun harsher than the air temperature suggests, and evenings cool off fast.",
    ground:
      "Rocky and gravelly ground is common along the Wasatch Front, so ballast is a frequent fallback where a stake will not seat. Xeriscaped yards cannot be staked at all.",
    demand:
      "June and July are peak, with Pioneer Day in late July a particularly busy stretch.",
    permits:
      "Utah State Parks handles state sites; Salt Lake City Parks and Public Lands runs city permits.",
    dry: "Dry units extend the Utah year considerably and are the standard indoor option through the winter.",
  },

  vermont: {
    season: "Late June through August",
    climate:
      "Vermont has one of the shortest wet-rental windows in the country. Genuinely warm weather is a July and early-August affair, evenings cool quickly even at the height of summer, and the mountains run shorter and cooler than the Champlain Valley.",
    ground:
      "Glacial soil with stone near the surface means a stake can hit rock without warning, so ballast is a routine fallback. Heavy tree cover on rural lots makes overhead clearance a real check for tall units, and long private drives affect vehicle access.",
    demand:
      "July is effectively the whole season here, so those weekends go first and there is little room to reschedule within the year.",
    permits:
      "Vermont State Parks handles state sites; Burlington Parks, Recreation and Waterfront runs city permits.",
    dry: "Because the wet window is so narrow, dry bounce houses do most of the work in Vermont — indoors in school gyms, church halls and community centres through an off-season that runs most of the year.",
  },

  virginia: {
    season: "Late May through September",
    climate:
      "Virginia's summer is humid and reliably hot from late May into September, with the Tidewater running longer and warmer than the Blue Ridge. Afternoon storms are common in midsummer and coastal areas carry hurricane-season awareness.",
    ground:
      "Coastal-plain soil in the east stakes easily; the Piedmont and mountains to the west are rockier and sometimes need ballast. Waterfront sites are exposed to wind.",
    demand:
      "June is the busiest month for school events, with October strong for fall festivals.",
    permits:
      "Virginia State Parks handles state sites; Virginia Beach, Richmond and Northern Virginia county parks departments run their own permits.",
    dry: "Dry bounce houses carry the Virginia shoulder seasons and the winter indoors.",
  },

  washington: {
    season: "July through early September",
    climate:
      "Washington's usable wet season is short and sharply split by the Cascades — the east runs genuinely hot and dry in July and August, while the Puget Sound side is milder and the coast stays cool and damp for most of the year.",
    ground:
      "Ground stakes well in much of the state. The constraints are wind on the coast, a shortage of level ground on hillside lots, and soft ground after prolonged rain west of the mountains.",
    demand: "July and August are the season, and those weekends fill first.",
    permits:
      "Washington State Parks handles state sites; Seattle Parks and Recreation runs city permits.",
    dry: "Dry units carry the long wet Washington off-season indoors, which is where the majority of the year's bookings sit.",
  },

  "west-virginia": {
    season: "June through early September",
    climate:
      "West Virginia's summer is warm and humid enough for water from June through August, with a firm close in September. The mountains keep evenings cooler than neighbouring states at the same latitude.",
    ground:
      "The state is genuinely mountainous, and a level run long enough for a large slide is the exception rather than the rule — a flat pad is the first thing to confirm. Rocky ground means ballast is a frequent fallback.",
    demand:
      "June is the busiest month for school events, with October busy for fall festivals.",
    permits:
      "West Virginia State Parks handles state sites; Charleston and Huntington parks departments run their own permits.",
    dry: "Dry units carry the West Virginia off-season indoors and suit hillside venues where a wet setup is impractical.",
  },

  wisconsin: {
    season: "Mid-June through August",
    climate:
      "Wisconsin has a short, humid midsummer with a long off-season either side. July is the dependable month for water, and lake effect keeps shoreline areas cooler and breezier than inland.",
    ground:
      "Ground stakes well once fully thawed. Lakefront sites are exposed and wind off the water is the usual reason a setup gets repositioned.",
    demand:
      "July is peak, with lake-country and cottage bookings tight across the whole summer.",
    permits:
      "Wisconsin DNR handles state parks; Milwaukee and Madison parks departments run their own permits.",
    dry: "Dry bounce houses run indoors through the long Wisconsin winter and are the steadier year-round product here.",
  },

  wyoming: {
    season: "Late June through August",
    climate:
      "Wyoming has a short, high-altitude summer — warm, very dry afternoons and evenings that cool quickly, with genuinely usable weather concentrated in July. The dry air means water evaporates fast over a long party.",
    ground:
      "Ground is frequently rocky and shallow, so ballast is standard where a stake will not seat. Wyoming is also one of the windiest states in the country, and sustained wind closes an inflatable regardless of how clear the sky is.",
    demand:
      "July is effectively the whole season, and those weekends go first.",
    permits:
      "Wyoming State Parks handles state sites; Cheyenne and Casper parks departments run their own permits.",
    dry: "Dry units extend a very short Wyoming season considerably, running indoors through a long winter — though wind still governs anything set up outdoors.",
  },

  "washington-dc": {
    season: "Late May through September",
    climate:
      "Washington DC gets a properly humid, hot summer from late May into September, with the urban core running warmer than the surrounding suburbs. Afternoon thunderstorms are frequent in July and August.",
    ground:
      "Space is the defining constraint rather than ground conditions — row-house yards, shared alleys and street parking decide what can physically be delivered, so measuring the gate and the access route matters more here than almost anywhere else. Ground itself generally stakes well.",
    demand:
      "June books hardest around end-of-school events, and embassy, school and community events keep spring and autumn weekends busy.",
    permits:
      "The National Park Service manages much of the parkland in the District, and DC Department of Parks and Recreation handles city sites — both need asking well ahead.",
    dry: "Dry bounce houses suit DC's tight sites and indoor venues, and they carry the shoulder seasons when a wet setup is impractical.",
  },
};

/** True when a state has a hand-written profile. */
export function hasStateProfile(slug: string): boolean {
  return Boolean(STATE_PROFILES[slug]);
}

export function getStateProfile(slug: string): StateProfile | undefined {
  return STATE_PROFILES[slug];
}
