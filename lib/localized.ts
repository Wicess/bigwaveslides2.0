/** Localized text stored in Json columns as { en, fr }. */
export type LocalizedText = { en: string; fr: string };

/**
 * Resolve a localized Json value for the active locale, with graceful
 * fallbacks (requested locale → English → first available → fallback string).
 */
export function getLocalized(
  value: unknown,
  locale: string,
  fallback = "",
): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return fallback;

  const map = value as Record<string, unknown>;
  const candidate = map[locale] ?? map.en ?? Object.values(map)[0];
  return typeof candidate === "string" ? candidate : fallback;
}

/** Build a LocalizedText value. */
export function localized(en: string, fr: string): LocalizedText {
  return { en, fr };
}
