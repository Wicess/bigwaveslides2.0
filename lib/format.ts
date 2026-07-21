// lib/format.ts
// -----------------------------------------------------------------------------
// Display helpers that turn raw data into nicely formatted text for the user.
// Both use the browser/Node built-in `Intl` API, which automatically handles
// language-specific rules (currency symbols, thousands separators, month names,
// date ordering). Used in the UI wherever we show a price or a date.
// -----------------------------------------------------------------------------

/** Format integer cents as a localized currency string (no decimals). */
export function formatPrice(
  cents: number,
  locale = "en",
  currency = "USD",
): string {
  // Prices are stored as whole cents (e.g. 12500) to avoid floating-point
  // rounding errors. We divide by 100 here to get the dollar amount (125.00).
  // Intl.NumberFormat adds the "$" / currency symbol and grouping commas, and
  // we use a French ("fr-FR") or US ("en-US") locale based on the language.
  // Whole-dollar amounts hide the cents ("$125", not "$125.00"), but amounts
  // with real cents keep them — tax lines like $617.70 must never display
  // rounded to $618 on a quote or invoice.
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

/**
 * The struck-through "compare-at" price shown next to the real price — set 20%
 * above it so the actual price reads as a deal. Rounded to a whole dollar for a
 * clean figure. Used on product cards and detail pages (rent + shop).
 */
export function compareAtCents(priceCents: number): number {
  return Math.round((priceCents * 1.2) / 100) * 100;
}

/** Whole-percent discount from the compare-at price down to the real price (~17%). */
export function savingsPercent(priceCents: number): number {
  const compare = compareAtCents(priceCents);
  if (compare <= 0) return 0;
  return Math.round((1 - priceCents / compare) * 100);
}

/** Format a date for display in the active locale. */
export function formatDate(
  date: Date | string,
  locale = "en",
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  // Accept either a Date object or a date string; normalize to a Date first.
  const d = typeof date === "string" ? new Date(date) : date;
  // Intl.DateTimeFormat renders the date per locale (e.g. "Jun 25, 2026" in
  // English vs "25 juin 2026" in French). `options` controls which parts show.
  return new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    options,
  ).format(d);
}
