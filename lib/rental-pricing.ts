/** Date + pricing helpers for the rental instant-quote (request-based, no payment). */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normalize a Date or ISO string to a UTC `YYYY-MM-DD` key. */
export function toISODate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

/** Parse a `YYYY-MM-DD` string to a UTC midnight Date (null if invalid). */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inclusive rental-day count between two dates (same start & end = 1 day). */
export function rentalDays(startISO: string, endISO: string): number {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return diff < 0 ? 0 : diff + 1;
}

/** List every `YYYY-MM-DD` from start to end inclusive. */
export function eachDate(startISO: string, endISO: string): string[] {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end || end < start) return [];
  const out: string[] = [];
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
  const safeDays = Math.max(0, Math.floor(days));
  const rentalCents = dailyRateCents * safeDays;
  const deliveryCents = (deliveryBaseCents ?? 0) + (pickupCents ?? 0);
  return {
    days: safeDays,
    rentalCents,
    deliveryCents,
    depositCents: depositCents ?? 0,
    totalCents: rentalCents + deliveryCents,
  };
}
