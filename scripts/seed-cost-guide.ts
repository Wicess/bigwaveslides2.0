/*
 * seed-cost-guide.ts
 *
 * Publishes the water slide rental cost guide.
 *
 * WHY: "how much does it cost to rent a water slide" is the highest-volume
 * query in this niche, and the site currently has no page for it — the old post
 * was retired because it was word-for-word identical to bigwaveslides.com.
 * Retiring it was right; leaving the topic uncovered was not.
 *
 * This is written from scratch, from an operator's side of the transaction: what
 * the line items actually are, why a wet slide costs more than a dry one, and
 * what makes a cheap quote get expensive later. It shares no sentence with the
 * retired post, and it uses Splash Republic's own numbers rather than a generic
 * national range, which is the part a competitor cannot copy.
 *
 * Run: npm run db:seed-cost-guide
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SLUG = "what-a-water-slide-rental-actually-costs";

const CONTENT = `Most inflatable water slide rentals in the US land between **$200 and $600 a day**. That range is wide because it covers two different things — a 15-foot slide for a six-year-old's birthday and a 27-foot dual-lane tower for a church festival are not the same product, and they should not cost the same.

Here is what actually sets the number, from the side of the business that has to load the truck.

## Size is most of the price

Height and lane count drive nearly everything else: the weight of the unit, the size of the blower, how many people it takes to set up, and how much space it needs on the truck.

| Slide | Typical day rate |
|---|---|
| Junior / toddler (10–15 ft) | $150 – $230 |
| Single-lane backyard (16–18 ft) | $250 – $340 |
| Dual-lane racer (18–22 ft) | $330 – $420 |
| Tall / tower (24–28 ft) | $400 – $580 |
| Combo (bounce + slide) | $270 – $400 |

A dual lane costs 30–40% more than a comparable single, and it is usually worth it. Two lanes move roughly twice the riders per hour, which matters far more at a school field day or a festival than it does at a backyard party of twelve.

## Wet costs more than dry — the same slide

The unit is identical. The price is not, and it is not a markup for the sake of it:

- **Longer setup.** A wet slide needs a water line run, the pool section staked and levelled, and a drainage check so you are not flooding a neighbour's yard.
- **Heavier teardown.** A wet 20-foot slide comes back up soaked, which is the difference between two people and four.
- **Drying and sanitising** before it can go out again. That is a day of turnaround the unit is not earning.

Expect roughly **15–20% more** for a wet setup. In cooler months most operators — us included — will run the same slide dry for less.

## The line items that surprise people

**Delivery.** Ours is a flat $30 within our service areas. Watch for companies that quote a low day rate and add mileage on top; ask for the all-in number before you compare.

**Generator.** Every inflatable needs a blower running continuously. If your site has no outlet within about 100 feet — a park, a field, most farm sites — that is a generator, and it is a real cost.

**Attendant.** Some venues and most school districts require one. Worth asking before you book, not after.

**Overnight or multi-day.** A second day is never double. Season-long placements at a pumpkin patch or a camp are quoted as a run and land far below the day rate multiplied out.

**Permits and insurance.** Private yards rarely need anything. Parks, schools and public sites usually need a certificate of insurance naming the venue — free from any legitimate operator, but it takes time to route, and it is the single most common reason a booking gets held up.

## What a cheap quote usually leaves out

A rate well under the ranges above is normally one of four things: a residential-grade unit sold as commercial, no insurance, delivery billed separately, or a setup where you do the anchoring. The fourth is the one that hurts — anchoring is what stops an inflatable moving in wind, and it is not a customer job.

Ask any operator two questions: *is that the all-in price?* and *are you insured, and can I have the certificate?* The answers tell you most of what you need.

## When you book changes what you pay

Not the rate — the availability. October is the busiest month of the year in this industry, and the last two weekends before Halloween sell out first. Spring birthday season and the end-of-school run in May are close behind. Booking three to four weeks out costs the same as booking three days out; the difference is whether the slide you actually wanted is still free.

## How we price it

Rentals start at $199 a day. Delivery, setup, anchoring, sanitising and collection are included — the quote you see is the number you pay, and nothing is charged online. You reserve with 50% and settle the balance 48 hours before the event, or pay in full if you would rather be done with it.

Check your date and you will see the whole breakdown — slide, transport, taxes, deposit and balance — before you commit to anything.`;

async function main() {
  const category = await prisma.blogCategory.findFirst({
    where: { slug: "pricing" },
    select: { id: true },
  });
  const author = await prisma.author.findFirst({ select: { id: true } });

  const data = {
    title: { en: "What a Water Slide Rental Actually Costs" },
    excerpt: {
      en: "Most inflatable water slide rentals run $200–$600 a day. Here is what sets the number — size, wet versus dry, delivery, generators and insurance — and what a suspiciously cheap quote usually leaves out.",
    },
    content: { en: CONTENT },
    metaTitle: { en: "Water Slide Rental Cost — What You Actually Pay (2026)" },
    metaDescription: {
      en: "Real water slide rental prices by size, why wet costs more than dry, the add-ons that catch people out, and how to spot a quote that is missing something.",
    },
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
    readingMinutes: 6,
    featured: true,
    ...(category ? { categoryId: category.id } : {}),
    ...(author ? { authorId: author.id } : {}),
  };

  const existing = await prisma.blogPost.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.blogPost.update({ where: { slug: SLUG }, data });
    console.log(`Updated: /blog/${SLUG}`);
  } else {
    await prisma.blogPost.create({ data: { slug: SLUG, ...data } });
    console.log(`Published: /blog/${SLUG}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
