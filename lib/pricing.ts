// Shared pricing rules for the quote → invoice flow (client + server safe).

/** Flat transportation fee, added to every quote unless the owner toggles
    transport off in Admin → Settings → Payment methods. */
export const TRANSPORT_CENTS = 3000;
export const TRANSPORT_LABEL = "Transportation";

/** 30% of the total acts as a refundable deposit — fully refunded when a
    cancellation is signaled at least REFUND_NOTICE_DAYS before the event. */
export const DEPOSIT_RATE = 0.3;
export const REFUND_NOTICE_DAYS = 7;

/** The remaining 50% balance is due this many hours before the event. */
export const BALANCE_DUE_HOURS = 48;

/**
 * Fallback for the "from $X/day" copy when the catalog can't be read. The
 * live figure is the cheapest ACTIVE rental (server/data/catalog-facts.ts →
 * getCatalogHeadline). Keep equal to that unit — today the Little Harbor
 * Junior at $155/day — or the fallback starts advertising a price nothing
 * rents at.
 */
export const RENTAL_FROM_CENTS = 15500;
