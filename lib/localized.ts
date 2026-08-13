// lib/localized.ts
// -----------------------------------------------------------------------------
// The site is English (en-US) only, but several database columns are JSON that
// was written while it was bilingual — e.g. { "en": "Slide", "fr": "Toboggan" }.
// Those rows still exist, so `getLocalized` stays: it reads whichever shape a
// row happens to have (plain string, { en }, or the legacy { en, fr }) and
// always returns displayable English. New writes only ever store { en }.
// -----------------------------------------------------------------------------

/** Text stored in a Json column. Legacy rows may also carry an `fr` key. */
export type LocalizedText = { en: string };

/**
 * Resolve a localized Json value for the active locale, with graceful
 * fallbacks (requested locale → English → first available → fallback string).
 *
 * `value` is typed as `unknown` because it comes from a JSON database column
 * and could be anything. We defensively handle each shape so the UI never
 * crashes and always shows *something* readable:
 *   - null/undefined  -> use the provided fallback string
 *   - a plain string  -> already a single language, return as-is
 *   - not an object   -> unexpected type, use the fallback
 */
export function getLocalized(
  value: unknown,
  locale: string,
  fallback = "",
): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return fallback;

  // At this point `value` is an object like { en: "...", fr: "..." }.
  // The ?? chain picks the best available text in order of preference:
  //   1. the requested language (map[locale], e.g. "fr")
  //   2. English (map.en) as a sensible default
  //   3. whatever value exists first, if neither key is present
  const map = value as Record<string, unknown>;
  const candidate = map[locale] ?? map.en ?? Object.values(map)[0];
  // Only return it if it's actually a string; otherwise fall back.
  return typeof candidate === "string" ? candidate : fallback;
}

/** Build a LocalizedText value. */
export function localized(en: string): LocalizedText {
  return { en };
}
