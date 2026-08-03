// Shared (server + client) helpers for the half/full payment plan on invoices.

export type PaymentPlan = "HALF" | "FULL";

/**
 * Instant-pay discounts, applied to the whole invoice and shown prominently to
 * steer buyers toward the rails that clear fastest and cheapest on our side.
 * Crypto is instant + fee-free; Chime clears fast with no card fees.
 * One source of truth — badges, rows, plan math and the PDF all read from here.
 */
export const METHOD_DISCOUNT_RATES: Record<string, number> = {
  crypto: 0.075,
  chime: 0.03,
};

/** Back-compat: the crypto rate as a named constant. */
export const CRYPTO_DISCOUNT_RATE = METHOD_DISCOUNT_RATES.crypto;

/** Discount rate for a method (0 when it earns none). */
export function methodDiscountRate(method?: string | null): number {
  if (!method) return 0;
  return METHOD_DISCOUNT_RATES[method] ?? 0;
}

/** Human label for a method's discount (e.g. "11.5%", "3%"), or null. Trailing
    ".0" is trimmed so a round rate reads "10%", not "10.0%". */
export function discountLabelFor(method?: string | null): string | null {
  const rate = methodDiscountRate(method);
  return rate ? `${Number((rate * 100).toFixed(1))}%` : null;
}

/** Back-compat crypto label. */
export const CRYPTO_DISCOUNT_LABEL = discountLabelFor("crypto") ?? "";

/** True when the chosen rail earns the crypto discount. */
export function isCryptoMethod(method?: string | null): boolean {
  return method === "crypto";
}

/** Dollars-off for the chosen method's instant-pay discount (0 for none).
    Named `cryptoDiscountCents` for back-compat; now covers every rail with a
    configured rate (crypto, chime, …), not just crypto. */
export function cryptoDiscountCents(
  totalCents: number,
  method?: string | null,
): number {
  return Math.round(totalCents * methodDiscountRate(method));
}

/** The invoice total after any instant-pay discount — the amount everything
    else (plans, balances, mark-paid) is computed from. */
export function effectiveTotalCents(
  totalCents: number,
  method?: string | null,
): number {
  return totalCents - cryptoDiscountCents(totalCents, method);
}

/** Amount due right now for the chosen plan. HALF = 50% deposit to reserve
    the date (rounded up to the cent); FULL = the whole invoice. */
export function amountDueCents(plan: PaymentPlan, totalCents: number): number {
  return plan === "HALF" ? Math.ceil(totalCents / 2) : totalCents;
}

/** The remaining balance due before setup on event day (0 for FULL). */
export function balanceCents(plan: PaymentPlan, totalCents: number): number {
  return totalCents - amountDueCents(plan, totalCents);
}
