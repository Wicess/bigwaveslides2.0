import { defineRouting } from "next-intl/routing";

/**
 * The site is English (en-US) only.
 *
 * It shipped bilingual (en + fr), but Splash Republic sells and delivers in the
 * United States alone, so the French half could not convert anyone — it just
 * doubled the number of URLs Google had to crawl on a young domain. It was
 * removed on 2026-08-13; `middleware.ts` 301s every old `/fr/*` URL to its
 * `/en/*` twin so the previously indexed pages consolidate instead of 404ing.
 *
 * The `/en` prefix stays (`localePrefix: "always"`). Dropping it would be
 * cosmetically nicer, but every indexed URL and every backlink points at
 * `/en/...`, so it would mean re-migrating ~750 live URLs for no ranking gain.
 */
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
