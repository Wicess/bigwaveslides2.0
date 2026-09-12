/*
 * write-september-posts.ts
 *
 * Rewrites five of the oldest, thinnest posts and publishes five new ones, all
 * illustrated with images the blog already owns.
 *
 * WHY THESE FIVE REFRESHES
 * They were the shortest posts on the blog, all from its first fortnight, and
 * each carried a claim the live data contradicts:
 *   - summer-block-party quoted the Thunderhead 28 at $479/day; it is $500.
 *   - how-much-water said slides recirculate through a pump. They are fed from a
 *     garden hose, and nothing in the catalog has a pump.
 *   - best-age gave the Safari Station Combo a splash pool it does not have.
 *   - are-inflatable-water-slides-safe put the wind limit at 20 mph; the site's
 *     own wind post and FAQ say 15–25 mph.
 *   - water-slide-on-concrete promised hard-surface anchoring "never costs
 *     extra", which nothing in the pricing code states.
 * All five also wore stock photos of permanent concrete water parks — Macau,
 * Abu Dhabi, Atlantic City — on a site that rents inflatables.
 *
 * water-slide-vs-bounce-house was shorter still, but it targets the same query
 * as wet-or-dry-inflatable-guide. Refreshing it would have made two URLs compete
 * for one answer (Bing §6, §17), so it only gets its one false line fixed below.
 *
 * WHY THESE FIVE NEW POSTS
 * Each answers a question nothing on the site covered — checked by searching
 * every published body — and each can be answered from facts the site already
 * holds rather than invented statistics:
 *   - a slide next to a swimming pool (agrees with /water-slides-for/pool-parties)
 *   - what a day under a slide does to a lawn
 *   - inspecting a used commercial unit (uses our real new prices as the yardstick)
 *   - patching a hole (the lifespan post says "patch small damage while it is
 *     small" and never says how)
 *   - what a unit weighs (the eight models that carry a weight in the catalog)
 * The last three fill `ownership` and `buying`, the two thinnest categories.
 *
 * IMAGES
 * Every image is one the blog already had: the unused originals in images/Blogs
 * and covers already in R2. Local originals are re-encoded (same pixels, same
 * dimensions) and uploaded under descriptive, deterministic keys, so a re-run
 * uploads nothing twice. Body images carry their size as a #WxH fragment, which
 * components/blog/article-content.tsx turns into width/height to avoid layout
 * shift. The two posts that had no cover at all get one here too.
 *
 * Nothing is written unless every check passes: meta lengths, category and
 * tags, every internal link against the live catalog and blog, image sizes
 * against the real files, and each find/replace fix matching exactly once.
 *
 * Run: npm run db:write-september-posts [-- --dry]
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { USE_CASES } from "../lib/use-cases";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");
const R2 = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

// ─── Images ─────────────────────────────────────────────────────────────────

type Img = {
  key: string;
  width: number;
  height: number;
  /** Filename prefix in images/Blogs for originals not yet in R2. */
  local?: string;
};

const LOCAL_DIR = path.join(process.cwd(), "images", "Blogs");

const IMG = {
  // Originals from images/Blogs, uploaded by this script.
  childLaughing: {
    key: "blog/child-laughing-on-inflatable-water-slide.jpg",
    local: "Child_mid-slide_laughing_",
    width: 1376,
    height: 768,
  },
  fieldDayQueue: {
    key: "blog/children-queueing-for-water-slide-at-school-field-day.jpg",
    local: "Children_waiting_for_water_slide_",
    width: 1376,
    height: 768,
  },
  foldingSlide: {
    key: "blog/hands-folding-deflated-inflatable-slide.jpg",
    local: "Hands_folding_deflated_water_slide_",
    width: 1376,
    height: 768,
  },
  blowersOnAsphalt: {
    key: "blog/blower-and-power-cables-for-slide-on-asphalt.jpg",
    local: "Industrial_blowers_and_power_cables_",
    width: 1376,
    height: 768,
  },
  slideInBin: {
    key: "blog/inflatable-slide-stored-in-bin-with-blower.jpg",
    local: "Inflatable_slide_in_plastic_bin_",
    width: 1376,
    height: 768,
  },
  slideBesidePool: {
    key: "blog/commercial-inflatable-slide-beside-swimming-pool.jpg",
    local: "Inflatable_water_slide_commercial_",
    width: 1376,
    height: 768,
  },
  runoffOnLawn: {
    key: "blog/water-slide-runoff-on-backyard-lawn.jpg",
    local: "Inflatable_water_slide_in_backyard_202606290458",
    width: 1376,
    height: 768,
  },
  sunsetBackyard: {
    key: "blog/backyard-water-slide-at-sunset.jpg",
    local: "Inflatable_water_slide_in_backyard_202606290520",
    width: 1376,
    height: 768,
  },
  kidsCheering: {
    key: "blog/kids-cheering-at-water-slide-splash-pool.jpg",
    local: "Kids_cheering_on_water_slide_",
    width: 1376,
    height: 768,
  },
  youngOnSmallSlide: {
    key: "blog/young-children-on-small-backyard-slide.jpg",
    local: "Kids_playing_on_water_slide_",
    width: 1376,
    height: 768,
  },
  blockParty: {
    key: "blog/neighborhood-block-party-water-slide.jpg",
    local: "Neighborhood_block_party_",
    width: 1376,
    height: 768,
  },
  parentWatching: {
    key: "blog/parent-supervising-water-slide.jpg",
    local: "Parent_watching_water_slide_",
    width: 1376,
    height: 768,
  },
  seamsAndAnchors: {
    key: "blog/inflatable-slide-seams-blower-tube-and-anchors.jpg",
    local: "Vinyl_seams_of_inflatable_slide_",
    width: 1376,
    height: 768,
  },
  vinylBeading: {
    key: "blog/vinyl-surfaces-with-water-beading.jpg",
    local: "Vinyl_surfaces_showing_water_bea",
    width: 1376,
    height: 768,
  },
  backyardGathering: {
    key: "blog/water-slide-at-backyard-gathering.jpg",
    local: "Water_slide_at_backyard_gathering_",
    width: 1376,
    height: 768,
  },
  girlInSpray: {
    key: "blog/girl-on-water-slide-in-spray.jpg",
    local: "Water_slide_with_water_droplets_",
    width: 1376,
    height: 768,
  },

  // Already in R2 — referenced where they are.
  waterParkAerial: {
    key: "blog/1782479234273-ipwk85-overview-dream-space-water-park-chongqing-china-photo01-2048x1277.jpg",
    width: 2048,
    height: 1277,
  },
  crewLoadingVan: {
    key: "blog/1783881001848-cbqsjh-water-slide-delivery-times-hero.jpg",
    width: 1024,
    height: 1024,
  },
  stakeInGrass: {
    key: "blog/1783881003752-xn2tdw-water-slide-insured-hero.jpg",
    width: 1024,
    height: 1024,
  },
  threeSlides: {
    key: "blog/1784194010565-23dpno-water-slide-size-guide-hero.jpg",
    width: 1024,
    height: 1024,
  },
  crewUnrolling: {
    key: "blog/1784194014436-d286zm-last-minute-water-slide-hero.jpg",
    width: 1024,
    height: 1024,
  },
  cloudySky: {
    key: "blog/1784603838395-3a39su-water-slide-wind-limits-hero.jpg",
    width: 1024,
    height: 1024,
  },
  wipingSurface: {
    key: "blog/1784603842398-42g9mb-water-slide-cleaning-hero.jpg",
    width: 1024,
    height: 1024,
  },
  laneCloseUp: {
    key: "blog/1785464197246-33kcmo-what-affects-water-slide-rental-prices.jpg",
    width: 1024,
    height: 1024,
  },
  drainingOnGrass: {
    key: "blog/1785464199940-ufgkz4-can-you-set-up-a-water-slide-on-grass.jpg",
    width: 1024,
    height: 1024,
  },
  outdoorTap: {
    key: "blog/1786184782241-water-slide-water-source.jpg",
    width: 1024,
    height: 1024,
  },
  vinylLaidFlat: {
    key: "blog/1788914586345-a2zaxx-how-long-does-a-commercial-water-slide-last.jpg",
    width: 1024,
    height: 1024,
  },
  rinsingOnPatio: {
    key: "blog/1782708052329-rosuet-clean-dry-store-inflatable-water-slide.jpg",
    width: 1376,
    height: 768,
  },
  slideByPoolArea: {
    key: "blog/1782708067810-4ohw8z-water-slide-season-state-by-state.jpg",
    width: 1376,
    height: 768,
  },
} satisfies Record<string, Img>;

const imgUrl = (i: Img) => `${R2}/${i.key}`;

/** A captioned body image. Alt describes the photo; the caption earns its place. */
const fig = (i: Img, alt: string, caption: string) =>
  `![${alt}](${imgUrl(i)}#${i.width}x${i.height} "${caption}")`;

// ─── Posts ──────────────────────────────────────────────────────────────────

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  categorySlug: string;
  tagSlugs: string[];
  cover: Img;
  content: string;
};

