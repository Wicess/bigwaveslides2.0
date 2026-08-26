/*
 * write-fall-posts.ts
 *
 * Publishes two new articles into the gaps the existing 52 leave open.
 *
 * WHY THESE TWO
 * `events` was the thinnest category on the blog (5 posts) and carried nothing
 * at all about fall festivals — despite October being the busiest institutional
 * stretch of the year in this trade, and despite the site's own churches/
 * schools/HOAs guide telling organisers to request eight weeks out. Late August
 * is exactly when that booking window opens, so the page needed to exist now
 * rather than in October when it is already too late to act on.
 *
 * The second fills the seasonal cliff. Most states' wet season closes in
 * September (see lib/state-profiles.ts), and the site had no page explaining
 * what is still bookable after it does. That is the question every customer in
 * a northern state is about to ask, and the honest answer — dry units, indoors —
 * is also the half of the catalog that earns money in the off-season.
 *
 * Both follow the house rules: real catalog numbers, real footprints and
 * heights read off the products, no invented statistics, and no claim the
 * system cannot back. Every internal link is checked against the live database
 * before anything is written.
 *
 * Run: npm run db:write-fall-posts [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

type NewPost = {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  categorySlug: string;
  tagSlugs: string[];
  readingMinutes: number;
  content: string;
};

const POSTS: NewPost[] = [
  {
    slug: "fall-festival-inflatable-rentals",
    title: "Booking Inflatables for a Fall Festival: Start Eight Weeks Out",
    excerpt:
      "October is the busiest month in this trade and it is decided in August. What to book for a church or school fall festival, why it should run dry, and the paperwork that has a lead time nobody plans for.",
    metaTitle: "Fall Festival Inflatable Rentals — Booking Guide",
    metaDescription:
      "How to book inflatables for a church or school fall festival: why October fills first, running dry in autumn, throughput for large crowds, insurance certificates and power.",
    categorySlug: "events",
    tagSlugs: ["events", "community", "seasonal", "planning"],
    readingMinutes: 6,
    content: `October is the busiest month of the year for inflatable rentals, and almost nobody books it in time. The reason is arithmetic rather than popularity: every church fall festival, every school trunk-or-treat and every harvest event in a district lands on the same three or four Saturdays, and there is only one of each unit.

If your festival is in October, the decisions worth making are the ones you make in August.

## Why the October weekends go first

A fall festival is not competing with birthday parties for a date. It is competing with every other fall festival in your area, all of which want the same late-October Saturday afternoon.

That concentration is what makes the month different from summer. In June a busy weekend means some units are gone; in late October it can mean everything of a given size is gone across the whole metro. Our [churches, schools and HOAs guide](/blog/water-slide-rentals-churches-schools-hoas) puts the request window at eight weeks out, and October is the month that number was written for.

## In most states, run it dry

By October the wet season has closed almost everywhere. Charlotte, Nashville, Atlanta and Oklahoma City are done by the end of September; Dallas runs to early October; only Florida, Hawaii and the warmest parts of the southwest are still comfortably wet. Your [state page](/water-slide-rentals) has the local window.

That is not a problem — it is what dry units are for. A bounce house runs the same in 60°F as in 90°F, and most of our combos run wet or dry with no change to the setup, so a [Prism Combo](/rent/prism-combo) or a [Safari Station Combo](/rent/safari-station-combo) gives you a slide without the water.

> The mistake is booking a wet slide for late October because it worked in July. Children who get soaked at 55°F leave early, and the unit stops being the attraction it was in summer.

## Throughput is the actual problem

A festival is a crowd, not a party. The failure mode is not a boring unit — it is two hundred children in one line.

What moves a crowd is lanes and separate units, not spectacle:

- **[Twin Falls 22](/rent/twin-falls-22)** — two lanes and a dual climb, no theming, built to reset a queue every couple of minutes. Runs dry.
- **[Grand Waterworks Combo](/rent/grand-waterworks-combo)** — rated for twelve riders in rotation and covers several age brackets at once, which matters when the whole congregation is the guest list. Needs 45 × 25 ft and two independent circuits.
- **Two mid-size units instead of one large one.** Two queues at half the length each is a better afternoon than one queue nobody reaches the front of.

Avoid the sculpted single-lane slides for this. A [shark](/rent/cape-fin-18) or a [dragon](/rent/ember-ridge-18) takes one rider at a time — magnificent for a birthday, wrong for a crowd.

## Plan for the age spread

Festival attendance has no age limit, so a unit with an age floor of 8 excludes most of the crowd. The practical layout is a large unit for the older children and a [bounce house](/rent/big-top-bouncer) or a [combo with a crawl tunnel](/rent/safari-station-combo) for the under-sixes, sited far enough apart that the two queues do not merge.

Staff it properly too. At a family party one parent watches; at a three-hundred-person event you want a named adult per unit for the whole session, rotating.

## The paperwork has a lead time

This is what actually delays October bookings, and it is entirely avoidable.

Most schools, parishes and municipal sites require a **certificate of insurance naming them as additional insured** before equipment comes on site. We issue them as a matter of course — but it is a document with a turnaround, and the request usually arrives the same week as the event.

Ask on the day you book, and send the **exact legal entity name**. "Oak Ridge Elementary PTA" is not the same as "Oak Ridge Independent School District", and a certificate naming the wrong one is worth nothing to the person checking it at the gate.

If you are on public ground, the permit authority is rarely the one you would guess and neighbouring jurisdictions run separate processes. Your state page names the right office to ask.

## Power, and the thing organisers forget

Church lawns and school fields were not wired for this. Most of our units above 18 ft need **two 20A circuits that are genuinely separate** — not two sockets on one breaker — and the [Thunderhead 28](/rent/thunderhead-28) runs three 2 HP blowers.

At a fall festival the kitchen is usually running at the same time: urns, warmers, a fryer. That is a real constraint, not a theoretical one. Add up the blowers before you book, then walk the site with a phone and photograph every outlet. Where the answer comes up short, a generator solves it — and one identified three weeks out costs a fraction of one found at 8am on the day.

## Daylight closes earlier than you think

An October festival that starts at four in the afternoon is running in dusk by the time it ends. Inflatables need light for supervision, so either start earlier than a summer event would, or plan lighting over the queue and the unit.

## What to send us

The **date**, the **venue address**, the **expected attendance**, the **age range**, **photographs of the site including the outlets**, and the **exact legal entity** for the certificate of insurance.

With those, [we can quote and issue the paperwork in one pass](/contact) instead of five — which in October is the difference between having the unit you wanted and taking what is left.

---

**Related:** [Rentals for churches, schools and HOAs](/blog/water-slide-rentals-churches-schools-hoas) · [Do you need a generator?](/blog/do-water-slide-rentals-need-a-generator) · [Wet or dry?](/blog/wet-or-dry-inflatable-guide)`,
  },

  {
    slug: "what-to-rent-when-its-too-cold-for-a-water-slide",
    title: "Too Cold for a Water Slide? What Still Works",
    excerpt:
      "The wet season closes in September across most of the country — and in Vermont it barely opens. Here is what is still bookable once it does, and the ceiling height that decides whether it goes indoors.",
    metaTitle: "What to Rent When It's Too Cold for a Water Slide",
    metaDescription:
      "When the water slide season ends by state, and what still works after it: dry bounce houses, wet-or-dry combos, indoor ceiling and power requirements, and what genuinely doesn't.",
    categorySlug: "guides",
    tagSlugs: ["guides", "seasonal", "tips", "rentals"],
    readingMinutes: 6,
    content: `The honest answer to "is it too cold for a water slide" is that it depends enormously on where you are, and the gap between states is far bigger than most people expect.

## When your season actually ends

Roughly speaking:

- **Closes in September** — Charlotte, Nashville, Atlanta, Oklahoma City and most of the Midwest and Northeast.
- **Barely opens at all** — Vermont, Maine, New Hampshire, Montana, Wyoming and Alaska run a wet window measured in weeks, not months. In Vermont it is effectively July.
- **Runs to October** — Dallas, Houston, Phoenix, Las Vegas, the Carolina Lowcountry.
- **Never really closes** — Florida, Hawaii, and the warmer parts of southern California and south Texas.

Your [state page](/water-slide-rentals) carries the local window, along with what the ground does to an anchor there.

Below about 70°F a wet slide stops being fun. Children get cold faster than adults expect, they leave the unit early, and you have paid for an attraction nobody is using. That is the practical threshold, not a rule.

## Dry is the whole answer

Bounce houses run dry by design, which means the season is irrelevant to them. They go up outdoors on a mild autumn afternoon and indoors for the rest of the year — and indoors, weather stops mattering completely.

This is why the dry half of the catalog carries the calendar in northern states. In Vermont or Minnesota, an operator that only rents water slides is running a business with a six-week year.

> Nothing about a bounce house changes in October. The only question is whether it is going inside, and that is a ceiling-height question rather than a weather one.

## Indoors: what actually decides it

Four things, in the order they cause problems.

**Ceiling height.** This is the one that stops bookings. Our bounce houses stand between 12 and 14 ft, and a unit needs roughly two feet of clearance above it:

- **12 ft** — the [Homestead Bouncer](/rent/homestead-bouncer) and the [Rose Keep Bouncer](/rent/rose-keep-bouncer) are the lowest we carry, and the ones that fit a hall a taller unit will not.
- **13 ft** — the [Crown Keep](/rent/crown-keep-bouncer), [Sugarhouse](/rent/sugarhouse-bouncer) and [Dreamfield](/rent/dreamfield-bouncer) bouncers.
- **14 ft** — the [Big Top Bouncer](/rent/big-top-bouncer) is the tallest, and needs a genuine gym rather than a parish hall.

Measure to the lowest obstruction — a beam, a light fitting, a basketball hoop — not to the highest point of the roof.

**The doorway.** The unit arrives deflated but it is bulky. A standard double door is usually fine; a narrow single door with a turn behind it often is not.

**Anchoring.** Indoors we cannot stake, so units are held with weighted sandbags. That is routine, but it means the floor needs to take the weight and the footprint needs to be clear.

**Power.** One standard grounded outlet for most bounce houses, ideally on its own circuit. Halls with a kitchen running at the same time are where this gets tight.

## Combos give you a slide without the water

If what the children actually want is a slide, most of our combo units run **wet or dry with no change to the setup**:

- [Prism Combo](/rent/prism-combo) — the smallest combo footprint we carry at 31 × 20 ft, which is roughly what a large bounce house alone needs.
- [Keep & Splash Combo](/rent/keep-and-splash-combo) — a castle bounce floor with a slide off the side, so the three-year-old who will not go near the slide still has somewhere to be.
- [Metro Heroes Combo](/rent/metro-heroes-combo) — a climb wall and squeeze pillars inside, which holds older children far longer than an empty bounce floor.

Run dry, these are autumn and winter units as much as summer ones.

## What genuinely does not work

Worth saying plainly, because we would rather turn a booking down than take it:

- **A wet slide in the cold.** We will set one up if you insist, but below about 70°F it will not be used the way you are imagining.
- **The [Little Harbor Junior](/rent/little-harbor-junior)** — it is a toddler *water* unit with a shallow pool, so it is a summer booking only.
- **Anything outdoors in sustained wind.** Autumn is windier than summer in much of the country, and wind closes an inflatable well before cold does. Oklahoma and the plains states are where this bites hardest.

## The off-season is the easy time to book

One genuine upside: availability. The October fall-festival run is the exception, but November through February is the quietest stretch of the year, and a date three days out is usually possible where the same request in June would not be.

Pricing does not change either — bounce houses run $165 to $295 a day and combos $280 to $570, plus the flat $30 delivery fee, in February exactly as in July.

[Tell us your date, your ZIP and whether it is going indoors](/contact) — and if it is indoors, the ceiling height. That one measurement answers most of the question.

---

**Related:** [Wet or dry — how to choose](/blog/wet-or-dry-inflatable-guide) · [When is water slide season?](/blog/water-slide-season-state-by-state) · [Water slide vs bounce house](/blog/water-slide-vs-bounce-house)`,
  },
];

async function main() {
  // Link check — every internal target must resolve before anything is written.
  const products = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map(
      (p) => p.slug,
    ),
  );
  const posts = new Set(
    (await prisma.blogPost.findMany({ select: { slug: true } })).map(
      (p) => p.slug,
    ),
  );
  const ours = new Set(POSTS.map((p) => p.slug));

  const problems: string[] = [];
  for (const post of POSTS) {
    for (const m of post.content.matchAll(
      /\]\(\/(rent|shop)\/([a-z0-9-]+)\)/g,
    )) {
      if (!products.has(m[2]!))
        problems.push(`${post.slug}: dead product /${m[1]}/${m[2]}`);
    }
    for (const m of post.content.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      if (!posts.has(m[1]!) && !ours.has(m[1]!)) {
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

  const author = await prisma.author.findFirst({ select: { id: true } });

  for (const post of POSTS) {
    const category = await prisma.blogCategory.findUnique({
      where: { slug: post.categorySlug },
      select: { id: true },
    });
    const tags = await prisma.tag.findMany({
      where: { slug: { in: post.tagSlugs } },
      select: { id: true, slug: true },
    });
    const missingTags = post.tagSlugs.filter(
      (t) => !tags.some((x) => x.slug === t),
    );
    if (missingTags.length)
      console.log(`  (tags not found, skipped: ${missingTags.join(", ")})`);

    const words = post.content.split(/\s+/).length;
    const exists = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true },
    });

    console.log(
      `${DRY ? "[dry] " : ""}${exists ? "update" : "create"}  ${post.slug}  (${words} words, ${post.categorySlug})`,
    );
    if (DRY) continue;

    const data = {
      title: { en: post.title },
      excerpt: { en: post.excerpt },
      content: { en: post.content },
      metaTitle: { en: post.metaTitle },
      metaDescription: { en: post.metaDescription },
      readingMinutes: post.readingMinutes,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
      ...(category ? { categoryId: category.id } : {}),
      ...(author ? { authorId: author.id } : {}),
    };

    // `set` replaces a relation and is update-only; `connect` attaches on
    // create. Using `set` for both fails the create with a validation error.
    const tagIds = tags.map((t) => ({ id: t.id }));
    if (exists) {
      await prisma.blogPost.update({
        where: { id: exists.id },
        data: { ...data, tags: { set: tagIds } },
      });
    } else {
      await prisma.blogPost.create({
        data: { slug: post.slug, ...data, tags: { connect: tagIds } },
      });
    }
  }

  console.log(
    `\n${DRY ? "[dry] would publish" : "published"} ${POSTS.length} posts.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
