// lib/rental-pricing.ts
// -----------------------------------------------------------------------------
// Date math and price calculation for the rental "instant quote" feature.
// Customers pick a start and end date; we count the days and add up the cost.
// Note: this is a quote/estimate only — there is no online payment. The numbers
// are shown to the customer and emailed as part of a rental request.
//
// All money is in integer cents (e.g. $1.25 -> 125) to avoid rounding bugs.
// All dates are handled in UTC so the day count never shifts due to time zones.
// -----------------------------------------------------------------------------

/** Date + pricing helpers for the rental instant-quote (request-based, no payment). */

// Number of milliseconds in one day. Used to convert time differences (which
// JavaScript measures in ms) into a number of days.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normalize a Date or ISO string to a UTC `YYYY-MM-DD` key. */
export function toISODate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  // Rebuild the date at UTC midnight using only its year/month/day, dropping
  // any time-of-day. .toISOString() gives "2026-06-23T00:00:00.000Z" and
  // .slice(0, 10) keeps just the "2026-06-23" part — a clean day key.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Parse a `YYYY-MM-DD` string to a UTC midnight Date (null if invalid). */
export function parseISODate(value: string | null | undefined): Date | null {
  // Reject anything that isn't exactly four digits, dash, two, dash, two.
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  // The trailing "Z" forces UTC, so "2026-06-23" always means UTC midnight
  // regardless of the server's local time zone.
  const d = new Date(`${value}T00:00:00.000Z`);
  // new Date(...) of a bad value produces an "Invalid Date" whose time is NaN.
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inclusive rental-day count between two dates (same start & end = 1 day). */
export function rentalDays(startISO: string, endISO: string): number {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return 0;
  // Difference in whole days between the two midnights.
  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  // "+1" makes the range INCLUSIVE: renting for a single day (start === end)
  // gives diff 0, which should count as 1 day. A negative range counts as 0.
  return diff < 0 ? 0 : diff + 1;
}

/** List every `YYYY-MM-DD` from start to end inclusive. */
export function eachDate(startISO: string, endISO: string): string[] {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end || end < start) return [];
  const out: string[] = [];
  // Step forward one day at a time (in ms) from start through end, collecting
  // each day's "YYYY-MM-DD" key. Useful for marking each booked day.
  for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export type QuoteInput = {
  dailyRateCents: number;
  depositCents?: number | null;
  deliveryBaseCents?: number | null;
  pickupCents?: number | null;
  days: number;
};

export type QuoteBreakdown = {
  days: number;
  rentalCents: number;
  deliveryCents: number;
  depositCents: number;
  /** Estimated total payable (rental + delivery/pickup); deposit is refundable. */
  totalCents: number;
};

/** Compute an instant-quote breakdown. Delivery/pickup are best-effort estimates. */
export function computeQuote({
  dailyRateCents,
  depositCents = 0,
  deliveryBaseCents = 0,
  pickupCents = 0,
  days,
}: QuoteInput): QuoteBreakdown {
  // Guard against bad input: never fewer than 0 days, and ignore fractions.
  const safeDays = Math.max(0, Math.floor(days));
  // Core formula: rental cost = daily rate x number of days.
  const rentalCents = dailyRateCents * safeDays;
  // Delivery cost = the one-time drop-off (base) fee + the pick-up fee.
  const deliveryCents = (deliveryBaseCents ?? 0) + (pickupCents ?? 0);
  return {
    days: safeDays,
    rentalCents,
    deliveryCents,
    depositCents: depositCents ?? 0,
    // Total the customer would pay = rental + delivery. The deposit is NOT
    // added here because it's refundable (returned after the rental), so it's
    // reported separately rather than counted as a real cost.
    totalCents: rentalCents + deliveryCents,
  };
}