const REFRESHED: Post[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "best-age-for-inflatable-water-slides",
    title:
      "What Age Are Inflatable Water Slides For? The Age Ratings Explained",
    excerpt:
      "There is a slide for almost every age from two up — just not the same slide. What the age floors on inflatable water slides measure, where ours sit, and how to run a party when the guest list spans all of them.",
    metaTitle: "What Age Are Inflatable Water Slides For?",
    metaDescription:
      "Inflatable water slides suit ages 2 to adult, but each unit has an age floor. What 2–6, 3+, 5+, 6+ and 8+ mean, and how to run a slide for a mixed-age party.",
    categorySlug: "planning",
    tagSlugs: ["planning", "safety", "parties", "tips"],
    cover: IMG.childLaughing,
    content: `**Inflatable water slides work for almost every age from two to adult — but not on the same unit.** Every slide we rent carries an age floor, and across our catalog those floors fall into five bands: 2–6, 3+, 4+ or 5+, 6+, and 8+. The right slide is the one whose floor sits at or below your youngest rider.

Here is what each band means, why the line sits where it does, and what to do when the guest list covers all of them.

## What the age rating on a water slide actually measures

An age floor is not a guess about what a child will enjoy. It stands in for three things that are hard to check at the bottom of a ladder:

- **Can they climb it on their own?** The climb on an 18-foot slide is a steep inflatable wall with handholds. A child who needs lifting up it should not be at the top of it.
- **Can they handle the landing?** Taller slides finish faster. A small child who cannot get their feet under them in a splash pool is in a different situation from an eight-year-old who can.
- **Who will they be sharing it with?** The taller the slide, the older and bigger the crowd it draws — and a collision between a small child and a much bigger one is the hazard every rider rule is written around.

That is why "they're tall for four" is not a reason to put a four-year-old on a slide rated 6+. The rating is about the slide, not about how closely you are watching.

## Ages 2 to 4: small, low, and within arm's reach

At this age you want a slide an adult can reach into from the grass.

Only one unit in our catalog has an upper age limit as well as a lower one: the [Little Harbor Junior](/rent/little-harbor-junior), rated 2 to 6. It is 8 feet tall with padded walls and a shallow splash pool, and it needs a 17 × 12 ft level area.

${fig(IMG.youngOnSmallSlide, "Two young children playing on a small inflatable slide with a ring-shaped splash pool in a backyard", "For two- to four-year-olds, the right slide is one a parent can reach into without climbing anything.")}

Three- and four-year-olds have a few more options:

- The [Humpback 16](/rent/humpback-16) is rated 3+: gentle dual lanes into an oversized pool. It needs a 35 × 31 ft area, so measure the width of the yard, not just its length.
- Seven of our eight combos are rated 3+, including the [Keep & Splash Combo](/rent/keep-and-splash-combo), and the bounce floor gives a child who will not go near the slide somewhere to be.
- The [Carnival 16](/rent/carnival-16) and [Tidepool 18](/rent/tidepool-18) start at 4.

One rule matters more at this age than any other: **a small child can drown in very little water, and a splash pool is water.** Keep an adult standing at the pool edge — not across the yard — whenever toddlers are on the unit. The [CDC's drowning-prevention guidance](https://www.cdc.gov/drowning/) is worth five minutes before any water party.

## Ages 5 to 7: where most water slides start

Five is the most common age floor in our catalog. The [Cascade 15](/rent/cascade-15), [Sundown 16](/rent/sundown-16), [Orchard 16](/rent/orchard-16), [Breakwater 18](/rent/breakwater-18) and [Surge 20](/rent/surge-20) all start there, as does every one of our dual-lane 18-footers.

What changes inside this band is height. A five-year-old who is willing but unsure does better on a 15- or 16-foot slide, where the climb is shorter. The 18- and 20-footers suit a confident seven-year-old.

## Ages 6 and up: steeper chutes and taller racers

A group of slides starts a year later, at 6: the [Cape Fin 18](/rent/cape-fin-18), [Fossil Ridge 18](/rent/fossil-ridge-18), [Ember Ridge 18](/rent/ember-ridge-18), [Privateer 18](/rent/privateer-18) and [Glacier Run 18](/rent/glacier-run-18), plus the [Twin Falls 22](/rent/twin-falls-22) and [Palmetto Coast 24](/rent/palmetto-coast-24) racers.

Fossil Ridge and Ember Ridge have steep thrill chutes, and the 22- and 24-footers are simply taller climbs. The extra year is about the drop.

## Ages 8 and up: the towers

Our three tallest slides start at 8: the [Vortex Peak 26](/rent/vortex-peak-26), [Highwater Tower 27](/rent/highwater-tower-27) and [Thunderhead 28](/rent/thunderhead-28). At 26 to 28 feet the climb is long, the ride is fast, and the crowd is older and heavier. These are the slides teenagers and adults ride — see [can adults use inflatable water slides](/blog/can-adults-use-inflatable-water-slides).

## Age floors across our catalog

| Age floor | Examples | What it usually means |
|---|---|---|
| 2–6 | Little Harbor Junior | Low toddler slide, shallow pool |
| 3+ | Humpback 16, most combos and bounce houses | Gentle lanes or a bounce floor with a short slide |
| 4+ and 5+ | Carnival 16, Cascade 15, Breakwater 18, dual-lane 18s | The standard backyard and tall slides |
| 6+ | Cape Fin 18, Fossil Ridge 18, Twin Falls 22, Palmetto Coast 24 | Steeper chutes and taller racers |
| 8+ | Vortex Peak 26, Highwater Tower 27, Thunderhead 28 | Towers of 26 ft and up |

## How to run a water slide when the ages are mixed

Most parties are not one age. Three things work:

1. **Book to the youngest rider, or book two zones.** If the guest list runs from three to twelve, either choose a 3+ combo everyone can use, or pair a toddler-friendly unit with a taller slide and put them far enough apart that the lines do not merge.
2. **Rotate by size, not by turn order.** Send the small riders as a group, then the big ones. It takes one adult with a clear voice and prevents most of the collisions rider rules exist for.
3. **Keep one adult at the unit for the whole party.** The crew goes over the unit's rider limits with you at setup; somebody has to enforce them for the rest of the day. For a big event, [trained attendants](/services) can run the line.

${fig(IMG.kidsCheering, "Children cheering and splashing at the bottom of an inflatable water slide", "Mixed-age crowds go smoothly when small riders and big riders take their turns as groups.")}

> If a child is under the age floor of the slide you booked, the answer is no — not "just once, while I watch." Close supervision does not change how steep the climb is.

## FAQ

### What is the youngest age for an inflatable water slide?

Two, on a slide built for it — the Little Harbor Junior is rated 2 to 6. Full-size water slides in our catalog start at 3 (Humpback 16), 4, or most commonly 5.

### Can a 4-year-old use a tall water slide?

Only one of our 18-foot slides is rated 4+: the Tidepool 18, with dual splash lanes into a large pool. Our other 18-footers start at 5 or 6.

### Are inflatable water slides OK for teenagers and adults?

Yes, on the right unit. The towers rated 8+ are the ones older riders enjoy most. Follow each slide's rider limits whatever the age.

### What if the ages at my party range from 2 to 12?

Use two zones — a toddler unit and a taller slide — or a 3+ combo plus close supervision, and rotate riders by size. [Tell us the youngest and oldest guest](/contact) and we will suggest the setup.

---

**Related:** [Choosing a birthday slide by age](/blog/best-water-slide-rentals-birthday-party) · [Water slide weight limits](/blog/water-slide-weight-limit) · [Are inflatable water slides safe?](/blog/are-inflatable-water-slides-safe)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "are-inflatable-water-slides-safe",
    title: "Are Inflatable Water Slides Safe? What Every Parent Should Know",
    excerpt:
      "Yes — when the unit is anchored for the ground and the weather, an adult is at the slide, and riders stay within its limits. The hazards are specific and well understood, and each one has a fix you can put in place before the party.",
    metaTitle: "Are Inflatable Water Slides Safe? A Parent's Guide",
    metaDescription:
      "Inflatable water slides are safe when anchored, supervised and used within limits. The real risks, the 15–25 mph wind rule, and what to ask a rental company.",
    categorySlug: "safety",
    tagSlugs: ["safety", "tips", "rentals"],
    cover: IMG.parentWatching,
    content: `**Inflatable water slides are safe when three things hold: the unit is anchored for the ground and the weather, an adult is actively supervising at the slide, and riders stay within its age, size and rider limits.** The hazards that do exist — wind, collisions, water and electricity — are specific and well understood, and each has a fix you can put in place before the first rider climbs.

## The three things that make an inflatable safe

### 1. Anchoring that matches the ground

An inflatable is a large, light structure, and wind is what moves it. Every unit we deliver is anchored at every anchor point: long steel stakes driven at an angle into grass, or sandbags and water ballast on concrete, asphalt and indoor floors. The crew brings the ballast.

${fig(IMG.stakeInGrass, "Gloved hand holding a steel stake at the base of a red inflatable slide on grass", "Every anchor point gets used: a stake on grass, weighted ballast on hard ground.")}

Setup is also when the site gets checked: level ground, clearance from fences, decks, pool edges, power lines and branches, and a blower on a circuit that can carry it. Our [setup and inspection process](/blog/safety-setup-inspection-process) covers it step by step.

### 2. An adult at the slide, not across the yard

Supervision is the one part a rental company cannot do for you — unless you book an attendant. The adult watching should stand at the unit, able to see the climb, the top and the splash pool, and should not also be running the grill.

For large events, our [trained attendants](/services) manage the line and enforce the rules so the host does not have to.

### 3. Riders within the limits

Each slide has an age floor, a rider count and size guidance, and we go over them with you at setup. The limits exist mainly to stop collisions between riders of very different sizes and riders piling up at the top or the landing. See [what age inflatable water slides are for](/blog/best-age-for-inflatable-water-slides) and [weight limits](/blog/water-slide-weight-limit).

## The real risks, and what prevents each

| Risk | What causes it | What prevents it |
|---|---|---|
| Wind | Gusts lifting or shifting the unit | Full anchoring; stop when sustained winds reach 15–25 mph |
| Lightning | A storm nearby | Riders off and blower off at the first thunder |
| Collisions | Too many riders, or small and large riders mixed | Follow the rider count; group riders by size |
| Falls | Climbing the walls, flips, rough play | Enforced rider rules and an adult at the unit |
| Drowning | Young children alone in the splash pool | An adult at the pool edge whenever small children ride |
| Electrical | Cords in standing water, overloaded circuits | Blowers on their own circuits, cords routed away from water |

### Wind: the limit is 15–25 mph

Inflatables come down when sustained winds reach the 15 to 25 mph range, and tall units are more sensitive than short ones. If flags are snapping or light patio items are lifting, stop the slide and wait for it to pass. The detail is in [how windy is too windy](/blog/how-windy-is-too-windy-for-a-water-slide).

${fig(IMG.cloudySky, "Inflatable water slide on a lawn under a heavy, cloudy sky", "A darkening sky is a reason to watch the wind, not a reason to squeeze in the last hour.")}

### Rain and lightning

Light rain on its own is usually fine. Thunder is not: at the first sign of lightning, clear the slide and switch off the blower. The National Weather Service's [lightning safety guidance](https://www.weather.gov/safety/lightning) is the standard to follow, and our [rain and weather policy](/blog/water-slide-rain-weather-policy) covers what happens to your booking.

### Electricity near water

Blowers need power, and water slides put that power near water. Many of our 18-foot slides need two separate 20A circuits. Cords should run where nobody walks and nothing pools. See [do water slide rentals need electricity](/blog/do-water-slide-rentals-need-electricity).

## Rules to give every rider

1. One rider at a time on a single-lane slide; one per lane on a racer.
2. No shoes, glasses, jewelry, or anything in pockets.
3. No flips, no climbing the walls or netting, no wrestling.
4. Clear the landing before the next rider comes down.
5. No food or drinks on the unit.
6. Off the slide straight away when the supervising adult says so.

## What to ask a rental company before you book

- **Are you insured, and can you issue a certificate of insurance?** We can, naming your venue or organization on request.
- **Who sets it up and anchors it, and do they check it before anyone rides?** Our crew does both.
- **Is it cleaned and sanitized between rentals?** Every one of ours is.
- **What are this unit's rider limits?** You should hear actual numbers, not "it's fine."

More in [10 questions to ask before you rent](/blog/questions-to-ask-before-renting-a-water-slide) and [are water slide rentals insured](/blog/are-water-slide-rentals-insured).

## FAQ

### Are inflatable water slides safe for toddlers?

On a unit rated for them, with an adult at the splash pool the whole time. The Little Harbor Junior is built for ages 2 to 6; most full-size slides start at 5.

### What wind speed is too high for an inflatable water slide?

Stop using it when sustained winds reach 15–25 mph — at the lower end of that range for a tall unit.

### Can kids use a water slide without an adult watching?

No. An inflatable should have an adult actively supervising for the whole time it is in use.

### Are commercial rental slides safer than ones bought for home use?

Commercial units are built heavier for constant use, but safety still comes down to anchoring, supervision and limits. See [residential vs commercial water slides](/blog/residential-vs-commercial-water-slide).

Planning an event? [Request a quote](/contact) and tell us the ages and the ground — we will match the slide and bring the right anchoring.`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "water-slide-on-concrete",
    title: "Can You Set Up an Inflatable Water Slide on Concrete?",
    excerpt:
      "Yes — parking lots, school blacktop and driveways all work. What changes is how the slide is held down, what goes underneath it, and where the water goes when it cannot soak in.",
    metaTitle: "Can a Water Slide Go on Concrete? How It's Anchored",
    metaDescription:
      "Inflatable water slides can go on concrete, asphalt and pavers — anchored with sandbags or water ballast instead of stakes. What else changes on hard ground.",
    categorySlug: "guides",
    tagSlugs: ["guides", "safety", "planning", "tips"],
    cover: IMG.blowersOnAsphalt,
    content: `**Yes — an inflatable water slide can be set up on concrete, asphalt, pavers or a driveway.** Stakes cannot go into hard ground, so the slide is held down with sandbags or water ballast instead, and a ground tarp goes underneath to protect the vinyl. School blacktop, church parking lots and community courts are routine setups.

On a hard surface, three things change: how it is anchored, what it sits on, and where the water goes.

## 1. Anchoring: ballast instead of stakes

On grass the crew drives a stake at each anchor point. On concrete or asphalt, each of those points is weighted instead, with sandbags or water barrels rated for the unit. We bring them. What we need from you is the surface, at the time you book, so the truck is loaded with the right anchoring.

The rule itself does not change: **every anchor point is used, every time.** A tall slide catches more wind than a short one, so a 28-foot [Thunderhead 28](/rent/thunderhead-28) is a different anchoring job from a 16-foot [Sundown 16](/rent/sundown-16).

Wind limits are the same on any surface — the slide stops when sustained winds reach 15–25 mph. See [how windy is too windy](/blog/how-windy-is-too-windy-for-a-water-slide).

## 2. What goes under the slide

Concrete and asphalt scuff vinyl every time the unit shifts under riders, and they get hot. A ground tarp between the slide and the surface takes that wear, and our crews lay one on every hard-surface setup.

Before the crew arrives, sweep the area. Gravel, grit and glass are hard on bare feet and on the underside of the unit.

## 3. Where the water goes

This is the part most people do not expect. On grass, splash-out soaks in. On concrete it runs — downhill, to the lowest point, which is often a doorway, a garage, or wherever the cords are.

${fig(IMG.rinsingOnPatio, "Woman rinsing an inflatable water slide with a hose on a paved patio", "On a hard surface nothing soaks in. Check which way the ground falls before you choose the spot.")}

- **Look at the fall of the ground.** Point the splash pool end where runoff heads for a drain or a lawn, not toward the building.
- **Keep power on the uphill side.** Cords and connections should never sit in the runoff path.
- **Expect a slippery apron.** Wet concrete around the splash pool is slick. Keep a dry walkway to the climb and towels at the exit.

## Heat: the problem grass doesn't have

Dark asphalt in full summer sun gets hot enough to hurt bare feet. The slide stays wet while it runs; the ground around it does not. Plan a shaded or wetted walkway, and on the hottest days think about a morning slot — [extreme heat](/blog/water-slide-in-extreme-heat) has more.

## Which slides fit on a hard surface

Surface is rarely what rules a slide out. Space is. A parking lot has room for the 44 × 25 ft area a [Thunderhead 28](/rent/thunderhead-28) needs; most driveways do not.

- **Driveways and small patios:** the [Little Harbor Junior](/rent/little-harbor-junior) needs 17 × 12 ft, the [Sundown 16](/rent/sundown-16) 21 × 15 ft, the [Breakwater 18](/rent/breakwater-18) 23 × 16 ft.
- **Blacktop and parking lots:** the [Twin Falls 22](/rent/twin-falls-22) needs 36 × 22 ft, the [Grand Waterworks Combo](/rent/grand-waterworks-combo) 45 × 25 ft.

Those areas already include room around the unit. Measure the flat part of the space, not the whole lot.

## Where a water slide can't go

- **Gravel, sand and loose ground.** It will not hold stakes, and it gives ballast no stable base.
- **A real slope.** A driveway that drops steeply to the street is a no for the same reason a steep lawn is — see [sloped and uneven yards](/blog/water-slide-on-uneven-ground).
- **Wooden decks, balconies and rooftops.** Once the splash pool fills, the water weighs far more than the slide. See [how much a water slide weighs](/blog/how-much-does-a-commercial-water-slide-weigh).

## FAQ

### Can you put a water slide on a driveway?

Yes, if the driveway is flat enough and long enough for the unit's listed area. It is anchored with sandbags or water ballast.

### Do you need stakes for a water slide on concrete?

No — stakes cannot be used on hard ground. Ballast replaces them at every anchor point.

### Can a water slide go on artificial turf?

Usually. Tell us it is turf when you book so the crew can plan the anchoring.

### Is concrete safe for a water slide?

Yes, with every anchor point ballasted, a ground tarp underneath, a planned runoff path, and a dry walkway to the climb.

Setting up on a lot, a court or a driveway? [Request a quote](/contact) and mention the surface — we will bring the ballast.`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-much-water-does-a-water-slide-use",
    title: "How Much Water Does an Inflatable Water Slide Use?",
    excerpt:
      "A water slide runs off one garden hose, so the honest answer is a measurement you can take yourself — on your water meter or with a bucket. Here is how the slide uses water, how to measure it, and how to turn it into dollars.",
    metaTitle: "How Much Water Does an Inflatable Water Slide Use?",
    metaDescription:
      "An inflatable water slide runs off one garden hose. How it uses water, how to measure it on the meter or with a bucket, and what it adds to your bill.",
    categorySlug: "guides",
    tagSlugs: ["guides", "planning", "tips", "rentals"],
    cover: IMG.girlInSpray,
    content: `**An inflatable water slide uses what one garden hose delivers at the setting it runs on, for as long as it runs, plus the water that fills its splash pool.** The water is not recirculated: the hose feeds a spray line at the top of the slide, the water runs down the lane into the splash pool, and whatever splashes out is replaced from the hose.

So the number depends on two things you control — how far the tap is open and how many hours the slide runs — and you can measure it exactly.

## How a water slide uses water

1. **The hose feeds a spray line** along the top of the slide, which keeps the sliding surface wet so riders move.
2. **The water runs down into the splash pool,** which fills over the early part of the party.
3. **Splash and overflow leave the pool** onto the ground around it, and the hose keeps replacing it.

${fig(IMG.outdoorTap, "Outdoor tap with a green garden hose attached, with an inflatable water slide in the background", "Everything a water slide uses comes through one outdoor tap and one garden hose.")}

That is the whole system. It is also why your [water source](/blog/water-slide-water-source) matters: low pressure from a well, or a very long hose run, changes how well the slide runs.

## Measure your own number

Any figure you read online — ours included — is a guess about somebody else's hose and tap. You can get the real one in two ways.

- **Read the meter.** Note your water meter reading when the hose goes on and again when it goes off. The difference is what the slide used, plus anything else that ran in the house. Meters read in gallons or in cubic feet; one cubic foot is 7.48 gallons.
- **Time a bucket.** Open the tap to about the setting you expect, and time how long a 5-gallon bucket takes to fill. Five gallons in one minute is 5 gallons per minute.

## Turning it into a number: a worked example

These figures are an illustration, not a measurement. Suppose the hose runs at **3 gallons a minute** for a **4-hour** party:

- 3 gallons × 60 minutes = 180 gallons an hour
- 180 gallons × 4 hours = **720 gallons**, plus the fill of the splash pool

To turn that into dollars, look at your bill. Many utilities price water per 1,000 gallons; others price it per CCF — a hundred cubic feet, which is 748 gallons. At 720 gallons you are just under 1 CCF. Many utilities also base the sewer charge on metered water, so check both lines.

## How to use less without a worse slide

- **Ask the crew how low the flow can go.** The lane needs to stay wet, not flooded.
- **Turn the hose off during breaks.** Nobody is sliding during cake, lunch or a wind pause.
- **Stop when the party stops.** A slide left running while guests eat is using water for nobody.
- **Choose the size you need.** A taller slide has a longer lane to keep wet, and big units like the [Thunderhead 28](/rent/thunderhead-28) want good flow.

## Where the water goes afterward

At teardown the splash pool is drained, and the unit is deflated, rolled and taken away.

${fig(IMG.drainingOnGrass, "Water draining from the base of a blue inflatable onto green grass", "When the splash pool is drained, that water goes into the ground beside the slide.")}

On grass that means a soggy patch for a day or so — [will a water slide damage your lawn](/blog/will-a-water-slide-damage-your-lawn) covers what to expect. On concrete it runs, so choose the spot with that in mind; see [water slides on concrete](/blog/water-slide-on-concrete).

## Watering restrictions

Some towns restrict outdoor water use during dry spells, by day of the week or by time of day. If yours does, check whether filling a recreational inflatable counts before the date, not on it.

## FAQ

### Does an inflatable water slide recirculate water?

No. It is fed from a garden hose; water runs into the splash pool, and what splashes out is replaced from the hose.

### Will a water slide raise my water bill a lot?

It depends on your flow, the hours it runs, and your utility's rate. Read your meter before and after, or use the worked example above with your own numbers.

### Can I use pool water instead of the hose?

We do not recommend it — see [well water or pool water](/blog/water-slide-water-source).

### Does a bigger slide use more water?

A taller slide has a longer lane to keep wet. Your tap setting and how long it runs still decide the total.

Ready to book? [Browse water slides](/rent) or [request a quote](/contact) — delivery, setup and pickup included.`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "summer-block-party-water-slide",
    title: "Renting a Water Slide for a Block Party: The Organizer's Guide",
    excerpt:
      "A block party has one organizer, dozens of households and nobody in charge of the slide. How to get it approved, choose where it goes, split the cost per household and put names on the supervision — before the day.",
    metaTitle: "Block Party Water Slide Rental: Planning Guide",
    metaDescription:
      "How to add a water slide to a block party or HOA day: who approves it, where it can go, splitting the cost per household, and when two units beat one big one.",
    categorySlug: "events",
    tagSlugs: ["events", "community", "planning", "parties"],
    cover: IMG.blockParty,
    content: `**A water slide works at a block party when four things are settled before the day: who approves it, where it goes, how the cost is split, and which adults are watching it.** The slide is the easy part — we deliver it, anchor it and pick it up. The organizing decides whether the afternoon runs itself or runs you.

## 1. Get the right approval

Who you ask depends on whose ground the slide sits on:

- **A private lawn or driveway** — start with the homeowner.
- **An HOA common area or clubhouse lawn** — your HOA or management company. Many ask for a certificate of insurance naming the association; we issue those on request.
- **A closed street or a public park** — your city or county. Street closures and park reservations have their own processes and lead times.

Whether a permit is needed turns on whose land it is, and our [permit guide](/blog/do-you-need-a-permit-for-a-water-slide-rental) walks through who to call for each.

## 2. Choose where it goes

A slide needs flat ground, its listed level area, a water tap and power within reach, and a clear path for the crew to bring it in.

- **A front lawn** fits more than people expect: the [Sundown 16](/rent/sundown-16) needs 21 × 15 ft, the [Breakwater 18](/rent/breakwater-18) 23 × 16 ft.
- **A cul-de-sac or closed street** works on sandbags and ballast instead of stakes — see [water slides on concrete](/blog/water-slide-on-concrete). Water on asphalt runs to the curb, so plan where it goes.
- **Common lawns and parks** can take the big units. The [Thunderhead 28](/rent/thunderhead-28) needs 44 × 25 ft and runs three 2 HP blowers.

Pick the host house for its outlets and tap, not for who volunteered first. Many of our larger slides need two 20A circuits that are genuinely separate — not two sockets on one breaker.

## 3. One big slide or two smaller ones?

For a large street, two units in separate zones usually beat one big one. Two lines at half the length move better than one line nobody reaches the front of, and they let you split the ages — little kids at one end of the street, older kids at the other.

${fig(IMG.threeSlides, "Three inflatable water slides set up side by side on a lawn", "Several units spread a crowd out; one tall slide gathers it into a single line.")}

A pairing that works: a [Keep & Splash Combo](/rent/keep-and-splash-combo), rated 3+, for the youngest, and a dual-lane racer like the [Liberty 16](/rent/liberty-16) for everyone else. Racers send two riders down at once.

## 4. Split the cost per household

Our prices are published, so you can do the math before the sign-up sheet goes around. Each unit has one daily rate, and each order carries one flat $30 transport fee covering delivery, setup and pickup.

| Setup (prices as of September 2026) | Daily rate | Transport | Per household, 15 homes | Per household, 30 homes |
|---|---|---|---|---|
| Sundown 16 | $230 | $30 | $17.33 | $8.67 |
| Keep & Splash Combo + Liberty 16 | $300 + $290 | $30 | $41.33 | $20.67 |
| Thunderhead 28 | $500 | $30 | $35.33 | $17.67 |

Collect contributions before you confirm the booking, not after the party.

## 5. Put names on the supervision

At a block party, everyone assumes someone else is watching the slide. Fix that with a rota: named adults, in 30- or 60-minute shifts, one per unit, standing at the unit. The crew briefs whoever is on the first shift at setup.

${fig(IMG.backyardGathering, "Boy sliding down a red, white and blue inflatable water slide at a backyard gathering with adults nearby", "At a party, everyone assumes someone else is watching the slide. A rota with names fixes that.")}

For a large neighborhood, [trained attendants](/services) can run the slides so the organizers get to enjoy the day too.

## When to book

Summer Saturdays go first. Request the date as soon as the street agrees on it, and earlier still if you need an HOA certificate or a street closure — both have their own turnaround. [When to book](/blog/when-to-book-summer-water-slide) has more.

## The organizer's checklist

- Date agreed by the street
- Approval from the homeowner, the HOA or the city
- Host spot chosen for its flat ground, tap and outlets
- Units chosen for the age spread and the size of the street
- Contributions collected per household
- Supervision rota with names on it
- Certificate of insurance requested, with the exact legal name, if the HOA or city needs one

## FAQ

### Do you need HOA approval for a water slide at a block party?

On common area, yes. On a private lawn, check your HOA's rules on inflatables before you book.

### How much does a water slide for a block party cost?

Our toddler slide is $155 a day and full-size backyard slides start at $230, plus one $30 transport fee per order.

### Can a water slide go on the street?

On a closed street, yes, anchored with ballast. Closing the street is a decision for your city.

### How many adults should supervise?

At least one at each unit, for the whole time it runs.

Planning for your street? [Request a quote](/contact) with the expected headcount and the spot, and we will suggest the setup — see also [rentals for HOA and neighborhood events](/water-slides-for/hoa-neighborhood-events).`,
  },
];

const NEW_POSTS: Post[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "inflatable-water-slide-next-to-a-pool",
    title: "Can You Put an Inflatable Water Slide Next to a Pool?",
    excerpt:
      "Next to the pool, yes. Into it, no. An inflatable slide is built to land riders in its own splash pool — and a pool party with a slide has two areas of water to watch instead of one.",
    metaTitle: "Inflatable Water Slide Next to a Pool: Is It Safe?",
    metaDescription:
      "An inflatable water slide can go near a swimming pool, never into one. Why it must land in its own splash pool, how to place it, and how to supervise both.",
    categorySlug: "safety",
    tagSlugs: ["safety", "parties", "planning", "tips"],
    cover: IMG.slideBesidePool,
    content: `**You can set up an inflatable water slide near a swimming pool, but it should never empty into one.** Rental water slides are built to land riders in their own attached splash pool. Aiming a slide into a swimming pool sends riders into water of the wrong depth, past a hard pool edge, from a unit that cannot be anchored the way it was designed to be.

Set up beside the pool, the slide and the pool are two separate attractions — which makes a great party, as long as you place and supervise them as two.

## Why a water slide shouldn't go into a pool

- **The landing isn't designed for it.** An inflatable's splash pool is part of the slide, sized and cushioned for the lane that feeds it. A swimming pool is not: the shallow end is too shallow to arrive in at speed, and the deep end is too deep for a child who cannot swim.
- **The pool edge is hard.** Coping and decking are concrete, stone or tile. A slide positioned to reach over them puts that edge where riders come down.
- **The unit can't be anchored for it.** A slide is anchored on flat ground at every anchor point. One propped at a pool edge cannot be.
- **Nobody can watch both at once.** Riders go from sliding to swimming with no pause in between, so the adult watching the slide is suddenly watching a pool as well.

${fig(IMG.waterParkAerial, "Aerial view of a large water park with slides running into pools", "At a water park, a slide and the pool it lands in are designed together. On an inflatable, the attached splash pool is that design.")}

Our [pool party page](/water-slides-for/pool-parties) says the same thing: most of our slides come with their own splash pool, so they do not need yours.

## How to set up a water slide beside a pool

1. **Point the splash pool away from the swimming pool.** Riders should step out toward the lawn, not toward the pool edge.
2. **Leave a real gap between the two.** Nobody should be able to go from the slide's exit to the pool edge in a couple of steps. Our crew assesses the placement on arrival.
3. **Use the flattest ground available.** A sloped lawn beside the pool is still a slope. On a pool deck, the slide is anchored with ballast instead of stakes — see [water slides on concrete](/blog/water-slide-on-concrete).
4. **Keep power away from both.** The blower's circuit and every cord stay dry and out of walkways. Outdoor outlets near a pool should be GFCI-protected; if you are not sure yours are, ask an electrician before the party.
5. **Plan for runoff.** Overflow from the splash pool makes a pool deck slippery. Keep a dry route between the two areas.
6. **Fill the slide from the hose, not the pool.** See [well water or pool water](/blog/water-slide-water-source).

${fig(IMG.slideByPoolArea, "Children on a tall inflatable water slide with its own splash pool, beside a public pool area", "Beside the pool, not into it: the slide lands in its own splash pool, and the swimming pool stays a separate area.")}

## Supervising a pool and a slide at the same time

Two areas of water need two sets of eyes. The adult watching the slide should not also be responsible for the pool.

- **One adult at the slide,** watching the climb, the top and the splash pool.
- **A separate adult watching the pool** — close, undistracted, off their phone. Some families pass a "water watcher" tag between adults so it is always clear who is on duty.
- **Children who cannot swim stay on the slide side** unless an adult is in the pool with them.
- **Book an attendant for a big party.** Our [trained attendants](/services) can run the slide so the hosts can watch the pool.

The [American Red Cross water safety guidance](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/water-safety.html) is a good read before any pool party.

## Which slides suit a pool party

The point is a slide with a generous splash pool of its own:

- [Coastline 18](/rent/coastline-18) — a slick chute into a big splash pool, suited to pool and backyard parties. Ages 5+.
- [Siren Cove 18](/rent/siren-cove-18) — a lagoon-style splash pool under a sculpted mermaid tail. Ages 5+.
- [Palmetto Coast 24](/rent/palmetto-coast-24) — dual wave lanes into a wide splash pool, for older kids. Ages 6+.
- [Little Harbor Junior](/rent/little-harbor-junior) — a shallow splash pool of their own for ages 2 to 6, still with an adult at the edge.

## FAQ

### Can an inflatable water slide go into an above-ground pool?

No, for the same reasons: the depth is wrong for a landing, and the pool wall is not built to take the load of a slide or a rider.

### How far from a pool should a water slide be?

Far enough that the slide's exit and the pool edge are clearly separate areas, on flat ground, with power kept away from both. The crew sets the exact position on arrival.

### Can we fill the slide with water from the swimming pool?

We do not recommend it. Use a garden hose.

### Do you deliver water slides for pool parties?

Yes — see [water slides for pool parties](/water-slides-for/pool-parties) or [request a quote](/contact).`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "will-a-water-slide-damage-your-lawn",
    title:
      "Will a Water Slide Damage Your Lawn? What to Expect and How to Fix It",
    excerpt:
      "Usually not for long. A day under a water slide leaves flattened grass, a trampled wet strip where riders step out, and a few stake holes. What causes each, how to prep, and what to do the day after.",
    metaTitle: "Will a Water Slide Rental Damage Your Lawn?",
    metaDescription:
      "A water slide leaves flattened grass, a trampled wet strip and small stake holes, and healthy lawns recover. What causes each, how to prep and how to repair.",
    categorySlug: "planning",
    tagSlugs: ["planning", "tips", "rentals"],
    cover: IMG.runoffOnLawn,
    content: `**A water slide rarely does lasting damage to a healthy lawn.** What it leaves is predictable: grass flattened where the unit sat, a trampled, wet strip around the splash pool where riders step out, and small holes where the stakes went in. With a little prep and normal care afterward, a healthy lawn recovers. The damage worth planning for is underground — sprinkler lines and cables in the path of a stake.

## What a day under a water slide does to grass

### The footprint: flattened, and sometimes pale

The slide sits on a ground tarp, and the grass under it goes without light for the length of the rental while carrying the weight of the unit and its riders. After a one-day party, expect flattened blades that stand back up within a day or two.

A lawn covered for longer — a multi-day rental, or a hot, sunny weekend — can come up yellowed. Healthy grass greens up again once it has light and water.

### The splash zone: wet and trampled

This is where most lawn wear happens. Water that splashes out of the pool — and all of it when the pool is drained at teardown — goes into the ground beside the slide, and that is exactly where every rider steps off. Wet soil plus bare feet all afternoon compacts the turf and can churn it to mud, especially on clay soil or a thin lawn.

${fig(IMG.drainingOnGrass, "Water running from the base of a blue inflatable onto green grass", "Everything that leaves the splash pool goes into the ground beside it, which is why that strip takes the most wear.")}

### Stake holes

On grass, the slide is held down with long steel stakes at every anchor point. They leave small holes that most lawns close over on their own.

### What's under the lawn

A stake goes well into the ground, and shallow sprinkler lines, invisible dog-fence wire and low-voltage landscape lighting cable often run just below the surface. Mark them before the crew arrives. If you are not sure where the irrigation runs, ask the company that installed it. For buried utilities, 811 is the free national call-before-you-dig number.

${fig(IMG.stakeInGrass, "Gloved hand holding a steel stake at the base of an inflatable on grass", "Stake holes are small. What a stake can hit below the surface is the part to plan for.")}

## How to prep the lawn

- **Mow a day or two before,** but do not scalp it — grass left at a normal height copes better with weight and foot traffic.
- **Skip watering the day before, and turn sprinklers off on the day.** Soaked ground turns to mud faster and holds stakes poorly.
- **Flag sprinkler heads, lines and cables** where the slide will go.
- **Choose a spot that drains.** If part of the yard stays wet after rain, keep the splash pool away from it.
- **Clear the area** of sticks, stones and pet waste.

The full checklist is in [how to prepare your yard](/blog/how-to-prepare-your-yard-for-a-water-slide-rental).

## What to do the day after

1. **Let the wet strip dry before you walk on it or mow it.** Mowing soggy turf tears it.
2. **Lightly rake the flattened footprint** to lift the blades.
3. **Water as normal** once the soggy area has dried, so the covered grass recovers.
4. **Top stake holes with a little soil** if they have not closed.
5. **Reseed any bare patches** by the splash pool exit, and loosen compacted soil there first.

## When a lawn will struggle

- **New sod or fresh seed.** The roots have not established, and a day of weight and water can set them back. Choose another spot.
- **A lawn already stressed by drought or heat.** Grass that is struggling copes badly with a day of traffic.
- **Heavy clay that stays wet.** Expect mud at the exit, or think about [a hard surface](/blog/water-slide-on-concrete) instead.
- **Long rentals in full sun.** More time covered means more yellowing — see [water slides in extreme heat](/blog/water-slide-in-extreme-heat).

If the lawn matters more than the slide, a dry unit skips the wet strip entirely. [Wet or dry?](/blog/wet-or-dry-inflatable-guide) helps you choose.

## FAQ

### Will a water slide kill my grass?

Not a healthy lawn after a one-day rental. Expect flattened grass for a day or two and a trampled wet strip by the splash pool.

### Should I water my lawn before a water slide rental?

No. Skip watering the day before and turn sprinklers off on the day — wet ground turns to mud and holds stakes poorly.

### Can stakes damage sprinkler lines?

Yes, which is why sprinkler heads and lines need to be marked before the crew arrives.

### Is artificial turf better for a water slide?

Turf has no grass to flatten, but tell us it is turf when you book so the crew can plan the anchoring. Grass setups are covered in [can you set up a water slide on grass](/blog/can-you-set-up-a-water-slide-on-grass).`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "buying-a-used-commercial-water-slide",
    title:
      "Buying a Used Commercial Water Slide: What to Inspect Before You Pay",
    excerpt:
      "A used commercial slide can be a good buy or someone else's retired problem, and in photos they look the same. The checks that tell them apart take about an hour, with the unit inflated in front of you.",
    metaTitle: "Buying a Used Commercial Water Slide: What to Check",
    metaDescription:
      "What to inspect on a used commercial inflatable water slide — seams, vinyl, mildew, patches, the blower and the label — and how to compare the price with new.",
    categorySlug: "buying",
    tagSlugs: ["buying", "commercial", "ownership", "tips"],
    cover: IMG.seamsAndAnchors,
    content: `**Only buy a used commercial water slide after you have seen it fully inflated, run water through it, and checked the seams, the vinyl, the patches, the blower and the smell in daylight.** Photos show none of those. Most of what retires an inflatable — mildew, sun damage, split stitching — is obvious in person and invisible in a listing.

Here is the inspection, in the order it is worth doing.

## Before you travel: questions for the seller

- **How old is it, and how has it been used?** Five summers of weekly rentals is a very different life from one church field day a year.
- **Where was it stored, and was it dried first?** A slide put away damp grows mildew inside the seams.
- **What has been repaired, and by whom?** Patches are not a deal-breaker. Many patches in one area can be.
- **Does it come with its blowers?** A slide is only as good as the air behind it.
- **Does it still have its manufacturer's label?** You need the maker and model to look up its specifications and rider limits.
- **Will they inflate it and run water through it for you?** If not, that tells you something.

${fig(IMG.foldingSlide, "Gloved hands folding a deflated teal inflatable slide on a ground sheet", "Ask how it was put away. Rolling a slide up damp is the most common way a good unit is ruined.")}

## The inspection

### Inflate it and watch

Ask for the unit to be set up and running when you arrive. Inflatables are constant-air units — some air always escapes through the seams while the blower replaces it — so a firm slide with the blower on is normal. What you are looking for is anything that is not firm: sagging sections, a lane that dips, or a corner that will not fill. Those point to a tear, a failed seam or a weak blower.

### Seams and stitching

Walk every seam. Look for thread that is broken, frayed or pulling away, and for gaps you can see light through or feel air from. Spend the most time where the load is: where the slide lane meets the pool, the stitching around D-rings and anchor points, and the collar of the blower tube.

### The vinyl

- **Fading and a chalky surface** are where sun damage starts.
- **Stiffness and cracking at fold lines** mean brittle vinyl, which tears where flexible vinyl would stretch.
- **Scuffing on the underside** shows how often it sat on concrete without a tarp.

Ask to see the base with the unit deflated, too.

${fig(IMG.vinylLaidFlat, "An inflatable panel laid flat on pavement showing its D-rings and seams", "Laid flat, a slide shows its fading, scuffs and patches in a way it doesn't when it's inflated.")}

### Mildew and smell

Smell it: inside the splash pool, in the folds, and at the seams. Black or gray spotting and a musty smell mean it was stored wet. Mildew stains permanently and degrades the coating from the inside, so treat a musty smell as a reason to look much harder — or to leave.

### Patches

Count them and note where they are. A few small, well-bonded patches on the walls are routine. Patches on the sliding surface, on seams, or clustered in one spot deserve questions, because those are high-stress places where a patch can mean a failure that keeps coming back. Lifting edges mean a repair that is letting go. See [how to patch an inflatable water slide](/blog/how-to-patch-an-inflatable-water-slide).

### Run the water

Run the hose for a while. The spray line should wet the lane evenly, the splash pool should hold water, and nothing should drip from places it should not.

### Anchor points, handles and netting

D-rings and anchor loops should be firmly attached, with the stitching around them intact. Climbing handholds, netting and mesh should be whole. These carry the wind and rider loads.

### The blower

Blowers are mechanical and wear out on their own clock, separately from the slide. Check the housing, the cord and plug, and the intake screen, and listen for grinding. A tired blower is a replacement cost to take off the price, not a reason to walk away.

## Paperwork and insurance

If you plan to rent the unit out, talk to your insurer before you buy, and ask what they need to know about it. Ask whether the manufacturer built it to ASTM F2374, the US standard practice for the design, manufacture and operation of inflatable amusement devices. Some states also regulate inflatables and the people who operate them, so check yours.

## Walk away if

- The seller will not inflate it
- It smells musty, or there is mildew in the seams
- The vinyl is stiff and cracking at the folds
- Seams are splitting at the lane, the pool or the anchor points
- The patches are on the sliding surface or clustered on seams
- There is no label, so you cannot identify the maker or model

## Used or new: do the math

A used unit is only cheaper if it lasts. Compare the asking price with the new price of an equivalent unit, then subtract what you will spend straight away: a blower, repairs, a deep clean.

For reference, prices for some of our new commercial units, as of September 2026: the [Sundown 16](/shop/sundown-16) is $3,015, the [Breakwater 18](/shop/breakwater-18) $3,745, the [Twin Falls 22](/shop/twin-falls-22) $5,720, and the [Thunderhead 28](/shop/thunderhead-28) $8,215. We ship the units we sell anywhere in the US.

If a used unit's history cannot be told, or its price leaves no room for the repairs it needs, a new one is the cheaper buy. Our [commercial buying guide](/blog/commercial-water-slide-buying-guide) covers the specs, and [how long a commercial slide lasts](/blog/how-long-does-a-commercial-water-slide-last) covers what decides its life.

## FAQ

### Is it worth buying a used inflatable water slide?

It can be, if it was dried before every storage, kept out of idle sun and repaired properly — and if the price leaves room for a blower and some repairs.

### What is the most important thing to check on a used water slide?

Mildew and seams. Both are expensive or impossible to put right, and both show up in person.

### Can mildew be removed from an inflatable?

Not really. Mildew stains permanently and damages the coating from the inside.

### How long does a commercial water slide last?

Years, if it is dried, kept out of idle sun and patched early — see [how long a commercial water slide lasts](/blog/how-long-does-a-commercial-water-slide-last). Or [browse new units](/shop).`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-patch-an-inflatable-water-slide",
    title: "How to Patch a Hole in an Inflatable Water Slide",
    excerpt:
      "A small hole isn't an emergency — the blower keeps up. Left alone, though, it grows. How to find it, patch it properly with vinyl and cement, and recognize the damage that isn't a DIY job.",
    metaTitle: "How to Patch a Hole in an Inflatable Water Slide",
    metaDescription:
      "How to find and patch a small hole or tear in a vinyl inflatable water slide: materials, six steps, cure time, and the damage that needs a professional.",
    categorySlug: "ownership",
    tagSlugs: ["ownership", "commercial", "tips"],
    cover: IMG.vinylBeading,
    content: `**To patch a small hole in an inflatable water slide, find the leak, deflate and dry the unit, clean the area, cut a round-cornered vinyl patch that overlaps the damage by about two inches on every side, glue it with vinyl cement, press it flat, and let it cure fully before inflating.** That fixes pinholes and small tears in walls and panels. Split seams, damage to the sliding surface and large tears belong with an inflatable repair shop.

This is for units you own. **If a rental unit gets damaged, do not repair it — [tell us](/contact).**

## First: a small hole isn't an emergency

Inflatable slides are constant-air units. They are designed to lose some air through their seams while the blower keeps pushing more in, so a pinhole will not bring a slide down.

What a hole does is grow. Inflatables fail progressively: a pinhole becomes a tear, a tear reaches a seam, and a seam becomes a panel replacement. That is the reason to patch while it is small.

## What you'll need

- **Vinyl patch material** in the same weight as the unit — ideally from the manufacturer, in a matching color.
- **Vinyl cement** made for PVC-coated fabric. Not superglue, and not a general-purpose adhesive.
- **Rubbing alcohol** or a vinyl cleaner, and clean rags.
- **Scissors** and a marker.
- **A small roller,** or anything smooth and hard to press the patch flat.
- **Something flat and heavy** to weight the patch while it cures.
- **A spray bottle of soapy water** to find the leak.

Leave the duct tape in the garage. It lets go when wet, and the residue it leaves makes a proper patch harder to bond.

## How to patch it, step by step

### 1. Find the leak

With the unit inflated, listen close to where you think the leak is, then spray soapy water over the area. Bubbles mark the hole. Circle it with a marker — a pinhole is hard to find again once the unit is deflated.

### 2. Deflate, clean and dry

Deflate the unit and lay the damaged area flat on a hard surface. Clean an area wider than the patch will be with rubbing alcohol, removing dirt, sunscreen and any old adhesive, and let it dry completely. Cement will not bond to wet or dirty vinyl.

${fig(IMG.wipingSurface, "Gloved hand wiping the wet surface of an inflatable slide with a cloth", "A patch is only as good as the surface under it. Clean well past the edge of the damage and let it dry.")}

### 3. Cut the patch

Cut a patch that reaches about two inches past the damage on every side, and **round the corners**. Square corners are where patches start to peel.

### 4. Apply the cement

Trace around the patch on the unit so you know where the glue goes. Spread a thin, even coat of cement on both the patch and the traced area, and follow the label for how long to wait before joining them.

### 5. Press it flat

Lay the patch down from one edge to the other so you do not trap air, then roll or press firmly from the center out. Wipe away any cement that squeezes out.

### 6. Weight it and let it cure

Put something flat and heavy on the patch and leave it for the full cure time on the cement's label before you inflate the unit or put water on it. A rushed patch looks fine and peels on its first day back in service.

## When not to patch it yourself

- **Split seams or broken stitching.** Seams carry load. They need re-stitching, not glue.
- **The sliding surface.** Riders cross a raised patch edge at speed. Have the lane repaired so it stays smooth.
- **Tears longer than a few inches,** or any damage near anchor points, D-rings or the blower tube collar.
- **A unit under warranty.** Check the warranty terms before you touch it.

${fig(IMG.laneCloseUp, "Close-up of the blue inflated lane of a water slide", "The lane riders slide on is the one place a raised patch edge becomes a problem.")}

For those, an inflatable repair shop can re-stitch or weld the unit properly.

## Prevent the next hole

Most holes come from the ground under the slide or from what riders bring onto it:

- **Put a ground tarp under the unit every time,** especially on hard ground.
- **Clear the setup area** of sticks, stones and anything sharp.
- **No shoes, jewelry, glasses or sharp objects** on the slide.
- **Dry it completely before storage,** and check seams and anchor points every few rentals.

The routine is in [how to clean, dry and store an inflatable water slide](/blog/clean-dry-store-inflatable-water-slide), and [how long a commercial water slide lasts](/blog/how-long-does-a-commercial-water-slide-last) explains why small repairs matter so much.

## FAQ

### Can you use a bike tire patch on an inflatable water slide?

No. Tire patches are made for rubber inner tubes, not PVC-coated vinyl. Use vinyl patch material and vinyl cement.

### How long before you can inflate a patched water slide?

Wait for the full cure time on the cement's label, and do not get the patch wet before then.

### Will a small hole make a water slide deflate?

Not usually — the blower keeps a constant-air unit inflated. The hole will grow if it is not patched, though.

### What if a rental water slide gets a hole?

Stop using it and tell us. Do not attempt a repair on a rental unit.

Buying rather than renting? See our [commercial buying guide](/blog/commercial-water-slide-buying-guide) or [browse units for sale](/shop).`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-much-does-a-commercial-water-slide-weigh",
    title: "How Much Does a Commercial Inflatable Water Slide Weigh?",
    excerpt:
      "From 95 lbs for a toddler slide to 640 lbs for a 28-foot tower — before the blowers, the anchoring or the water. Real weights from our catalog, and what they mean for moving, storing and siting one.",
    metaTitle: "How Much Does a Commercial Water Slide Weigh?",
    metaDescription:
      "Commercial inflatable water slides weigh about 95 to 640 lbs, rising with height. Real weights by model, and what they mean for moving, storing and setup.",
    categorySlug: "ownership",
    tagSlugs: ["ownership", "buying", "commercial"],
    cover: IMG.slideInBin,
    content: `**A commercial inflatable water slide weighs between about 95 and 640 lbs, and the weight rises with height.** Across the models in our catalog with a listed weight, an 8-foot toddler slide is 95 lbs, 16- and 18-foot slides are 210 to 240 lbs, and the 22- to 28-foot towers run from 360 to 640 lbs. The blowers, the anchoring and the tarp are separate loads to plan for — and once the splash pool fills, the water outweighs all of it.

## Weights by model

| Model | Height | Level area needed | Weight | Blowers |
|---|---|---|---|---|
| [Little Harbor Junior](/rent/little-harbor-junior) | 8 ft | 17 × 12 ft | 95 lbs | 1 × 1 HP |
| [Sundown 16](/rent/sundown-16) | 16 ft | 21 × 15 ft | 210 lbs | 1 × 1.5 HP |
| [Breakwater 18](/rent/breakwater-18) | 18 ft | 23 × 16 ft | 240 lbs | 1 × 1.5 HP |
| [Twin Falls 22](/rent/twin-falls-22) | 22 ft | 36 × 22 ft | 360 lbs | 2 × 1.5 HP |
| [Palmetto Coast 24](/rent/palmetto-coast-24) | 24 ft | 37 × 22 ft | 420 lbs | 2 × 1.5 HP |
| [Vortex Peak 26](/rent/vortex-peak-26) | 26 ft | 39 × 23 ft | 480 lbs | 2 × 2 HP |
| [Highwater Tower 27](/rent/highwater-tower-27) | 27 ft | 40 × 24 ft | 520 lbs | 2 × 2 HP |
| [Thunderhead 28](/rent/thunderhead-28) | 28 ft | 44 × 25 ft | 640 lbs | 3 × 2 HP |

These are the eight models we publish a weight for. The pattern is simple: weight follows the amount of vinyl, so a taller climb, a second lane and a bigger splash pool all add to it. The single-lane Breakwater 18 and the dual-lane Twin Falls 22 are only four feet apart in height, but 120 lbs apart in weight.

## What the weight means for moving a slide

A rolled slide is dense and hard to grip, so it handles heavier than its number.

- **Around 100 lbs (toddler slides):** two people can carry it.
- **200 to 250 lbs (16- and 18-foot slides):** two people and a hand truck, and no carrying it up steps.
- **350 lbs and up (towers):** a crew, a heavy-duty hand truck, and a trailer or truck with a ramp or liftgate.

${fig(IMG.crewLoadingVan, "Two crew members loading a rolled inflatable slide into a van with a hand truck", "Even a mid-size slide is a two-person, hand-truck job before anyone lifts it into a vehicle.")}

**A wet slide weighs more.** Rolled up at the end of an event, a slide carries water in its folds and seams. It has to be unrolled and dried before storage anyway — see [how to clean, dry and store an inflatable water slide](/blog/clean-dry-store-inflatable-water-slide).

**Check the vehicle.** Add up the slide, the blowers, the ballast and the tarp, and compare the total with the payload on the Tire and Loading Information sticker on the driver's door jamb. That limit covers passengers too.

## What it means for storing a slide

- **Keep it off the floor,** on a pallet or on shelving rated for the weight.
- **Keep it dry and away from rodents.**
- **Don't stack units on top of each other.** The weight presses folds into hard creases, and repeated creases wear vinyl.

## What it means for where a slide can go

For hosts, the weight is why the crew needs a clear, flat path from the truck to the setup spot, and why gates, steps and tight corners matter. Our crew does the carrying; you clear the path — [what to do before the crew arrives](/blog/what-to-do-before-water-slide-rental-arrives) has the list.

${fig(IMG.crewUnrolling, "Crew member unrolling an inflatable slide from a trailer onto a backyard lawn", "The heavy lifting is the crew's job. A clear path from the truck to the spot is yours.")}

The bigger number is the water. Water weighs about 8.34 lbs per US gallon. As an illustration — splash pools vary by model — a pool area of 10 × 8 ft holding six inches of water holds about 300 gallons, which is roughly 2,500 lbs. That is nearly four times the weight of the heaviest slide on this list.

That is why water slides go on the ground — lawns, concrete, blacktop — and never on wooden decks, balconies or rooftops.

## If you're buying

Put weight on the same list as footprint and power:

- **Who moves it:** you and a friend, or a crew
- **What carries it:** a trailer, a box truck, a van
- **Where it lives** between events, and whether that floor or shelf can take it

We ship the units we sell anywhere in the US; [request a quote](/contact) and we will confirm delivery timing and cost. Our [commercial buying guide](/blog/commercial-water-slide-buying-guide) covers the rest of the specs, and [rent or buy](/blog/rent-or-buy-water-slide) covers whether owning makes sense at all.

## FAQ

### How heavy is an 18-foot inflatable water slide?

The single-lane Breakwater 18 weighs 240 lbs. Our dual-lane 18-footers need a much larger area (39 × 20 ft against 23 × 16 ft), so plan for a heavier roll.

### Can two people move a commercial water slide?

Two people with a hand truck can manage a 200- to 250-lb slide. The towers of 350 lbs and up need a crew and a ramp or liftgate.

### Does a wet water slide weigh more?

Yes. Water trapped in the folds and seams adds weight, which is one more reason to dry it fully before storage.

### Can an inflatable water slide go on a deck?

No. Once the splash pool fills, the water alone weighs far more than the slide.`,
  },
];

/** Posts that have no cover image at all. */
const COVERS: { slug: string; cover: Img }[] = [
  { slug: "fall-festival-inflatable-rentals", cover: IMG.fieldDayQueue },
  {
    slug: "what-to-rent-when-its-too-cold-for-a-water-slide",
    cover: IMG.sunsetBackyard,
  },
];

/** One-sentence corrections to claims the refreshed posts now contradict. */
const FIXES: { slug: string; find: string; replace: string }[] = [
  {
    slug: "water-slide-water-source",
    find: "Less than most people expect — many units recirculate, topping up rather than running full-blast. We break down real numbers in [how much water does a water slide use](/blog/how-much-water-does-a-water-slide-use). A day of fun won't drain your well or blow up your water bill.",
    replace:
      "One hose's worth: the slide is fed from your garden hose, and nothing is recirculated. How much that comes to depends on how far the tap is open and how long the slide runs — [how much water does a water slide use](/blog/how-much-water-does-a-water-slide-use) shows how to measure it on your own meter.",
  },
  {
    slug: "water-slide-vs-bounce-house",
    find: "Bounce houses work year-round, rain or shine.",
    replace:
      "Bounce houses work in any season, and indoors when the weather will not cooperate.",
  },
];

// ─── Checks ─────────────────────────────────────────────────────────────────

const STATIC_PATHS = new Set([
  "/contact",
  "/rent",
  "/shop",
  "/services",
  "/blog",
  "/answers",
  "/faq",
  "/water-slide-rentals",
]);

const text = (v: unknown): string =>
  typeof v === "string" ? v : ((v as { en?: string })?.en ?? "");

function words(md: string): number {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .split(/\s+/)
    .filter(Boolean).length;
}

const fail = (problems: string[]) => {
  console.error(`\n✗ ${problems.length} problem(s) — nothing written:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
};

