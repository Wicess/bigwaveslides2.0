/*
 * remove-fake-testimonials.ts
 *
 * Deletes the seeded testimonials from invented people.
 *
 * "Maria G.", "Pastor James", "Coach Daniels", "The Reynolds Family" and
 * "Hotel Azure" were created by the old seed as APPROVED and render on the
 * homepage carousel and /testimonials as real customer endorsements. They are
 * not real. The seed no longer creates them, but that never touched rows
 * already in the database — they are live right now, and they still credit
 * "Big Wave", a company this site is no longer named after.
 *
 * Fabricated endorsements attributed to named people and a named school are an
 * FTC problem before they are an SEO one, so these are DELETED rather than
 * hidden: there is no version of this content worth keeping.
 *
 * Run:  npm run db:remove-fake-testimonials [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DRY = process.argv.includes("--dry");

const SEEDED_AUTHORS = [
  "Maria G.",
  "Pastor James",
  "Coach Daniels",
  "The Reynolds Family",
  "Hotel Azure",
];

async function main() {
  const rows = await prisma.testimonial.findMany({
    where: { authorName: { in: SEEDED_AUTHORS } },
    select: { id: true, authorName: true, status: true },
  });

  for (const r of rows) {
    console.log(`${DRY ? "[dry] " : ""}delete  ${r.authorName} (${r.status})`);
  }
  if (!DRY && rows.length) {
    await prisma.testimonial.deleteMany({
      where: { id: { in: rows.map((r) => r.id) } },
    });
  }

  const left = await prisma.testimonial.count();
  console.log(
    `\n${DRY ? "Would delete" : "Deleted"} ${rows.length}. Testimonials remaining: ${DRY ? left : left}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
