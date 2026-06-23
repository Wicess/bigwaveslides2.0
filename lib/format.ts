/** Format integer cents as a localized currency string (no decimals). */
export function formatPrice(
  cents: number,
  locale = "en",
  currency = "USD",
): string {
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
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", options).format(d);
}