async function checkPosts(all: Post[]): Promise<string[]> {
  const problems: string[] = [];

  const [products, posts, categories, tags] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, type: true },
    }),
    prisma.blogPost.findMany({ select: { slug: true, status: true } }),
    prisma.blogCategory.findMany({ select: { slug: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
  ]);
  const rentable = new Set(
    products.filter((p) => p.type !== "SALE").map((p) => p.slug),
  );
  const sellable = new Set(
    products.filter((p) => p.type !== "RENTAL").map((p) => p.slug),
  );
  const published = new Set(
    posts.filter((p) => p.status === "PUBLISHED").map((p) => p.slug),
  );
  const existing = new Set(posts.map((p) => p.slug));
  const newSlugs = new Set(NEW_POSTS.map((p) => p.slug));
  const useCases = new Set(USE_CASES.map((u) => u.slug));
  const categorySet = new Set(categories.map((c) => c.slug));
  const tagSet = new Set(tags.map((t) => t.slug));

  for (const p of REFRESHED) {
    if (!published.has(p.slug))
      problems.push(`${p.slug}: not a published post`);
  }
  for (const p of NEW_POSTS) {
    if (existing.has(p.slug)) problems.push(`${p.slug}: slug already exists`);
  }

  const covers = new Map<string, string>();
  for (const p of all) {
    const where = p.slug;
    if (p.metaTitle.length < 20 || p.metaTitle.length > 60)
      problems.push(`${where}: metaTitle is ${p.metaTitle.length} chars`);
    if (p.metaDescription.length < 110 || p.metaDescription.length > 158)
      problems.push(
        `${where}: metaDescription is ${p.metaDescription.length} chars`,
      );
    if (!categorySet.has(p.categorySlug))
      problems.push(`${where}: unknown category ${p.categorySlug}`);
    for (const t of p.tagSlugs)
      if (!tagSet.has(t)) problems.push(`${where}: unknown tag ${t}`);

    const clash = covers.get(p.cover.key);
    if (clash) problems.push(`${where}: shares its cover with ${clash}`);
    covers.set(p.cover.key, where);

    const h1s = p.content.match(/^# /gm);
    if (h1s) problems.push(`${where}: body has an H1; the page renders one`);

    const images = [
      ...p.content.matchAll(/!\[([^\]]*)\]\(([^)\s]+) "([^"]*)"\)/g),
    ];
    // A quote inside a caption breaks the Markdown silently; count to catch it.
    if (images.length !== p.content.split("![").length - 1)
      problems.push(`${where}: an image is malformed (quote in a caption?)`);
    for (const [, alt = "", src = ""] of images) {
      if (!alt.trim()) problems.push(`${where}: image without alt text`);
      if (!/#\d+x\d+$/.test(src))
        problems.push(`${where}: image without a #WxH size`);
    }

    for (const [, href = ""] of p.content.matchAll(
      /(?<!!)\[[^\]]+\]\(([^)]+)\)/g,
    )) {
      if (href.startsWith("https://")) continue;
      if (!href.startsWith("/")) {
        problems.push(`${where}: link is neither internal nor https: ${href}`);
        continue;
      }
      const [, section = "", slug = ""] = href.split("/");
      const ok =
        STATIC_PATHS.has(href) ||
        (section === "rent" && rentable.has(slug)) ||
        (section === "shop" && sellable.has(slug)) ||
        (section === "blog" && (published.has(slug) || newSlugs.has(slug))) ||
        (section === "water-slides-for" && useCases.has(slug));
      if (!ok) problems.push(`${where}: dead internal link ${href}`);
    }
  }
  return problems;
}

