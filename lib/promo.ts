// Promo codes entered at checkout. Config-driven (no table) — add a code here,
// it works immediately. A code discounts the eligible product line(s); the
// order stores the code + the cents taken off. It does NOT stack with the
// automatic loyalty discount — the order applies whichever is larger (see
// server/actions/orders.ts) so a subscriber is never double-discounted.

export type Promo = {
  code: string; // stored uppercase; matched case-insensitively
  /** Shown to the client when the code is applied. */
  label: string;
  /** Fraction off the eligible line total, e.g. 0.25 for 25%. */
  pct: number;
  /** Restrict to one product (by slug). Omit to apply to the whole cart. */
  productSlug?: string;
  /** Require a RENT line of `productSlug` for at least this many days. */
  minRentDays?: number;
  /** ISO date; the code stops working after this. */
  expiresAt?: string;
};

export const PROMOS: Promo[] = [
  {
    code: "WAVE25",
    label: "25% off the Tropical Wave 18 (2+ day rentals)",
    pct: 0.25,
    productSlug: "tropical-wave-18",
    minRentDays: 2,
    expiresAt: "2026-09-30T23:59:59.000Z",
  },
];

/** Look up a live (non-expired) promo by code, case-insensitively. */
export function findPromo(code?: string | null): Promo | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  const promo = PROMOS.find((p) => p.code === c);
  if (!promo) return null;
  if (promo.expiresAt && Date.parse(promo.expiresAt) < Date.now()) return null;
  return promo;
}

export type PromoLine = {
  productSlug: string;
  mode: "BUY" | "RENT";
  /** For RENT lines this is the number of days. */
  quantity: number;
  lineTotalCents: number;
};

/** Cents this promo takes off the given cart lines (0 if nothing qualifies). */
export function promoDiscountCentsFor(
  lines: PromoLine[],
  promo: Promo,
): number {
  const eligible = lines.filter((l) => {
    if (promo.productSlug && l.productSlug !== promo.productSlug) return false;
    if (promo.minRentDays) {
      if (l.mode !== "RENT") return false;
      if (l.quantity < promo.minRentDays) return false;
    }
    return true;
  });
  const base = eligible.reduce((n, l) => n + l.lineTotalCents, 0);
  return Math.round(base * promo.pct);
}
