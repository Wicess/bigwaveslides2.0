// lib/format.ts
// -----------------------------------------------------------------------------
// Display helpers that turn raw data into nicely formatted text for the user.
// Both use the browser/Node built-in `Intl` API, which automatically handles
// language-specific rules (currency symbols, thousands separators, month names,
// date ordering). Used in the UI wherever we show a price or a date.
// -----------------------------------------------------------------------------

/**
 * Format integer cents as a US-dollar string.
 *
 * `_locale` is vestigial: the site was bilingual and switched between fr-FR and
 * en-US number formatting. It is English-only now, so the value is ignored — but
 * the parameter keeps its position because ~100 call sites pass it positionally
 * and dropping it would silently shift `currency` into its place.
 */
export function formatPrice(
  cents: number,
  _locale = "en",
  currency = "USD",
): string {
  // Prices are stored as whole cents (e.g. 12500) to avoid floating-point
  // rounding errors. We divide by 100 here to get the dollar amount (125.00).
  // Intl.NumberFormat adds the "$" symbol and grouping commas, always in
  // US English — the site sells in the United States only.
  // Whole-dollar amounts hide the cents ("$125", not "$125.00"), but amounts
  // with real cents keep them — tax lines like $617.70 must never display
  // rounded to $618 on a quote or invoice.
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

// compareAtCents / savingsPercent removed 2026-10-31: they invented a "was"
// price 20% above the real one and a "Save 17%" badge. Show a compare-at
// price only if it is a real previous price stored on the product.

/** Format a date for display. `_locale` is vestigial — see formatPrice. */
export function formatDate(
  date: Date | string,
  _locale = "en",
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  // Accept either a Date object or a date string; normalize to a Date first.
  const d = typeof date === "string" ? new Date(date) : date;
  // Intl.DateTimeFormat renders the date in US English (e.g. "Jun 25, 2026").
  // `options` controls which parts show.
  return new Intl.DateTimeFormat("en-US", options).format(d);
}
