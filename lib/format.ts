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
  // maximumFractionDigits: 0 hides the cents, showing e.g. "$125" not "$125.00".
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
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
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", options).format(d);
}