async function checkFixes(): Promise<{
  problems: string[];
  pending: { slug: string; content: string }[];
}> {
  const problems: string[] = [];
  const pending: { slug: string; content: string }[] = [];
  for (const f of FIXES) {
    const post = await prisma.blogPost.findUnique({
      where: { slug: f.slug },
      select: { content: true },
    });
    const body = text(post?.content);
    const hits = body.split(f.find).length - 1;
    if (hits === 1) {
      pending.push({ slug: f.slug, content: body.replace(f.find, f.replace) });
    } else if (hits === 0 && body.includes(f.replace)) {
      console.log(`  = ${f.slug}: fix already applied`);
    } else {
      problems.push(`${f.slug}: fix text found ${hits} times`);
    }
  }
  return { problems, pending };
}

// ─── Upload ─────────────────────────────────────────────────────────────────

const r2 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ??
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const BUCKET = process.env.R2_BUCKET_NAME ?? "";

async function inR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Confirm every image's real size, and upload the local originals not yet in R2. */
async function prepareImages(used: Img[]): Promise<string[]> {
  const problems: string[] = [];
  const files = readdirSync(LOCAL_DIR);

  for (const i of used) {
    let buf: Buffer;
    if (i.local) {
      const file = files.find((f) => f.startsWith(i.local!));
      if (!file) {
        problems.push(`${i.key}: no file in images/Blogs starts ${i.local}`);
        continue;
      }
      buf = readFileSync(path.join(LOCAL_DIR, file));
    } else {
      const res = await fetch(imgUrl(i));
      if (!res.ok) {
        problems.push(`${i.key}: ${res.status} from R2`);
        continue;
      }
      buf = Buffer.from(await res.arrayBuffer());
    }

    const meta = await sharp(buf).metadata();
    if (meta.width !== i.width || meta.height !== i.height) {
      problems.push(
        `${i.key}: is ${meta.width}x${meta.height}, declared ${i.width}x${i.height}`,
      );
      continue;
    }
    if (!i.local || DRY) continue;

    if (await inR2(i.key)) {
      console.log(`  = ${i.key} (already uploaded)`);
      continue;
    }
    // Re-encoded, not resized: the originals are ~1 MB each and every body
    // image is served through the wsrv proxy, which still fetches the source.
    const body = await sharp(buf)
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer();
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: i.key,
        Body: body,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000",
      }),
    );
    console.log(
      `  ↑ ${i.key} (${Math.round(buf.length / 1024)} → ${Math.round(body.length / 1024)} KB)`,
    );
  }
  return problems;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!R2) fail(["R2_PUBLIC_URL is not set"]);
  const all = [...REFRESHED, ...NEW_POSTS];

  const used = new Map<string, Img>();
  for (const p of all) used.set(p.cover.key, p.cover);
  for (const c of COVERS) used.set(c.cover.key, c.cover);
  const bodyKeys = [...all.map((p) => p.content)]
    .join("\n")
    .matchAll(new RegExp(`${R2.replace(/\./g, "\\.")}/([^#)\\s]+)`, "g"));
  for (const m of bodyKeys) {
    const img = Object.values(IMG).find((i) => i.key === m[1]);
    if (img) used.set(img.key, img);
  }

  console.log(`Checking ${all.length} posts and ${used.size} images…`);
  const postProblems = await checkPosts(all);
  const { problems: fixProblems, pending: fixes } = await checkFixes();
  const coverProblems: string[] = [];
  for (const c of COVERS) {
    const post = await prisma.blogPost.findUnique({ where: { slug: c.slug } });
    if (!post) coverProblems.push(`${c.slug}: no such post`);
    if (all.some((p) => p.cover.key === c.cover.key))
      coverProblems.push(`${c.slug}: cover already used by a refreshed post`);
  }
  const imageProblems = await prepareImages([...used.values()]);
  const problems = [
    ...postProblems,
    ...fixProblems,
    ...coverProblems,
    ...imageProblems,
  ];
  if (problems.length) fail(problems);

  for (const p of all) {
    const w = words(p.content);
    console.log(
      `  ✓ ${p.slug}\n      ${w} words · title ${p.metaTitle.length} · description ${p.metaDescription.length}`,
    );
  }

  if (DRY) {
    console.log("\nDry run — nothing uploaded or written.");
    return;
  }

  const author = await prisma.blogPost.findFirst({
    where: { status: "PUBLISHED", authorId: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { authorId: true },
  });
  const categoryIds = new Map(
    (await prisma.blogCategory.findMany()).map((c) => [c.slug, c.id]),
  );
  const now = Date.now();
  const fields = (p: Post) => ({
    title: { en: p.title },
    excerpt: { en: p.excerpt },
    content: { en: p.content },
    metaTitle: { en: p.metaTitle },
    metaDescription: { en: p.metaDescription },
    coverImage: imgUrl(p.cover),
    readingMinutes: Math.max(3, Math.round(words(p.content) / 220)),
    categoryId: categoryIds.get(p.categorySlug)!,
  });

  // Interactive rather than a batch array: through the pg driver adapter a
  // batch still runs under the 5 s interactive default, and twenty-odd writes
  // with tag relations over a Neon round trip overran it (and rolled back).
  await prisma.$transaction(
    async (tx) => {
      for (const p of REFRESHED) {
        await tx.blogPost.update({
          where: { slug: p.slug },
          data: {
            ...fields(p),
            tags: { set: p.tagSlugs.map((slug) => ({ slug })) },
          },
        });
      }
      // A minute apart, first in the list newest, so the listing order is fixed.
      for (const [i, p] of NEW_POSTS.entries()) {
        await tx.blogPost.create({
          data: {
            slug: p.slug,
            ...fields(p),
            status: "PUBLISHED",
            publishedAt: new Date(now - i * 60_000),
            authorId: author?.authorId ?? null,
            tags: { connect: p.tagSlugs.map((slug) => ({ slug })) },
          },
        });
      }
      for (const c of COVERS) {
        await tx.blogPost.update({
          where: { slug: c.slug },
          data: { coverImage: imgUrl(c.cover) },
        });
      }
      for (const f of fixes) {
        await tx.blogPost.update({
          where: { slug: f.slug },
          data: { content: { en: f.content } },
        });
      }
    },
    { maxWait: 20_000, timeout: 120_000 },
  );

  console.log(
    `\nWrote ${REFRESHED.length} refreshed and ${NEW_POSTS.length} new posts, ${COVERS.length} covers, ${fixes.length} fixes.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
