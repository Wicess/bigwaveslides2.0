/*
 * write-blog-cluster.ts
 *
 * Writes the nine articles that retire-duplicate-posts.ts unpublished, and
 * republishes them.
 *
 * WHY THESE NINE
 * They were word-for-word duplicates of the same slugs on bigwaveslides.com.
 * Unpublishing took them out of the index; it did not cover the topics, and one
 * of them ("how much does it cost") is the highest-volume query in the niche.
 * This script replaces the bodies entirely — new titles, new excerpts, new
 * prose — so the pages can be republished as our own.
 *
 * WHAT MAKES THEM NOT-DUPLICATES
 * Real numbers from this codebase rather than the range-of-everything hedging
 * every competing article uses:
 *   - daily rates straight off the catalog ($155–$570, by category)
 *   - the flat $30 transport fee from lib/checkout-config.ts, which is one
 *     charge per order and not per mile
 *   - the request-and-quote booking model from lib/rental-pricing.ts (there is
 *     no online payment, and the copy says so instead of implying a cart)
 *   - power and footprint figures taken from the products themselves
 * A competitor cannot copy this without quoting our prices, which is the point.
 *
 * VOICE: lib/city-profiles.ts. Name the constraint, admit the trade-off, and
 * answer the question the reader actually asked instead of selling past it.
 * Two of these posts tell the reader not to book — that is deliberate.
 *
 * Every internal product link is checked against the live catalog before
 * anything is written; a stale slug fails the run rather than shipping a 404.
 *
 * Run: npm run db:write-blog-cluster [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  readingMinutes: number;
  content: string;
};

const POSTS: Post[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "water-slide-rental-cost-guide",
    title: "What a Water Slide Rental Costs: Every Number We Charge",
    excerpt:
      "Most pricing guides quote a $200–$800 range and leave you no wiser. Here are our actual daily rates, the one delivery fee we charge, and the four things that genuinely move a quote.",
    metaTitle: "Water Slide Rental Cost: Real Prices, Not a Range",
    metaDescription:
      "Our actual water slide rental prices — daily rates from $155 to $570, a flat $30 delivery fee, and an honest account of what changes a quote and what does not.",
    readingMinutes: 6,
    content: `Search this question and you will get a lot of articles that answer "$200 to $800, depending on your needs." That range is technically true and completely useless — it is wide enough to contain every possible answer, which means it contains none of them.

So here are our numbers instead.

## The daily rate, by what you are renting

Every unit we own has one daily rate. It does not change by day of the week, and it does not change because it is July.

- **Toddler slides** — $155. We have one, the [Little Harbor Junior](/rent/little-harbor-junior), built for ages 2 to 6.
- **Bounce houses** — $165 to $295. The spread is theming, not size: a [plain pink-and-purple castle](/rent/blossom-keep-bouncer) sits at the bottom, a [sculpted unicorn](/rent/dreamfield-bouncer) at the top, and the jump floors are within two feet of each other.
- **Backyard water slides** — $230 to $290. Fifteen to eighteen feet, single or twin lane, sized for a normal yard.
- **Combo units** (bounce + slide in one) — $280 to $570.
- **Racing slides** — $290 to $405.
- **Tall slides** — $320 to $500.
- **Party attractions** — $415 for the [Stampede Bull](/rent/stampede-bull), which is the only thing we rent that arrives with a trained operator included.

Multi-day is simply the daily rate times the number of days. A Saturday-to-Sunday booking on a $330 slide is $660 of rental, not a mystery number.

## The delivery fee is $30, flat

One charge per order. Not per item, not per mile.

We are deliberate about this because per-mile quoting is the standard trick in this trade, and it is how a $300 rental becomes a different number at the last screen. A single figure you can see before you commit is worth more to you than a formula that is technically fairer and functionally unpredictable.

That $30 covers delivery, setup, anchoring and pickup. There is no separate setup charge, and there is no charge for the crew's time on site.

> Add it up: a $330 tall slide for one day is $360 delivered, set up, anchored and collected. That is the whole number.

## The deposit is refundable and quoted separately

You will see a deposit on your quote. It is held against damage, it comes back to you after the rental, and we deliberately do not fold it into the total — a refundable hold is not a cost, and presenting it as one would make our prices look higher than they are.

## What actually changes a quote

Four things, and only four.

**How long you keep it.** Days multiply. Nothing else in the quote does.

**Which unit.** Not by height, which is what people expect. A sculpted single-lane slide like the [Cape Fin 18](/rent/cape-fin-18) costs more than a plain dual-lane slide of exactly the same height, because you are paying for the sculpt work and accepting lower throughput. If you want the most riders per minute for the money, the plain [dual-lane 18s](/rent/reefline-18) are the value in the catalog.

**Site access.** If the crew can walk the unit from the vehicle to the pad, that is the normal case and it is in the price. Long carries, stairs, and gates too narrow for the folded unit are the things that turn a routine delivery into a two-hour job. None of this is a surcharge ambush — we would simply rather know beforehand, because the alternative is a crew arriving at a yard they cannot get into.

**Ground and power.** Hard surfaces need ballast instead of stakes. Units over 18 feet generally need two 20A circuits, and a few need more — the [Thunderhead 28](/rent/thunderhead-28) runs three 2 HP blowers. If your site cannot supply that, a generator is the answer, and it is better identified two weeks out than on the morning.

## What does not change the quote

Weekends. Holidays. Peak summer. School-holiday weeks.

Surge pricing on party rentals is common, and we do not do it. The rate you see in June is the rate in October.

## Why there is no "Book Now" button

We quote, then you decide. You send a request with your date, your ZIP and your unit; we confirm availability and site suitability and send back a real number.

The reason is not old-fashioned software. It is that a meaningful share of requests need a conversation before they should be accepted — a yard that will not take the footprint, a park that needs a certificate of insurance, a single circuit that cannot run two blowers. A checkout button would happily take money for all of those and leave the problem to be discovered on the day, by you.

## Getting a number for your event

Have three things ready and the quote takes one exchange rather than four: your **date**, your **ZIP code**, and the **rough dimensions of the space** the unit will stand in. A photograph of the spot is worth more than a description of it.

[Request a quote](/contact) with those and we will come back with a firm figure — or with the reason the unit you picked is wrong for the site, which is more useful.

---

**Related:** [Is a rental worth the money?](/blog/are-water-slide-rentals-worth-it) · [What's included in a rental](/blog/what-is-included-in-a-water-slide-rental) · [How much space you actually need](/blog/how-much-space-water-slide)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "are-water-slide-rentals-worth-it",
    title: "Is a Water Slide Rental Worth It? An Honest Cost Breakdown",
    excerpt:
      "Four hours of entertainment for around $360 works out cheaper per child than most venue parties. It is still the wrong call for some events — here is how to tell which one you are having.",
    metaTitle: "Are Water Slide Rentals Worth It? An Honest Answer",
    metaDescription:
      "The real per-guest math on a water slide rental, compared against venue parties — and the four situations where we would tell you not to book one.",
    readingMinutes: 4,
    content: `"Worth it" depends entirely on what you are comparing it against, so let us do the comparison properly rather than assert the answer.

## The arithmetic

A mid-range tall slide is $330 for the day, plus our flat $30 delivery fee. Call it $360, delivered, set up, anchored and collected.

Twenty children at a four-hour party is **$4.50 per child**, or about **$1.15 per child per hour**.

For context, venue party packages are usually priced per child and capped at ninety minutes, often with a limit on numbers — commonly somewhere in the $20-to-$30-a-head region, though that varies enough by market that it is worth ringing two places near you. On a per-child basis a slide rental is not close, and the gap widens with every extra guest, because the slide costs the same whether eleven children turn up or thirty.

That is the honest strength of the model: **the cost is fixed and the value scales with attendance.** Nothing else about a party works that way.

## What you are also buying

Two things that do not show up in the per-child number.

**The venue is your house.** No deposit on a room, no minimum spend, no drive, no collecting children from a car park at the end. For a family with a toddler as well as a birthday child, that alone tends to decide it.

**The entertainment runs itself.** A slide does not need a host, a schedule or a games plan. Four hours of structured activity arrives on a truck and leaves on one, and the adults get to talk to each other.

> The rental is cheapest per guest at exactly the moment other party formats get most expensive: when a lot of people say yes.

## When it is not worth it

We would rather say this here than after you have paid.

**When the guest list is under about eight children.** At six guests you are at $60 a child and a venue package starts to compete honestly. A [bounce house](/rent/blossom-keep-bouncer) at $165 is the better-proportioned answer for a small party.

**When the yard cannot take it.** A tall slide wants around 39 × 20 feet of level ground. If yours is 25 feet end to end, the honest options are a compact unit like the [Sundown 16](/rent/sundown-16) on a 21 × 15 ft pad, or a park — not a big slide squeezed in at an angle. Read [how much space you actually need](/blog/how-much-space-water-slide) before you fall for a photograph.

**When the ages do not fit.** Our tall slides start at 5, and the big ones at 8. A party of three-year-olds should be looking at the [Humpback 16](/rent/humpback-16) or a bounce house, not at a 27-foot tower they will not be allowed on.

**When nobody will supervise.** A water slide needs a responsible adult watching it for the whole booking. If every adult present is cooking, hosting and refereeing, that job goes unfilled — and that is the situation where an accident actually happens.

## The comparison that matters most

Not slide versus venue. Slide versus **the party you would otherwise throw**.

Most backyard birthdays already cost something: food, decorations, a couple of activities that occupy children for twenty minutes each and are then over. A rental replaces the activity budget entirely and outlasts the food. Against that baseline the marginal cost is smaller than the sticker suggests, and it is the reason people who book one tend to book again.

## If you are still unsure

Two questions settle it.

1. **How many children are coming?** Over fifteen, the math is decisive.
2. **Have you measured the space?** Not eyeballed — measured, with the gate width included.

With those two answers, [send us a quote request](/contact) and we will tell you which unit fits, or that none of them do. We turn down bookings for yards that cannot take the unit, which is the only reason our answer here is worth anything.

---

**Related:** [What a rental actually costs](/blog/water-slide-rental-cost-guide) · [Can a slide fit a small backyard?](/blog/can-a-water-slide-fit-in-a-small-backyard) · [Rent or buy?](/blog/rent-or-buy-water-slide)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-rent-a-water-slide",
    title: "How to Rent a Water Slide: The Whole Process, Start to Finish",
    excerpt:
      "From the three details we need to quote you, through what happens on delivery day, to what you are responsible for while the unit is up. No surprises version.",
    metaTitle: "How to Rent a Water Slide — Step by Step",
    metaDescription:
      "The full water slide rental process: what to send for a quote, how booking works without online payment, what delivery day looks like, and what the host handles.",
    readingMinutes: 5,
    content: `There are five steps and none of them are complicated. The reason this page exists is that most rental sites describe three of them and leave you to discover the other two on the day.

## 1. Measure before you shop

This is out of order compared to how everyone actually does it, and it is still the right order. Picking a slide you love and then finding out it needs eleven more feet than you have is the single most common way a booking falls apart.

Measure three things:

- **The pad.** Length and width of the flattest area you have. A unit needs its own footprint plus roughly five feet clear on every side.
- **The gate.** Not the yard — the gate. Deflated units are bulky, and a 36-inch side return is a genuine constraint. If the only route in is through the house, say so early.
- **The overhead.** Branches, power lines, eaves. A 27-foot slide needs 27 feet of nothing above it.

Photographs of the space are worth more than measurements, and both together mean we can catch a problem in advance instead of in your driveway.

## 2. Send a request, get a quote

There is no cart and no online payment. You send us the date, the ZIP, the unit and those measurements; we check availability and whether the site actually suits the unit, and send back a firm number.

The quote breaks down as the daily rate, the flat $30 delivery fee, and a refundable deposit listed separately because it is not a cost. Nothing else appears later.

If the unit you picked is wrong for the site, this is where we say so and suggest the one that fits. That conversation is the entire reason we quote rather than sell.

> A booking is not confirmed until you have a written quote back from us with the date on it. If you have not got that, you are not on the calendar.

## 3. Book, then forget about it

Once you accept, the date is held. WhatsApp is the fastest way to reach us if anything changes — a message lands on a phone, an email lands in a promotions tab — and things do change: guest numbers, a moved venue, a new gate.

Tell us about changes as early as you can. A different unit two weeks out is routine. The same request the night before is a scramble, and sometimes it is a no.

## 4. Delivery day

**Before we arrive**, four things need to be true. They take fifteen minutes and they are the difference between a smooth setup and a delayed one.

1. **The area is clear** — furniture, toys, and anything you would rather not have moved by strangers.
2. **The dog waste is gone.** We will not set an inflatable down on it, and this is a more frequent hold-up than you would think.
3. **The route is open.** Gates unlocked, cars off the driveway.
4. **Power is reachable** — a working outdoor outlet near the pad, and for units needing two circuits, two that are genuinely separate rather than two sockets on the same breaker. Tell us in advance if the nearest outlet is a long run from the spot.

**What we do**: lay out and inflate the unit, anchor it (stakes into turf, ballast on hard ground or over irrigation), connect water where it is a wet setup, test it, and walk you through the rules before we leave. Setup runs about 30 to 60 minutes depending on the unit.

## 5. While it is up — your part

The host's responsibilities are short and non-negotiable:

- **An adult supervises the unit the whole time it is in use.** Not nearby. Watching.
- **The blower stays on.** An inflatable deflates in under a minute without it, so nothing gets unplugged for a phone charger.
- **No shoes, no glasses, no food on the unit**, and no sharp anything.
- **Weather calls get made early.** Light rain is fine — the slide is wet by design. Lightning and high wind are a hard stop, every time. Our [weather policy](/blog/water-slide-rain-weather-policy) covers what happens if a forecast turns.

Pickup is the reverse of setup and needs the same clear access.

## What to have ready before you request

Date. ZIP code. Space dimensions. A photograph of the spot. Rough guest count and youngest age.

With those five, [a quote takes one exchange](/contact). Without them it takes four, and the date you wanted may be gone by the end of them.

---

**Related:** [Preparing your yard](/blog/how-to-prepare-your-yard-for-a-water-slide-rental) · [What's included](/blog/what-is-included-in-a-water-slide-rental) · [Delivery and pickup times](/blog/water-slide-delivery-and-pickup-times)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "best-water-slide-rentals-birthday-party",
    title: "Choosing a Birthday Water Slide by the Age of the Birthday Child",
    excerpt:
      "Ranked lists are useless for this because the right slide depends almost entirely on one number: how old the guests are. Here is the catalog sorted that way instead.",
    metaTitle: "Best Birthday Water Slides, Sorted by Age",
    metaDescription:
      "Which water slide suits a 3-year-old, a 6-year-old, a 10-year-old or a teenager — with the age floors, footprints and honest trade-offs for each.",
    readingMinutes: 5,
    content: `Every "top 10 slides for birthdays" list has the same problem: it ranks units against each other when the only thing that matters is who is coming. A slide that is perfect for a ten-year-old's party is against the rules at a four-year-old's.

So here is the catalog arranged by the number that actually decides it.

## Ages 2 to 4

At this age you are not buying thrill, you are buying a place to be wet and safe for three hours.

The [Little Harbor Junior](/rent/little-harbor-junior) is the only unit we rent with an upper age limit as well as a lower one: 2 to 6, a low soft slide into a shallow pool, on a 17 × 12 ft pad. It is small, and that is the feature. Older children will overwhelm it.

If the guest list runs a little older, the [Humpback 16](/rent/humpback-16) is the only full-size water slide we carry that takes three-year-olds — two gentle lanes into an oversized pool that children stay in long after they have stopped queueing. Note the footprint: 35 × 31 ft, and it needs width rather than length.

For dry alternatives, the [Homestead Bouncer](/rent/homestead-bouncer) sits at 12 feet with a low step-in, deliberately pitched at this age rather than at the eight-year-olds who will bounce them over.

## Ages 5 to 7

The main range opens up here, and almost all of our 18-foot slides start at 5.

- The [Cascade 15](/rent/cascade-15) is the lowest full-size tower we run — a shorter climb and a shallower lane for a child who is willing but not certain.
- The [Bluepoint 18](/rent/bluepoint-18) has a single sweeping curve instead of a straight drop, which takes speed off the finish. It is the usual pick for a first tall slide.
- The [Carnival 16](/rent/carnival-16) starts at 4 rather than 5, which makes it the useful one when a five-year-old's party has younger siblings attached.

If the theme matters more than the ride, the [Launchpad 18](/rent/launchpad-18) has the lowest age floor of our sculpted slides at 5 — the drop is standard rather than steep, unlike the dragon and the dinosaur.

## Ages 8 to 12

This is where you can stop worrying about the ride and start worrying about the queue.

Thirty children and one sculpted single-lane slide is a mistake — those units move one rider at a time. What you want is lanes:

- [Twin Falls 22](/rent/twin-falls-22) — two identical lanes and a dual climb, built to reset a line of twenty every couple of minutes. No theming at all, on purpose.
- [Frost & Ember 18](/rent/frost-and-ember-18) — a fire lane against an ice lane, which gets children organizing themselves into teams without an adult inventing a game.
- Any of the [dual-lane 18s](/rent/stargazer-18) if you want throughput and a finish that suits the theme.

The character slides land properly at this age too — the [Cape Fin](/rent/cape-fin-18) shark and the [Fossil Ridge](/rent/fossil-ridge-18) T-Rex both start at 6. They are the same chassis under different heads, they cost the same, and they move fewer riders per minute than anything with two lanes. Book one when the theme is the point and the guest list is moderate.

> If the party is large and the children are older, choose lanes over sculpts. A queue that never clears is the one thing that reliably ruins a birthday.

## Teenagers

Height, and after dark.

The [Thunderhead 28](/rent/thunderhead-28) and [Vortex Peak 26](/rent/vortex-peak-26) both start at 8 and are genuinely large — the Thunderhead needs 44 × 25 ft and three blowers, so check the site honestly before you fall for it. The [Highwater Tower 27](/rent/highwater-tower-27) is the middle option and has misting over the queue, which matters more at a July party than any amount of shade.

For an evening party, the [Nightglow Combo](/rent/nightglow-combo) is built for it — neon geometrics that only make sense once the lights are on.

## Mixed ages, which is most parties

The honest answer here is a combo, not a slide. The [Keep & Splash Combo](/rent/keep-and-splash-combo) puts a bounce floor next to a wet slide, so the three-year-old who will not go near the slide still has somewhere to be. The [Safari Station Combo](/rent/safari-station-combo) adds a crawl tunnel — a route for the smallest guests that is not the climb wall.

If the budget stretches and the ground is there, the [Grand Waterworks Combo](/rent/grand-waterworks-combo) covers the entire span in one unit: two slides, a climb wall, misting arches, a pool and a bounce zone, rated for twelve in rotation.

## Before you pick

Have the **youngest guest's age**, the **total guest count**, and the **measured pad** ready. Those three decide it, and [we will tell you which unit fits](/contact) — including when the one you had your heart set on does not.

---

**Related:** [What size slide for your guest count](/blog/what-size-water-slide-should-you-rent) · [Best age for inflatable slides](/blog/best-age-for-inflatable-water-slides) · [Water slide vs bounce house](/blog/water-slide-vs-bounce-house)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "fourth-of-july-water-slide-party",
    title: "Booking a Water Slide for the Fourth of July (Start in May)",
    excerpt:
      "The Fourth is the single hardest date of the year to book, and the heat is worse than people plan for. What to reserve, when to reserve it, and how to run the day so nobody melts.",
    metaTitle: "Fourth of July Water Slide Rental: Timing and Heat Planning",
    metaDescription:
      "How early to book a water slide for July 4th, which units suit a street party, and how to schedule around peak-afternoon heat across the southern US.",
    readingMinutes: 5,
    content: `Two things make the Fourth different from every other summer booking: everybody wants the same day, and it falls in the worst week of the year for heat.

Both are solvable. Neither is solvable in late June.

## Book by mid-May

Independence Day weekend is the tightest date on our calendar, and in the hottest markets it goes first. In Houston and Dallas, Memorial Day and Fourth of July weekends are typically gone about a month out. Phoenix and Las Vegas shift almost entirely to morning and evening slots, so the good times go before the poor ones do.

If you are reading this in June, book today and be flexible on the unit. If you are reading it in April, you can have exactly what you want.

## Pick the unit for a street, not a yard

Fourth of July parties are disproportionately block parties, and a block party has different constraints from a birthday.

The [Liberty 16](/rent/liberty-16) is the obvious one — red, white and blue marble on twin slip-lanes, and at 16 feet it is the shortest and least expensive of our racing slides. That height is a feature on a street: a 24-foot tower over a road is a different conversation with the neighbors and sometimes with the city.

For a genuinely large crowd, throughput beats theming. [Twin Falls 22](/rent/twin-falls-22) has a dual climb and no sculpt work, and it exists to keep a line moving. The [Grand Waterworks Combo](/rent/grand-waterworks-combo) covers a whole street's age range in one envelope — but it needs 45 × 25 feet and two independent circuits, so confirm both before you commit.

If the party is in a yard rather than on a road, any of the [dual-lane 18s](/rent/regatta-18) do the job, and the [Sundown 18](/rent/sundown-18) gradient does something the flag-themed units cannot: it looks right in photographs taken at nine in the evening.

## Plan the day around the heat, not the fireworks

This is the part people get wrong.

In Phoenix, midday in early July is genuinely dangerous heat, and shade over the queue matters more than anywhere else we deliver. Dallas runs triple digits from late June. Houston's constraint is different — humidity plus afternoon thunderstorms that build fast and pass quickly, where it is the wind rather than the rain that pauses an inflatable.

The practical schedule in almost every southern market:

- **Run the slide from late morning, and again after five.** The middle of the day is for shade and food.
- **Book a morning slot in the high-heat metros.** In Houston, a morning start usually misses the whole storm pattern.
- **Put shade over the line, not over the slide.** Children in the water are fine. Children waiting barefoot on hot ground are the problem.
- **Watch the surface, not the air temperature.** Dark vinyl runs hotter in direct sun — that is why we will suggest a shaded tower position for the [Deepwater 18](/rent/deepwater-18) or the [Redstone 18](/rent/redstone-18) on a very hot afternoon.

> A wet slide in Phoenix in July is not entertainment, it is the reason an outdoor party is survivable at all. Schedule it like infrastructure.

## The permissions nobody checks until it is too late

If the unit is going on a street, in a park or on HOA common ground, somebody has to say yes, and it is rarely the person who booked the slide.

- **Streets** need the city or the neighborhood association, usually with more notice around a holiday than at other times.
- **Parks** issue their own permits — Houston Parks and Recreation, Dallas Park and Recreation, Orange County in the Orlando area — and several venues want a certificate of insurance naming them, which needs requesting a week or two ahead rather than on the day.
- **HOAs** in places like Sugar Land and The Woodlands run rules on top of the city's.

Ask us for the certificate as soon as you know the venue wants one. It is routine; the delay is only ever the lead time.

## The wind clause

Fireworks weather and inflatable weather are not the same thing. A clear, breezy evening is perfect for one and can close the other — a sustained wind takes a unit down well before rain would. In Oklahoma City wind is the single biggest cause of a rescheduled inflatable, more than in any other market we serve.

Have a fallback in mind. We would much rather move a date than run a slide in a gust.

## Booking

Send us the **date**, the **ZIP**, whether it is a **street or a yard**, and a rough **head count**. For the Fourth specifically, tell us your preferred *time* as well — in the hot markets that is now part of availability, not a detail.

[Request your date here.](/contact)

---

**Related:** [Keeping a slide cool in extreme heat](/blog/water-slide-in-extreme-heat) · [When to book for summer](/blog/when-to-book-summer-water-slide) · [Block party planning](/blog/summer-block-party-water-slide)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "graduation-party-water-slide-ideas",
    title: "Water Slides at Graduation Parties: Planning for a Mixed-Age Crowd",
    excerpt:
      "A grad party is not a birthday. The guest list runs from toddlers to grandparents, the date is fixed months in advance, and May and June weekends are the tightest of the year.",
    metaTitle: "Graduation Party Water Slide Rental Ideas",
    metaDescription:
      "How to choose and book a water slide for a graduation party — mixed-age guest lists, fixed dates, tight May and June availability, and units that suit teenagers and adults.",
    readingMinutes: 5,
    content: `Graduation parties break most of the assumptions a party rental is usually built around. Worth planning against the differences rather than treating it as a birthday with older candles.

## The four things that make it different

**The date is not movable.** Ceremonies are scheduled by the school, which means half the families in your district want the same Saturday. In Los Angeles, graduation weekends in May and June are the tightest dates of the year. In Atlanta, late May through June is peak. Book as soon as the ceremony date is published — not when you start planning the party.

**The guest list is genuinely everyone.** Teenagers, their younger siblings, parents, grandparents, and family friends with toddlers. There is no single age to plan for.

**Adults will use it.** This is the party where they do. Anything you book should hold up to a 180-pound eighteen-year-old, not just to a nine-year-old.

**The photographs matter more than usual.** People are documenting a milestone. A neon bounce castle in the background of every picture is a choice, and often not the one the family would have made.

## Units that suit the crowd

**For throughput with a broad age range**, the [Grand Waterworks Combo](/rent/grand-waterworks-combo) is the most complete answer we have: two slides, a climb wall, misting arches, a splash pool and a separate bounce zone, rated for twelve in rotation. It needs 45 × 25 feet and two independent 20A circuits, so check the site early.

**For the teenagers specifically**, height is the draw. [Twin Falls 22](/rent/twin-falls-22) is two lanes and a dual climb with no theming, built to move a queue. [Vortex Peak 26](/rent/vortex-peak-26) winds riders around the outside of the tower before the drop, which makes the ride longer than the height suggests. Both start at 8 and hold up to adults.

**For the photographs**, the [Regatta 18](/rent/regatta-18) is the one to know about. Royal blue with gold trim, twin curved lanes — it reads as school and club colors rather than as rented equipment, and it is the unit we would put in the background of a graduation photograph on purpose. If your school's colors are warmer, the [Sundown 18](/rent/sundown-18) gradient does the same job.

**For the younger siblings**, add a small second unit rather than expecting them to share the big one. A [bounce house](/rent/crown-keep-bouncer) at $165 to $295 keeps the under-fives occupied and out of a queue they cannot safely be in, and it is the cheapest problem you will solve all day.

> The failure mode at a grad party is not the slide. It is thirty guests aged two to seventy with exactly one thing to do.

## Practical planning

**Adult supervision still applies.** With teenagers using a tall slide, one adult needs to be watching the unit rather than assuming eighteen-year-olds will self-regulate. They will not, and the height is real.

**Check the age floors.** Our tall units start at 8, and the big three are firm about it. A grad party with a four-year-old cousin needs a second option, not an exception.

**Two units means two circuits.** Most of our slides over 18 feet need two 20A circuits that are genuinely separate, and a second unit needs its own. Running four blowers off one household breaker is the most common on-the-day failure we see. Count outlets before you count units.

**Plan the time of day.** In Phoenix, Las Vegas and Dallas, an afternoon graduation party in June wants an evening slide slot. In coastal San Diego the opposite applies — June gloom keeps mornings grey and cool, and the good hours are later.

**Food and water do not mix on the unit.** No food, no drinks, no glasses on the slide. At a party with a buffet and adults holding cups, this needs saying out loud once rather than policing all afternoon.

## Booking timing, by market

If your ceremony is in May or June, we would want your request **six to eight weeks out**. Some specifics from the markets where it bites hardest:

- **Los Angeles** — graduation weekends are the tightest dates of the year.
- **Atlanta** — late May through June is peak for school events and graduations.
- **Charlotte** and **Nashville** — June is the busiest month, driven by end-of-school events.
- **Miami** — quinceañera and graduation season keeps spring weekends full.

[Send us the ceremony date](/contact) as soon as you have it, along with your ZIP, the guest count, and the youngest age attending. We will tell you what is still open.

---

**Related:** [Can adults use inflatable water slides?](/blog/can-adults-use-inflatable-water-slides) · [What size for your guest count](/blog/what-size-water-slide-should-you-rent) · [When to book for summer](/blog/when-to-book-summer-water-slide)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "water-slide-rentals-churches-schools-hoas",
    title: "Water Slide Rentals for Churches, Schools and HOAs",
    excerpt:
      "Organization bookings fail for different reasons than family ones: certificates of insurance, permit lead times, power that was never designed for three blowers, and throughput math nobody did.",
    metaTitle: "Water Slide Rentals for Churches, Schools & HOAs",
    metaDescription:
      "Planning an inflatable rental for a church fun day, school field day or HOA event — insurance certificates, permits, power requirements and throughput for large crowds.",
    readingMinutes: 6,
    content: `Family bookings go wrong over yard measurements. Organization bookings go wrong over paperwork and power, usually in the last ten days, and almost always over something that had a two-week lead time nobody knew about.

Here is the list in the order it will actually bite you.

## 1. The certificate of insurance, and its lead time

Most institutional venues require a certificate of insurance naming them as an additional insured before equipment comes on site. Schools and municipal parks nearly always; churches with their own campus sometimes; county parks in Orlando and Miami-Dade routinely.

This is normal and we issue them. The thing that catches people is that it is a **document with a turnaround**, and the request usually arrives the same week as the event.

**Ask on the day you book.** Send us the exact legal name of the entity to be named — "Oak Ridge Elementary PTA" is not the same as "Oak Ridge Independent School District", and a certificate naming the wrong one is worth nothing to the person checking it at the gate.

## 2. Permits, and who actually issues them

If you are on public ground, the authority is rarely the one you would guess, and neighboring jurisdictions run separate processes:

- **Houston** — Houston Parks and Recreation handles park reservations and will confirm whether your pavilion permits inflatables. HOAs in Sugar Land and The Woodlands often add rules on top.
- **Dallas** — Dallas Park and Recreation issues park permits; Plano and Frisco run their own separate processes.
- **Phoenix** — Phoenix Parks and Recreation handles ramada reservations, while Scottsdale, Tempe, Mesa and Gilbert each administer their own.
- **Orlando** — Orange County Parks and the City of Orlando both issue permits, and several venues want the insurance certificate as well.
- **Atlanta** — the city department handles Atlanta proper; DeKalb, Cobb and Gwinnett each run their own.

We deliberately do not tell you what your local ordinance says. Inventing a rule that turns out to be wrong is worse for you than being sent to the office that actually decides.

## 3. Power is the most common day-of failure

Church lawns, school fields and HOA common areas were not wired for this.

- Most of our slides over 18 feet need **two 20A circuits that are genuinely separate** — not two outlets on the same breaker.
- The [Thunderhead 28](/rent/thunderhead-28) runs **three 2 HP blowers**.
- The [Grand Waterworks Combo](/rent/grand-waterworks-combo) needs two circuits that are not shared with a kitchen — which, at a church fun day with urns and warming trays running, is a real constraint rather than a theoretical one.
- The [Stampede Bull](/rent/stampede-bull) needs a **dedicated** circuit.

If you are running multiple units, add up the blowers before you book, then find out what the site can actually deliver. Where the answer is short, a generator solves it — and a generator identified three weeks out costs a fraction of one found at 8am on a Saturday. Our [generator guide](/blog/do-water-slide-rentals-need-a-generator) covers sizing.

> The single most useful thing an event organizer can do is walk the site with a phone and photograph every outlet, then send us the photographs. It has caught more problems than any question we ask.

## 4. Do the throughput math

This is the difference between a fun day and two hundred children in a line.

A sculpted single-lane slide like the [Privateer 18](/rent/privateer-18) takes one rider at a time. Beautiful, and wrong for a crowd. What moves people is lanes and dual climbs:

- [Twin Falls 22](/rent/twin-falls-22) — two lanes, dual climb, no theming, built for exactly this.
- [Thunderhead 28](/rent/thunderhead-28) — twin 28-foot lanes and a pool sized for both, rated for ten in rotation. It is an event piece; it will not fit a backyard and is not meant to.
- [Grand Waterworks Combo](/rent/grand-waterworks-combo) — rated for twelve in rotation, and it covers several age brackets at once, which matters when the congregation or the student body is the guest list.

For a large event, two mid-size dual-lane units usually beat one spectacular single-lane one. Two queues at half the length each is a better afternoon than one queue nobody reaches the front of.

## 5. Plan for the age spread

Church and HOA events have no age limit on attendance, which means a unit with an age floor of 8 excludes most of the crowd.

The practical layout is a large unit for the older children and a [bounce house](/rent/big-top-bouncer) or [combo](/rent/safari-station-combo) for the under-sixes, sited far enough apart that the queues do not merge. The [Safari Station Combo](/rent/safari-station-combo) has a crawl tunnel specifically so the smallest guests have a route that is not the climb wall.

And staff the supervision. At a family party one parent watches; at a two-hundred-person event you want a named adult per unit for the whole session, rotating, with someone counting.

## 6. Booking windows for community events

The fall festival run in October is the busiest institutional stretch of the year — in Dallas it is contested by every church and school in the metroplex, and Charlotte, Nashville and Atlanta all see the same second peak. Late May and June go early for end-of-school events.

For a October or May date, request **eight weeks out**. That is not a sales line; it is when the large units stop being available.

## What to send us

The **date**, the **venue address**, the **expected attendance**, the **age range**, **photographs of the site including the outlets**, and the **exact legal entity name** for the certificate of insurance.

With those, [we can quote and issue paperwork in one pass](/contact) instead of five.

---

**Related:** [Are rentals insured?](/blog/are-water-slide-rentals-insured) · [Corporate and community events](/blog/water-slides-corporate-community-events) · [Do you need a generator?](/blog/do-water-slide-rentals-need-a-generator)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "best-inflatable-water-slides-to-buy-2026",
    title: "Buying an Inflatable Water Slide: The Specs That Decide It",
    excerpt:
      "If you are buying rather than renting, the finish is the least important thing on the page. Vinyl weight, blower count, anchor points and footprint are what you live with.",
    metaTitle: "Buying an Inflatable Water Slide: What Actually Matters",
    metaDescription:
      "A buyer's guide to commercial inflatable water slides — vinyl, blowers, anchor points, footprint and throughput, and how to match a unit to how you will actually use it.",
    readingMinutes: 6,
    content: `Buying is a different decision from renting, and most buying guides do not acknowledge it. When you rent, a bad choice costs you one afternoon. When you buy, you live with the footprint, the blower count and the storage problem for years.

Here is what to weigh, roughly in the order it will matter to you.

## Commercial-grade is not a marketing word

There is a real line between a consumer inflatable and a commercial one, and it is not the price.

Commercial units are built from heavy reinforced PVC vinyl, with welded rather than stitched seams at the stress points, reinforced anchor patches, and blowers rated for continuous running over a full day. A consumer slide from a big-box store is built for a family of four for a few weekends a summer, and it will not survive a single church fun day.

If anyone will use the unit other than your own household — a school, a congregation, paying customers — commercial is the only honest option. Our [commercial buying guide](/blog/commercial-water-slide-buying-guide) goes deeper on the specifications themselves, and the [residential versus commercial comparison](/blog/residential-vs-commercial-water-slide) is worth reading before you spend anything.

## The four specs to compare

**Footprint, not height.** Height sells; footprint determines whether you can ever use it. A standard 18-foot dual-lane slide needs about 39 × 20 feet of level ground. If the site you actually own is smaller than that, no amount of enthusiasm fixes it — and this is the single most common regret we hear from buyers.

**Blower count and circuits.** One blower on one household outlet is a completely different ownership experience from three blowers needing three separate circuits. Our units above 18 feet generally need two 20A circuits; the [Thunderhead 28](/rent/thunderhead-28) needs three 2 HP blowers. Before you buy anything large, find out what your site's electrical can actually carry.

**Throughput.** How many riders per minute, which is decided by lanes rather than by size. A sculpted single-lane slide moves one rider at a time. A dual-lane with a dual climb moves a queue. If the unit will face crowds, lanes are worth more than any sculpt.

**Anchor points.** Count them and look at how they are reinforced. This is the part that fails first on a cheap unit and the part that matters most on a windy site.

> Buy for the site you have and the crowd you will actually face. Everything else on the spec sheet is negotiable; those two are not.

## Matching the unit to how you will use it

**A family buying for their own backyard.** You want compact and single-circuit. The [Sundown 16](/rent/sundown-16) needs 21 × 15 feet, which is less ground than most bounce houses, and runs off one outlet. The [Surge 20](/rent/surge-20) is the tallest slide we run that does not need a second circuit — twenty feet on 33 × 18 feet and a single 20A outlet, at the cost of being single-lane. For young children, the [Little Harbor Junior](/rent/little-harbor-junior) is built for 2 to 6 and nothing else.

**A church, school or HOA buying for repeat community use.** Throughput and age range decide it. The [Grand Waterworks Combo](/rent/grand-waterworks-combo) covers several age brackets in one unit and is rated for twelve in rotation. A dual-lane unit like [Twin Falls 22](/rent/twin-falls-22) is the workhorse choice — no theming to date it, and a dual climb so the queue keeps moving. Budget for storage: these are large, heavy items that must be fully dry before they go away.

**Someone buying to rent out.** See the [rental business guide](/blog/start-a-water-slide-rental-business), but the short version is that a plain, high-throughput dual-lane unit will out-earn a spectacular themed one, because it suits more bookings and dates more slowly.

## Theming is a real decision, just a later one

Sculpted character slides — a [shark](/rent/cape-fin-18), a [T-Rex](/rent/fossil-ridge-18), a [dragon](/rent/ember-ridge-18) — cost more and move fewer riders per minute. Underneath, several of ours are the same chassis with a different head on it: same 18-foot height, same 39 × 20 ft footprint, same age floor.

That is worth knowing when you buy. You are paying for the sculpt, which is a legitimate thing to buy if the unit's job is to be the object everyone photographs. It is a poor thing to buy if its job is to keep two hundred children moving.

Plain marbled finishes age better, in the practical sense: a dinosaur is a dinosaur party, while a [dual-lane blue slide](/rent/reefline-18) suits everything.

## The costs after the purchase

Budget for these, because they are the ones people forget:

- **Storage.** Dry, rodent-free, and large. A unit put away damp is a unit with mold in it.
- **Cleaning and drying time** after every use — our [cleaning and storage guide](/blog/clean-dry-store-inflatable-water-slide) covers the routine.
- **Blowers.** Consumables in practice. Keep a spare if the unit earns money.
- **Stakes and ballast.** Hard ground and artificial turf cannot be staked at all, and ballast is heavy.
- **Insurance**, if anyone outside your household will use it.

## Rent first

The genuinely useful advice: rent the exact unit you are thinking of buying, for one event, before you buy it. You will learn more about the footprint, the setup time and the queue in one afternoon than from any specification sheet — including ours.

Most of our catalog is available both ways. [Ask us what a unit costs to own](/contact), and rent it first.

---

**Related:** [Commercial buying guide](/blog/commercial-water-slide-buying-guide) · [Rent or buy?](/blog/rent-or-buy-water-slide) · [Residential vs commercial](/blog/residential-vs-commercial-water-slide)`,
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "start-a-water-slide-rental-business",
    title: "Starting a Water Slide Rental Business: The Unromantic Version",
    excerpt:
      "The equipment is the easy part. Seasonality, insurance, storage and the fact that your entire year happens on about thirty Saturdays are what decide whether it works.",
    metaTitle: "How to Start a Water Slide Rental Business",
    metaDescription:
      "An honest look at starting an inflatable water slide rental business — startup costs, seasonality, insurance, storage, and the throughput math behind which units to buy first.",
    readingMinutes: 7,
    content: `This is a real business with real margins, and it is also more constrained than the "passive income" framing suggests. If you are considering it, the constraints are more useful to know than the upside.

## Your year is about thirty Saturdays

This is the single most important thing to understand, and most guides skip it.

Demand is not spread across the year, and it is not even spread across the week. It concentrates on weekend days inside a season that varies enormously by market:

- **Orlando and Miami** — effectively year-round. Miami's strongest stretch is December through April, which is genuinely unusual.
- **Houston, New Orleans, San Antonio, Austin** — roughly eight months, March through October.
- **Charlotte, Nashville, Atlanta, Oklahoma City** — closer to five, May through September.
- **Phoenix and Las Vegas** — long seasons with a hole in the middle, because peak summer afternoons are too hot to run and demand shifts to mornings and evenings.

In a five-month market you have perhaps 40 weekend days, and weather will take some. Every piece of equipment you buy has to earn its keep inside that window, which is why utilization — not unit price — is the number that decides whether this works.

## What you actually need to start

**Equipment.** One good unit beats three cheap ones. Commercial-grade only: reinforced vinyl, welded seams at stress points, proper anchor patches, and blowers rated for all-day running. Consumer units will not survive paid use and will end your business the first time one fails at somebody's party.

**A vehicle that can carry it.** These are heavy and bulky. A pickup or van is the entry requirement, not an upgrade.

**Storage.** Dry, secure, large, and available in the off-season. This is the cost people forget entirely, and in the markets with the shortest seasons you are paying for it for seven months while earning nothing.

**Insurance.** Non-negotiable. General liability for inflatable operations, and the capacity to issue certificates naming a venue as additional insured — schools and municipal parks will not let you on site without one, and those bookings are among the best in the calendar.

**A booking system and a way to answer the phone.** Most rental enquiries are lost to slow replies rather than to price.

> Utilization is the whole business. A $3,000 unit booked 25 times a season beats a $6,000 unit booked 8 times, and the second one still costs you storage all winter.

## Which units to buy first

Resist the spectacular one. The economics favor boring.

**Buy for throughput and breadth of booking:**

- A **plain dual-lane slide** — something like [Twin Falls 22](/rent/twin-falls-22), no theming, dual climb, built to move a queue. It suits birthdays, church events, school field days and block parties without excluding any of them.
- A **combo unit** — the [Keep & Splash Combo](/rent/keep-and-splash-combo) type of thing, bounce plus wet slide. Mixed-age birthdays are the most common booking there is, and a combo wins them.
- A **bounce house** — cheap to buy, cheap to store, books constantly, and runs indoors in the shoulder season when nothing wet will sell. In a five-month market this is what keeps money moving in April and October.

**Resist at the start:**

- **Sculpted character slides.** A [shark](/rent/cape-fin-18) or a [T-Rex](/rent/fossil-ridge-18) costs more, moves fewer riders per minute, and only books when someone wants that specific theme. They are good third or fourth purchases and poor first ones.
- **The largest units.** Something like the [Thunderhead 28](/rent/thunderhead-28) needs 44 × 25 feet and three 2 HP blowers, which rules out most residential bookings before price is discussed. It earns at festivals and school events — a real market, but not one you have relationships in on day one.

## The operational realities

**Setup is 30 to 60 minutes per unit**, plus travel, plus pickup. Two units in a day in different suburbs is a full day of work.

**Weather will cancel bookings.** In Oklahoma City wind is the biggest single cause of a rescheduled inflatable — more than rain. Decide your policy before you need it, put it in writing, and expect to honor it in your first season.

**Every unit must be cleaned, sanitized and fully dried before storage.** Dried is the operative word: a unit put away damp grows mold and becomes unrentable. In practice this means you need somewhere to lay out a 34-foot slide to dry, which is a space problem as much as a time one.

**You are also responsible for site judgment.** Turning down a booking whose yard cannot take the unit, or whose power cannot carry the blowers, is part of the job. The operators who fail are usually the ones who said yes to everything.

## The honest financial shape

Revenue per booking in this market runs roughly $155 to $570 a day for the unit, plus a delivery fee. Gross margins on a booking are high, because the marginal cost of a rental is fuel, labor and cleaning.

The costs that decide profitability are the fixed ones: insurance, storage, the vehicle, and the equipment sitting idle for the off-season. That is why utilization dominates. Doubling your bookings roughly doubles your profit; buying a second unit does not, unless you can actually fill it.

Do the arithmetic for your own market before you buy anything: realistic season length, realistic weekend days, a conservative booking rate, and your real fixed costs.

## If you are buying equipment

We sell as well as rent, so we have a stake in your answer — worth saying plainly. What we would tell you regardless is to **rent the unit for one event before buying it**. Setup time, footprint in a real yard and the length of the queue teach you more in an afternoon than a spec sheet does.

[Ask us what a unit costs to own](/contact), and what it costs to rent first.

---

**Related:** [Commercial buying guide](/blog/commercial-water-slide-buying-guide) · [Buying an inflatable water slide](/blog/best-inflatable-water-slides-to-buy-2026) · [Cleaning, drying and storage](/blog/clean-dry-store-inflatable-water-slide)`,
  },
];

/** Rough words-per-minute used to sanity-check the stored readingMinutes. */
const WPM = 200;

