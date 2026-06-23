import type { routing } from "./i18n/routing";
import type messages from "./messages/en.json";

// Type-safe locales and translation keys across the app (next-intl v4).
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
