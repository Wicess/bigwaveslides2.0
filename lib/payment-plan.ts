// Shared (server + client) helpers for the half/full payment plan on invoices.

export type PaymentPlan = "HALF" | "FULL";

/** Paying with crypto takes 7% off the whole invoice — shown prominently to
    encourage the rail (it's instant and fee-free on our side). */
export const CRYPTO_DISCOUNT_RATE = 0.07;

/** True when the chosen rail earns the crypto discount. */
export function isCryptoMethod(method?: string | null): boolean {
  return method === "crypto";
}

/** Dollars-off for paying with crypto (0 for every other method). */
export function cryptoDiscountCents(
  totalCents: number,
  method?: string | null,
): number {
  return isCryptoMethod(method)
    ? Math.round(totalCents * CRYPTO_DISCOUNT_RATE)
    : 0;
}

/** The invoice total after any crypto discount — the amount everything else
    (plans, balances, mark-paid) is computed from. */
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
