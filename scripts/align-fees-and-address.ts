/*
 * align-fees-and-address.ts
 *
 * Two SiteSetting rows, both of which disagreed with what the site tells
 * customers.
 *
 * 1. THE DELIVERY FEE HAD TWO ANSWERS
 * lib/checkout-config.ts defines the transport fee as a flat $30 per order,
 * with a documented reason: "Sites in this trade that quote per mile lose the
 * booking at the quote step, so this is deliberately a single number a customer
 * can see before they commit." Every checkout path honours that constant.
 *
 * The booking path did not. server/actions/bookings.ts builds its quote from
 * `settings.fees`, which still held the pre-decision numbers:
 *
 *     deliveryBaseCents 4900 + pickupCents 2900  =  $78
 *
 * So the same customer saw $78 through the instant quote and a booking request,
 * and $30 at checkout. public/llms.txt, public/pricing.md and the cost-guide
 * article all state a flat $30, which made the higher number a contradiction of
 * our own published pricing as well as of the other path.
 *
 * Owner confirmed $30 flat is the real policy, so the row is aligned to it:
 * base $30, pickup $0. perMileCents and freeRadiusMiles are zeroed too — they
 * were stored and rendered in the admin fee editor but never read by
 * computeQuote(), so they described a mileage charge that was never actually
 * applied to anyone.
 *
 * 2. LOCALBUSINESS HAD NO ADDRESS
 * Google lists `address` as required for LocalBusiness. `contact` carried only
 * email and phone, so lib/structured-data.ts emitted the entity without one —
 * incomplete markup on the exact signal that tells Google this is a US
 * business. organizationLd() emits a structured PostalAddress as soon as
 * addressLocality and addressRegion are both present; streetAddress and
 * postalCode stay optional, so this publishes a city and state without
 * publishing a home address.
 *
 * NOTE ON CACHING: getSettings() is an unstable_cache with tag "settings" and a
 * 1-hour revalidate. Writing straight to the database does not bust that tag,
 * so the change appears either on the next deploy or within the hour.
 *
 * Run: npm run db:align-fees-address [-- --dry]
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { TRANSPORT_CENTS } from "../lib/checkout-config";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DRY = process.argv.includes("--dry");

/** Read from checkout-config so this can never drift from the constant again. */
const FEES = {
  deliveryBaseCents: TRANSPORT_CENTS,
  pickupCents: 0,
  perMileCents: 0,
  freeRadiusMiles: 0,
};

const ADDRESS = {
  addressLocality: "Dallas",
  addressRegion: "TX",
  addressCountry: "US",
};

/**
 * Both rows we touch hold flat maps of primitives. Typed narrowly rather than
 * as `unknown` so Prisma accepts the value as InputJsonValue without a cast.
 */
type Json = Record<string, string | number | boolean | null>;

async function patch(key: string, changes: Json) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const current = (row?.value as Json | null) ?? {};
  const next = { ...current, ...changes };

  console.log(`\n${key}`);
  for (const [k, v] of Object.entries(changes)) {
    const before = current[k];
    const same = JSON.stringify(before) === JSON.stringify(v);
    console.log(
      `  ${same ? "=" : "→"} ${k}: ${JSON.stringify(before ?? null)} ${same ? "" : `-> ${JSON.stringify(v)}`}`,
    );
  }

  if (DRY) return;
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: next },
    update: { value: next },
  });
}

async function main() {
  await patch("fees", FEES);
  await patch("contact", ADDRESS);

  console.log(
    `\n${DRY ? "[dry] " : ""}booking path transport is now $${(FEES.deliveryBaseCents + FEES.pickupCents) / 100}, matching TRANSPORT_CENTS ($${TRANSPORT_CENTS / 100}).`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
