// Shared (server + client) helpers for the half/full payment plan on invoices.

export type PaymentPlan = "HALF" | "FULL";

/** Amount due right now for the chosen plan. HALF = 50% deposit to reserve
    the date (rounded up to the cent); FULL = the whole invoice. */
export function amountDueCents(plan: PaymentPlan, totalCents: number): number {
  return plan === "HALF" ? Math.ceil(totalCents / 2) : totalCents;
}

/** The remaining balance due before setup on event day (0 for FULL). */
export function balanceCents(plan: PaymentPlan, totalCents: number): number {
  return totalCents - amountDueCents(plan, totalCents);
}