async function main() {
  // Guard: every internal /rent/ and /shop/ link must resolve to a live product,
  // and every /blog/ link to a real post. A stale slug fails the run.
  const validProducts = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map(
      (p) => p.slug,
    ),
  );
  const validPosts = new Set(
    (await prisma.blogPost.findMany({ select: { slug: true } })).map(
      (p) => p.slug,
    ),
  );

  const problems: string[] = [];
  for (const post of POSTS) {
    for (const m of post.content.matchAll(
      /\]\(\/(rent|shop)\/([a-z0-9-]+)\)/g,
    )) {
      if (!validProducts.has(m[2]!)) {
        problems.push(`${post.slug}: dead product link /${m[1]}/${m[2]}`);
      }
    }
    for (const m of post.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      if (!validPosts.has(m[1]!)) {
        problems.push(`${post.slug}: dead blog link /blog/${m[1]}`);
      }
    }
  }

  if (problems.length) {
    console.error(
      "\n✗ link check failed:\n" + problems.map((p) => `  ${p}`).join("\n"),
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✓ link check passed (${POSTS.length} posts)\n`);

  let written = 0;
  for (const post of POSTS) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true, status: true },
    });

    if (!existing) {
      console.log(`  ⚠ not found, skipping: ${post.slug}`);
      continue;
    }

    const words = post.content.split(/\s+/).length;
    console.log(
      `${DRY ? "[dry] " : ""}${post.slug}  (${words} words, ~${Math.round(words / WPM)} min, ${existing.status} -> PUBLISHED)`,
    );

    if (!DRY) {
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title: { en: post.title },
          excerpt: { en: post.excerpt },
          content: { en: post.content },
          metaTitle: { en: post.metaTitle },
          metaDescription: { en: post.metaDescription },
          readingMinutes: post.readingMinutes,
          status: "PUBLISHED",
        },
      });
    }
    written++;
  }

  // The byline still carried the previous brand's team name, which would have
  // shipped on every article in this cluster. Same reasoning as lib/brand.ts.
  const author = await prisma.author.findFirst({
    where: { name: "The Big Wave Team" },
    select: { id: true },
  });
  if (author) {
    console.log(
      `\n${DRY ? "[dry] " : ""}author byline: "The Big Wave Team" -> "The Splash Republic Team"`,
    );
    if (!DRY) {
      await prisma.author.update({
        where: { id: author.id },
        data: {
          name: "The Splash Republic Team",
          bio: {
            en: "We deliver, set up and anchor inflatable water slides across the United States. Everything here comes from doing that — including the parts that talk you out of a booking.",
          },
        },
      });
    }
  }

  console.log(
    `\n${DRY ? "[dry] would publish" : "published"} ${written}/${POSTS.length} posts.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
