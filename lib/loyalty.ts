// Loyalty discount earned at checkout, independent of the pay-method (crypto/
// chime) discount applied later at payment — the two stack.
//
//   • Newsletter subscriber            → 15% off the product subtotal
//   • Subscriber AND has the app       → 20% (an extra 5% "for downloading the
//                                         app"). The app bonus only applies on
//                                         top of a subscription.
//
// One source of truth: order creation, the quote/invoice PDF, the order page,
// and the email all read the rate/percentage from here.

export const LOYALTY_SUBSCRIBE_RATE = 0.15;
export const LOYALTY_APP_BONUS_RATE = 0.05;

/** Cookie (set when an app install is recorded) that marks this browser as
    having the PWA — read server-side at checkout to grant the app bonus. */
export const APP_INSTALLED_COOKIE = "bws_app_installed";

export type LoyaltyFlags = { subscribed: boolean; appInstalled: boolean };

/** The combined loyalty rate (0, 0.15, or 0.20). */
export function loyaltyRate({
  subscribed,
  appInstalled,
}: LoyaltyFlags): number {
  if (!subscribed) return 0;
  return appInstalled
    ? LOYALTY_SUBSCRIBE_RATE + LOYALTY_APP_BONUS_RATE
    : LOYALTY_SUBSCRIBE_RATE;
}

/** Whole-number percent for display/storage (0, 15, or 20). */
export function loyaltyPct(flags: LoyaltyFlags): number {
  return Math.round(loyaltyRate(flags) * 100);
}

/** Dollars-off, rounded to the cent, applied to the product subtotal only. */
export function loyaltyDiscountCents(
  subtotalCents: number,
  flags: LoyaltyFlags,
): number {
  return Math.round(subtotalCents * loyaltyRate(flags));
}
