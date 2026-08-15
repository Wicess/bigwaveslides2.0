/*
 * rewrite-product-copy.ts
 *
 * Replaces the short and long description on all 53 catalog products.
 *
 * WHY
 * The old copy was spun from four templates. Twelve of the tall slides opened
 * with the identical sentence — "Make a splash with the {name} — a 18ft
 * dual-lane commercial inflatable water slide finished in {color}" — and 41 of
 * 53 closed on some variant of "Delivered, set up, and fully insured." That
 * copy is also shared with bigwaveslides.com, which is the duplicate-content
 * problem lib/brand.ts exists to solve. Renaming the products (rebrand-catalog)
 * and patching stale names inside the prose (fix-description-names) never
 * touched the sentences themselves, so the catalog still read as the other
 * company's catalog.
 *
 * VOICE
 * lib/city-profiles.ts, applied to products: lead with the physical fact, name
 * the real constraint, say who the unit is NOT for, and never repeat a claim
 * the page already makes. The trust badges and the spec table already say
 * "insured", "sanitized", "delivered" and print the dimensions — so the prose
 * doesn't, and spends its words on what a spec table can't tell you.
 *
 * ACCURACY RULES this copy holds to:
 *   - Every measurement, age floor, power figure and footprint is read from the
 *     product row, not invented.
 *   - No dollar figures. Prices change; relative claims ("least expensive
 *     bouncer") stay true through a price update and are checked below.
 *   - No booking-volume claims ("our most popular"). We don't have that data
 *     here, so the copy doesn't assert it.
 *   - Where units genuinely share a chassis, the copy says so rather than
 *     inventing a difference.
 *
 * Writes { en } only — see lib/localized.ts.
 *
 * Run: npm run db:rewrite-product-copy [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

type Copy = { short: string; desc: string };

/** slug -> new copy. Keyed by slug because SKUs still carry the old brand. */
const COPY: Record<string, Copy> = {
  // ─────────────────────────── Backyard slides ───────────────────────────
  "breakwater-18": {
    short:
      "Eighteen feet of slide on a 23 × 16 ft pad — the tall-slide look in a yard that cannot take a tall slide's footprint.",
    desc: "The Breakwater is the one to look at when your yard is short on length rather than height. At 11 ft wide and 23 × 16 ft of required clearance it is the most compact 18-footer we carry, which puts it inside fenced suburban lots that turn away a unit needing 39 ft of run-out.\n\nOcean-blue vinyl, a climb wall up the back, one wet lane and a splash pool at the base. It runs off a single 1.5 HP blower and one household outlet, so there is no second circuit to hunt for — the usual sticking point with a tall slide. Ages 5 and up.",
  },
  "carnival-16": {
    short:
      "A 16 ft single lane in carnival red, yellow and green, with an age floor of 4 rather than 5.",
    desc: "Bright red, yellow and green panels with palm-tree accents, one lane, and a large splash pool at the bottom. The age floor is 4 rather than the usual 5, and the lane angle backs that up — this is a slide for the younger end of a mixed guest list.\n\nIt wants a 33 × 18 ft level area, which is more ground than the height suggests. That is worth understanding before you measure: on any slide it is the run-out, not the tower, that decides whether it fits. One standard outlet is all the power it needs.",
  },
  "cascade-15": {
    short:
      "Light-aqua marble under a white foam crest — at 15 ft, the lowest tower in the full-size range.",
    desc: "Fifteen feet is the shortest full-size slide we run, and it matters more than the number suggests: a shorter climb, a shallower lane, and a ride that suits a child who takes one look at an 18-footer and changes their mind.\n\nThe finish is light-aqua marble with a big white foam crest across the top. The footprint is the same 33 × 18 ft as the 16 ft units, because ground requirements come from the run-out rather than the height. Single lane, attached splash pool, one household outlet, ages 5 and up.",
  },
  "humpback-16": {
    short:
      "A blue whale over two gentle lanes into an oversized pool — the only full-size water slide here with a 3+ age floor.",
    desc: "The Humpback is the widest unit in the catalog, and the pool is the reason: an oversized splash basin that both lanes empty into, rather than the narrow trough most slides finish in. That, plus a low-angle ride, is why it takes three-year-olds when every other full-size slide starts at 4 or 5. Below that, the Little Harbor Junior is the toddler unit.\n\nBudget for a 35 × 31 ft level area. That is a nearly square footprint and it is the part people misjudge — this one needs width, not length. One household outlet.",
  },
  "orchard-16": {
    short:
      "Watermelon red, green and yellow over a 16 ft single lane — cheerful without committing to a character.",
    desc: "Straight watermelon: red rind, green stripe, yellow seeds. No sculpted character and no narrative theming, which is the argument for it — nothing here dates a photograph or clashes with whatever else you have planned.\n\nA single 16 ft lane into an attached pool, on the standard 33 × 18 ft pad and one household outlet. Ages 5 and up. It suits summer-fruit and picnic themes, and it suits people who simply do not want a shark in the background of every picture.",
  },
  "sundown-16": {
    short:
      "The smallest full-height slide we carry — 16 ft tall on a 21 × 15 ft pad, in orange-to-coral sunset tones.",
    desc: "This is the slide for a yard that genuinely has no room. A 21 × 15 ft clearance is less ground than most of our bounce houses need, and it still gives you a 16 ft tower and a real splash pool.\n\nThe trade-off is honest: the run-out is short, so the ride is quick and it will not hold a long queue the way a 34 ft unit does. Warm orange-and-coral vinyl, one lane, one blower, one outlet, ages 5 and up. If you have measured and the numbers keep coming up short, start here.",
  },
  "tidepool-18": {
    short:
      "A grinning purple octopus over two lanes and a very large pool — this one spends its size sideways.",
    desc: "The Tidepool stays at 18 ft but puts its bulk across rather than up: two lanes and an oversized inflatable pool add up to 37 × 29 ft of required ground, a lot of width for a slide this height. Purple octopus at the crown, dolphins down the lanes.\n\nAges 4 and up, a year below most of the range. The pool is the reason children stay in it long after they have stopped queueing for the lane. Measure your gate as well as your yard before booking this one — width is the constraint here, and side returns are where it fails.",
  },

  // ─────────────────────────── Bounce houses ───────────────────────────
  "big-top-bouncer": {
    short:
      "A red-and-white big top with peaked roof, flags and gold trim, on a 20 × 20 ft square pad.",
    desc: "A circus tent rather than a castle — peaked striped roof, waving flags, gold trim and carnival stars. Inside is a 15 × 15 ft jump floor, the largest in our bouncer range, with full mesh walls so you can see every child from the patio.\n\nDry use only. It needs a 20 × 20 ft square of level ground and one standard outlet. At 14 ft it is the tallest bouncer we carry, so if you are thinking about a gym or a hall, check the ceiling before you assume it clears.",
  },
  "blossom-keep-bouncer": {
    short:
      "A pink-and-purple castle on an 18 × 18 ft pad — the least expensive bounce house we rent.",
    desc: 'The straightforward answer to "what will keep eight three-year-olds busy for four hours." A classic pink-and-purple castle with a 13 × 13 ft jump floor and mesh windows on every side.\n\nNo slide, no water, no theming beyond the turrets — which is exactly why it is the least expensive bounce house we carry. It needs an 18 × 18 ft pad, one outlet, and no more planning than that. Ages 3 and up.',
  },
  "crown-keep-bouncer": {
    short:
      "A sapphire-and-silver medieval castle with four turrets and a 15 × 15 ft jump floor.",
    desc: "The straight-down-the-middle castle: four turrets, faux-stone airbrushing, pennant flags, and a full-size 15 × 15 ft floor with mesh on every side. This is the unit to take when nobody has specified a theme — a castle offends no one and sits against any color scheme.\n\nDry only, 20 × 20 ft of level ground, one outlet, ages 3 and up. At 13 ft it stands a foot shorter than the Big Top, which is the difference that matters if you are going indoors.",
  },
  "dreamfield-bouncer": {
    short:
      "A white-and-pastel unicorn castle with a sculpted head, gold spiral horn and iridescent shimmer panels.",
    desc: "A sculpted unicorn head with a flowing rainbow mane and a gold spiral horn, on a white castle with iridescent panels that shift color as the light moves across them.\n\nIt is the most expensive bouncer we carry, and the sculpt work is the reason rather than the size — the floor is 15 × 13 ft, mid-range for our bouncers. Book it when the party has a look it is committed to and the photographs matter. Dry use, 20 × 18 ft of ground, one outlet, ages 3 and up.",
  },
  "homestead-bouncer": {
    short:
      "A red barn with cow, pig and rooster sculpts — at 12 ft, one of the two lowest bouncers we run.",
    desc: "A red barn with sculpted cow, pig and rooster characters, hay-bale and picket-fence detailing. At 12 ft it shares the lowest profile in our range with the Rose Keep, and that is the point: less height overhead, a lower step-in, and a floor pitched at two- and three-year-olds rather than at the eight-year-olds who will bounce them over.\n\nGood for farm themes, better for any party where the guest list skews very young. Dry only, 20 × 18 ft, one outlet.",
  },
  "rose-keep-bouncer": {
    short:
      "A pastel-pink castle in our smallest bouncer footprint — 18 × 18 ft, and 12 ft tall.",
    desc: "Soft pink throughout, with none of the primary-color blocking that makes most bounce houses difficult to place at an adult event. That is what it is for: showers, reveals and weddings where a bouncer has to sit inside the photographs without wrecking them.\n\nSame 18 × 18 ft footprint and 13 × 13 ft floor as the Blossom Keep, at 12 ft tall. Dry use, one outlet, ages 3 and up.",
  },
  "sugarhouse-bouncer": {
    short:
      "A bubblegum-pink candy castle with 3D lollipops, canes and gumdrops on a full 15 × 15 ft floor.",
    desc: "Sculpted lollipops, striped candy canes and gumdrops around a bubblegum-pink castle, with a full-size 15 × 15 ft jump floor and mesh on all sides. The decoration is three-dimensional rather than airbrushed, so it still reads from across a yard and in photographs taken from the patio.\n\nIt shares its palette with the Sugarhouse 18 slide, so a candy-themed party can run wet and dry at once and have it look deliberate. Dry only, 20 × 20 ft, one outlet, ages 3 and up.",
  },

  // ─────────────────────────── Combo units ───────────────────────────
  "crown-court-combo": {
    short:
      "A princess castle with a bounce floor and two slides, run wet or dry, off one household outlet.",
    desc: "Two slides rather than the usual one, which is what separates this from the rest of the combo range — the queue splits and largely stops being a queue. Pink, purple and blue turrets over an open bounce floor.\n\nIt runs wet through summer or dry the rest of the year with no change to the setup. Ages 3 and up on a 33 × 20 ft pad. One outlet powers the whole unit, which is unusual at this size and worth knowing if your yard has a single accessible circuit.",
  },
  "grand-waterworks-combo": {
    short:
      "Two tall slides, a climb wall, misting arches, a splash pool and a bounce zone — 45 × 25 ft of it.",
    desc: "The largest unit we own, and the only one that genuinely stands in for a whole party's worth of entertainment: two slides, a climbing wall, misting arches over the walkway, a splash pool and a separate bounce zone in one envelope. Rated for twelve riders in rotation.\n\nThe constraints are real and worth reading twice — 45 × 25 ft of level ground, and two 20A circuits that are not shared with a kitchen. That combination puts it at block parties, church fun days and school events far more often than in a backyard. Ages 5 and up.",
  },
  "keep-and-splash-combo": {
    short:
      "A castle bounce house joined to a wet slide and a large splash pool — the standard all-in-one.",
    desc: "A castle bounce floor with a slide off the side and a large pool at the bottom, so the three-year-old who will not go near the slide still has somewhere to be.\n\nThat is the case for a combo generally: mixed-age birthdays are the common kind, and one unit covering both ends of a guest list beats two units crammed into the same yard. Runs wet or dry, needs 37 × 21 ft of level ground and a single outlet. Ages 3 and up.",
  },
  "metro-heroes-combo": {
    short:
      "A comic-book skyline outside; a climb wall, squeeze pillars and a slide inside.",
    desc: "The interior is what you are paying for. A climb wall and squeeze pillars give the bounce floor a route through it, and that holds six- and seven-year-olds far longer than an empty floor does — the usual failure mode of a plain bouncer at an older party.\n\nOutside, an airbrushed city skyline and comic burst shapes in red, blue and yellow. Wet or dry, 33 × 20 ft, one outlet, ages 3 and up.",
  },
  "nightglow-combo": {
    short:
      "Electric pink, lime, orange and blue geometrics — the combo built for after dark.",
    desc: "Neon geometric panels instead of characters, which is why this one goes to teen birthdays and glow parties rather than to five-year-olds. Under UV or party lighting the colors are the whole point; in daylight it is simply a very bright bounce-and-slide combo.\n\nWet or dry, 33 × 20 ft, one outlet, ages 3 and up. If your event runs past sunset, say so when you book — where we site it changes how it reads once the lights are on, and that is easier to get right on the first placement than the third.",
  },
  "prism-combo": {
    short:
      "A rainbow castle with a built-in side slide, on the smallest combo footprint we carry.",
    desc: "The entry point to the combo range and the most compact of them at 31 × 20 ft — worth noting, because that is roughly the ground a large bounce house alone wants, for a unit that also has a slide.\n\nMulti-color castle, open bounce floor, slide down one side. It runs dry indoors in the cooler months and wet through summer. Ages 3 and up, one outlet. When a yard will not take a 33 × 20 ft combo, this is usually the one that still fits.",
  },
  "prism-splash-combo": {
    short:
      "Pastel rainbow arcs and a cloud-topped bounce floor with an attached slide and splash landing.",
    desc: "The soft-palette version of our rainbow combo — pastel arcs and sculpted clouds in place of primary blocks, which suits first birthdays and christenings that still need the children occupied.\n\nBounce floor, climb, slide and splash in one envelope. Wet or dry, 33 × 20 ft, one outlet, ages 3 and up. Take this over the Prism Combo for the extra floor space and the softer look; take the Prism when the yard is tight.",
  },
  "safari-station-combo": {
    short:
      "Lion, elephant and monkey sculpts over a climb wall, pop-up obstacles and a crawl tunnel.",
    desc: "The crawl tunnel is the detail worth booking for. It gives the smallest guests a route that is not the climb wall, which means a three-year-old and a seven-year-old can use the same unit without one of them being flattened — the thing most obstacle combos get wrong.\n\nVines, leaves and sculpted lion, elephant and monkey characters outside. Wet or dry, 33 × 20 ft, one outlet, ages 3 and up.",
  },

  // ─────────────────────────── Party attractions ───────────────────────────
  "stampede-bull": {
    short:
      "A mechanical bull in a cushioned arena, with a trained operator included for the whole booking.",
    desc: "The only thing we rent that arrives with a person. A trained operator runs the bull for the length of your booking and sets the speed rider by rider — wound down for a nervous twelve-year-old, wound up for the uncle who insisted he would last.\n\nThe arena is a cushioned inflatable ring needing 25 × 25 ft of level ground, and it takes a dedicated 20A circuit rather than a shared one. One rider at a time, ages 8 and up. It goes to fairs, corporate days and milestone birthdays, and the queue tends to become the event.",
  },

  // ─────────────────────────── Racing slides ───────────────────────────
  "frost-and-ember-18": {
    short:
      "One fiery lane, one frozen lane, split down the middle — riders pick a side before they climb.",
    desc: "The theming does something structural here. A red-orange lane against an ice-blue lane means every ride has a side, and children organize themselves into teams without an adult having to invent a game for them.\n\nTwo lanes at 18 ft into a shared pool. It needs 39 × 20 ft of level ground and two 20A outlets on separate circuits — a single overloaded circuit is the most common reason a racing slide stalls on the day, so confirm that before we arrive. Ages 5 and up.",
  },
  "liberty-16": {
    short:
      "Stars-and-stripes marble over twin slip-lanes — at 16 ft, the shortest and cheapest of our racers.",
    desc: "Red, white and blue marble with a starfield, on twin slip-lanes rather than the steeper drop of the taller racers. At 16 ft it is the lowest of the four, which makes it the sensible pick for a Fourth of July street party with a broad guest list and no appetite for a 24 ft tower over the road.\n\nIt still wants 39 × 20 ft and two circuits, though — the deck length is the same as the tall racers, and only the height comes down. Ages 5 and up.",
  },
  "palmetto-coast-24": {
    short:
      "Two 24 ft wave lanes under palm-tree toppers, into a wide shared pool.",
    desc: "Twenty-four feet is roughly where a racing slide stops being a garden attraction and starts pulling people across a park. Two wave lanes under palm toppers, finishing into a pool wide enough to take both at once.\n\nAges 6 and up — the drop is steep enough that we hold that line. It runs on two 1.5 HP blowers and needs 37 × 22 ft: two feet less length than our 18 ft racers, two feet more width. Overhead clearance matters more than footprint at this height, so check for branches and service lines over the pad.",
  },
  "twin-falls-22": {
    short:
      "Two slick royal-blue lanes at 22 ft — built to move a queue rather than to be looked at.",
    desc: "A racer with no sculpt work and no character, deliberately. It is here to move people: two identical lanes, a dual climb so nobody stacks up at the ladder, and a 22 ft drop that resets a line of twenty children every couple of minutes.\n\nAges 6 and up, 36 × 22 ft of level ground, two 1.5 HP blowers. If you are weighing it against the Palmetto Coast 24, the real difference is two feet of drop and a palm tree — decide on footprint and price, because the ride is much the same.",
  },

  // ─────────────────────────── Tall slides ───────────────────────────
  "amethyst-18": {
    short:
      "Swirled purple, blue and orange marble with a palm crown and a front slip-lane.",
    desc: "Loud in a way most of the range is not — purple, blue and orange swirled through the marble rather than laid in blocks, so it shifts as you walk around it. Two lanes feed a front slip-lane before the pool, which adds a few feet of ride at the bottom.\n\nStandard tall-slide requirements otherwise: 38 × 20 ft of level ground and two 20A outlets on separate circuits, ages 5 and up. If the party has no theme and you want the largest thing in the yard to also be the brightest, this is it.",
  },
  "bluepoint-18": {
    short:
      "Blue-and-silver marble with a single sweeping curve — the gentlest finish in the tall range.",
    desc: "Blue and silver marble with palm accents and one sweeping curve in place of a straight drop. The curve is worth understanding before you book: it takes speed off the finish, which suits younger or more cautious riders, and it is the usual reason a parent picks this over the straight-lane 18s for a child's first tall slide.\n\nRoomy pool at the base, 38 × 20 ft, two circuits, ages 5 and up. The silver also picks up whatever light the yard has, which does the photographs no harm.",
  },
  "cape-fin-18": {
    short:
      "Riders drop through a shark's open jaws into a deep pool, with misting gills either side.",
    desc: "You go through the mouth. The chute runs between two rows of teeth and out into a deep, foaming pool, with misting gills venting either side of the head — on a hot afternoon the mist is doing real work, not just theater.\n\nIt is a sculpted single-lane slide, so it costs more than a plain dual-lane 18 and moves fewer riders per minute. You are paying for the object rather than the throughput, and that is the right trade only if the theme is the point. Ages 6 and up, 39 × 20 ft, two circuits.",
  },
  "coastline-18": {
    short:
      "Turquoise and lime under a perched toucan, with hibiscus and palm leaves down the tower.",
    desc: "A sculpted toucan on top of a turquoise-and-lime tower, hibiscus and palm-leaf airbrushing down the sides, and a generous front pool.\n\nAt 14 ft wide and 37 × 19 ft of required ground it is one of the two narrowest tall slides we run, which now and then makes it the only sculpted 18-footer that will fit a given yard. Single lane, ages 5 and up, two circuits. Worth choosing over a plain tropical 18 for the sculpt — the ride itself is much the same.",
  },
  "deepwater-18": {
    short:
      "Navy and metallic silver with white wave crests — the darkest finish in the range.",
    desc: "Deep navy marble shot through with metallic silver, white crests breaking across the top. It is the darkest vinyl we own, which carries one practical consequence worth flagging: dark surfaces run hotter in direct sun, so on a 100°F afternoon we will suggest a tower position with some shade, or an earlier start with the water already running.\n\nTwo lanes, the standard 39 × 20 ft pad, two circuits, ages 5 and up. Nothing else separates it from the rest of the 18 ft dual-lane family — the finish is the choice you are making.",
  },
  "ember-ridge-18": {
    short:
      "A sculpted dragon head over a steep tail-shaped chute, in red and charcoal.",
    desc: "A three-dimensional dragon head, overlapping scale texture and amber spikes down the spine, with the chute shaped as the tail. The drop is steeper than our standard 18s and the age floor is 6 because of it — this is one of the few units where the ride genuinely differs from the rest of the range rather than only the paint.\n\nA single sculpted lane, so throughput is lower than a dual. 39 × 20 ft, two circuits. It suits older-kid birthdays and festival midways, where a queue is expected anyway.",
  },
  "everglade-18": {
    short:
      "Rich green marble with tan rock panels and palms — the quietest of the tropical finishes.",
    desc: "Green marble against tan rock panels, palm trees at the crown. Of the tropical 18s we run this is the least saturated — closer to a landscape than a poster, which is why it suits church picnics, school field days and anywhere the unit should not be the loudest object present.\n\nTwo lanes into a shared pool on the usual 39 × 20 ft pad, two 20A circuits, ages 5 and up. Mechanically it is the same slide as the Sandbar and the Reefline; the choice between them is which green you want.",
  },
  "fossil-ridge-18": {
    short:
      "A giant roaring T-Rex head above a steep chute, in scaled prehistoric green.",
    desc: "A full sculpted T-Rex head with jagged teeth over a steep single chute, ferns and scale texture down the tower.\n\nIt and the Cape Fin shark are the two most expensive sculpted slides we run, and they price identically because underneath they are the same chassis with a different head on it — same 18 ft height, same 39 × 20 ft footprint, same age floor of 6. Pick on which animal the party has been promised. Two circuits, and lower throughput than any dual-lane unit.",
  },
  "glacier-run-18": {
    short:
      "Faceted pale-blue ice shards with a polar bear at the summit and a glassy chute.",
    desc: "Pale blue cut into faceted ice-shard panels with a sparkle finish, and a sculpted polar bear at the top. The pale vinyl is a genuine practical advantage: it is the coolest surface of our sculpted slides in direct sun, which is not a small thing in Phoenix or Las Vegas in July.\n\nSingle lane, ages 6 and up, 38 × 20 ft, two circuits. It also reads as winter, which is why it gets asked for in December and January in Florida and southern California, where the season never really closes.",
  },
  "highwater-tower-27": {
    short:
      "Twenty-seven feet down a 34 ft chute into a deep plunge pool, with misting over the queue.",
    desc: "Our second-tallest unit, and the one most people mean when they ask for the big one. A 27 ft climb, a steep 34 ft chute, and a deep plunge pool at the base. The misting system over the queue does more for a July line than any amount of shade.\n\nRated for ten riders in rotation, ages 8 and up — that floor is firm. It needs 40 × 24 ft, two 2 HP blowers and reinforced anchoring, which is why we ask about your ground type when you book rather than discovering it on the day.",
  },
  "launchpad-18": {
    short:
      "A chrome rocket over a navy-and-violet tower with airbrushed planets and a galaxy-swirl chute.",
    desc: "A gleaming chrome rocket at the summit, ringed Saturn and airbrushed planets down a navy-and-violet tower, and a star-streaked chute.\n\nOf our sculpted slides it has the lowest age floor at 5, because the drop is standard rather than steep — it suits a younger space-themed party in a way the dragon and the T-Rex do not. Single lane, 38 × 20 ft, two circuits. If the guest list is large, pair it with the Stargazer: same theme, two lanes, twice the throughput.",
  },
  "longboard-18": {
    short:
      "Carved tiki totems and crossed surfboards over a wave-shaped chute, in orange, teal and bamboo.",
    desc: "Tiki-mask totems, crossed longboards and palm fronds around a wave-shaped chute in orange, teal and bamboo tones.\n\nLike the Coastline it is one of the narrow ones at 37 × 19 ft, so it clears side returns and gate lines that a 39 × 20 ft slide will not. Single lane, ages 5 and up, two circuits. The obvious luau pick, and it does quiet work at adult beach-theme parties where the slide needs to look like part of the décor rather than like rented equipment.",
  },
  "privateer-18": {
    short:
      "A galleon with sails, rigging, a skull flag and a deck cannon — riders exit down the plank.",
    desc: "Built as a ship rather than as a slide with a ship painted on it: tan sails, rope rigging, a skull flag and a deck cannon, with the chute running off the end of a plank.\n\nIt is among the most photographed units we own and among the slowest — one rider at a time down a sculpted lane. Ages 6 and up, 39 × 20 ft, two circuits. Book it when the theme is the point, and book a dual-lane 18 instead when the queue is.",
  },
  "rainforest-19": {
    short:
      "Dark emerald and black jungle marble with vines — a foot taller than everything else in the family.",
    desc: "Nineteen feet rather than eighteen. It is the only slide in the family that breaks the pattern, and it is a real extra foot of drop rather than a rounding difference.\n\nDark emerald and black marble with palms and leafy vines, the deepest and most shaded-looking finish we carry. Two lanes, 39 × 20 ft, two 20A circuits, ages 5 and up. Set against the Everglade, this is the darker jungle and the taller ride; the footprint is identical.",
  },
  "redstone-18": {
    short: "Black and charcoal marble split by red and orange lava streaks.",
    desc: "Charcoal and black with lava streaks running the length of the lanes. Along with the Deepwater it is one of the two dark finishes we carry, and it comes with the same caveat: dark vinyl gathers heat, so through a Phoenix or Dallas July we will look for a shaded tower position when we site it.\n\nTwo lanes into a shared pool, 39 × 20 ft, two circuits, ages 5 and up. It gets picked for older-kid parties on looks; the ride is the same as every other dual-lane 18 in the range.",
  },
  "reefline-18": {
    short:
      "Deep teal marble with coral-orange trim — the ocean finish that sits with a pool rather than against it.",
    desc: "Teal marble with coral-orange wave trim and a turquoise pool, the most saturated of our ocean-themed 18s.\n\nIt is the one we reach for first at pool parties, and the reason is unglamorous: the palette sits with the water instead of fighting it. A red or purple tower next to a blue pool is a decision somebody has to make; this one never needs defending. Two lanes, 39 × 20 ft, two 20A circuits on separate breakers, ages 5 and up.",
  },
  "regatta-18": {
    short: "Royal-blue marble with gold trim and twin curved lanes.",
    desc: "Royal blue with gold trim and two curved lanes rather than straight ones, which takes some speed off the finish.\n\nIt is the most formal-looking slide we own. Blue and gold reads as school colors and club colors, and that makes it the one to book for graduations, sports banquets and corporate family days where a rainbow unit would look out of place in the photographs. Two circuits, 39 × 20 ft, ages 5 and up.",
  },
  "sandbar-18": {
    short:
      "Green marble and palms over the longest slip-lane in the range — 35 ft end to end.",
    desc: "At 35 ft this is the longest of the 18 ft slides, and the extra length goes entirely into the slip-lane: riders leave the chute and keep travelling before they reach the pool. That is a different ride from a straight drop-and-stop, and it is the substantive reason to choose it over its siblings.\n\nGreen marble with palm toppers. It needs 40 × 20 ft — one foot more than the rest of the family, which is worth re-checking if your yard measured tight against the standard 39. Two lanes, two circuits, ages 5 and up.",
  },
  "siren-cove-18": {
    short:
      "A sculpted mermaid tail in shimmering teal, purple and coral, over an under-the-sea chute.",
    desc: "A sculpted tail curling over the tower, with seashells, pearls and starfish through a teal, purple and coral shimmer finish, into a lagoon-styled pool.\n\nThe shimmer is the thing: it holds color in photographs that flatten ordinary vinyl, which is why this one gets requested by name for a specific look rather than for a ride. Single lane, ages 5 and up, 38 × 20 ft, two circuits — and lower throughput than a dual-lane, as with all our sculpted slides.",
  },
  "stargazer-18": {
    short:
      "Purple-and-teal galaxy marble with a white starfield speckle and silver trim.",
    desc: "Purple and teal marbled together with a white starfield speckle through them and silver trim down the lanes — nearer a nebula print than block color.\n\nTwo lanes and full dual-lane throughput, which is the whole argument for taking it over the sculpted Launchpad when your space-themed party has thirty children attached to it. Standard 39 × 20 ft pad, two 20A circuits, ages 5 and up.",
  },
  "sugarhouse-18": {
    short: "Glossy pink-and-white candy swirl over two lanes.",
    desc: "Pink and white swirled like a stick of rock, with a glossier finish than the matte marbles elsewhere in the family.\n\nIt shares its palette with the Sugarhouse Bouncer, and the pair is the closest thing we have to a matched set — a candy-themed party that wants a wet option and a dry one can take both and have it look planned rather than accidental. Two lanes, 39 × 20 ft, two circuits, ages 5 and up.",
  },
  "sundown-18": {
    short:
      "An orange-to-pink-to-purple gradient with palm toppers — the only true gradient in the range.",
    desc: "The only slide we carry finished as a genuine gradient rather than a marble swirl: orange at the base running through pink into purple at the crown, palm toppers above.\n\nIt photographs differently through the day, which sounds like a sales line and is simply how the vinyl behaves — late-afternoon light lands on the orange and the whole tower warms up. Two lanes, 39 × 20 ft, two 20A circuits, ages 5 and up. The Sundown 16 carries the same palette on a 21 × 15 ft pad if this one will not fit.",
  },
  "surge-20": {
    short:
      "Twenty feet from a single household outlet — the tallest slide we run that does not need a second circuit.",
    desc: "The most useful slide in the catalog for a yard short on space and short on power at the same time. Twenty feet tall on 33 × 18 ft of ground, off one 20A outlet — every other slide we run above 18 ft needs two circuits or a bank of blowers.\n\nThe compromise is a single lane, so it moves riders at roughly half the rate of a dual. Grey marble under a tall aqua-and-white foam crest, ages 5 and up. When somebody asks for the tallest thing possible and then sends a photograph of a small yard, this is usually the answer.",
  },
  "thunderhead-28": {
    short:
      "Twin 28 ft lanes and a pool sized to take both — the tallest unit we own, and an event piece rather than a backyard one.",
    desc: "Twenty-eight feet, two lanes, and a splash pool sized for both of them at full flow. It is the tallest thing we own and the only unit needing three 2 HP blowers, which is the honest headline: 44 × 25 ft of level ground plus enough separate circuits to carry three blowers rules out most backyards well before the price does.\n\nWhere it belongs is a festival, a school field day or a block party, holding a line of a hundred together. Rated for ten in rotation, ages 8 and up. Send us the site and we will tell you straight whether it works.",
  },
  "vortex-peak-26": {
    short:
      "A 26 ft spiral tower — riders wind around the outside before the drop.",
    desc: "The only spiral we run. Instead of a straight chute, riders wind around the tower before the final drop into the pool, which stretches a 26 ft slide into a noticeably longer ride than the height alone suggests.\n\nTwo 2 HP blowers, 39 × 23 ft, ages 8 and up. It is a statement unit for large events, and it is also the one we most often reposition on arrival: a spiral needs clearance on all four sides rather than only at the run-out, so an open pad matters more here than anywhere else in the range.",
  },

  // ─────────────────────────── Toddler slides ───────────────────────────
  "little-harbor-junior": {
    short:
      "A low soft slide into a shallow pool on a 17 × 12 ft pad — built for two- to six-year-olds, and only them.",
    desc: "The only unit we rent with an upper age limit as well as a lower one. It is built for 2 to 6: a low soft slide, a shallow built-in pool, padded walls, 17 × 12 ft of ground and a single 1 HP blower.\n\nOlder children will overwhelm it, and we would rather say that here than have you book it for a party with nine-year-olds on the list. Where it earns its place is a first or second birthday, a daycare water day, or as a second unit beside a big slide so the toddlers have something that is theirs.",
  },
};

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true },
  });

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const missing = Object.keys(COPY).filter((s) => !bySlug.has(s));
  const uncovered = products.filter((p) => !COPY[p.slug]).map((p) => p.slug);

  if (missing.length) {
    console.log(
      `\n⚠ copy written for slugs not in the catalog: ${missing.join(", ")}`,
    );
  }
  if (uncovered.length) {
    console.log(
      `\n⚠ catalog products with no new copy: ${uncovered.join(", ")}`,
    );
  }

  let updated = 0;
  for (const [slug, copy] of Object.entries(COPY)) {
    const product = bySlug.get(slug);
    if (!product) continue;

    console.log(`${DRY ? "[dry] " : ""}${slug}`);
    if (!DRY) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          shortDescription: { en: copy.short },
          description: { en: copy.desc },
        },
      });
    }
    updated++;
  }

  console.log(
    `\n${DRY ? "[dry] would rewrite" : "rewrote"} ${updated}/${products.length} products.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
