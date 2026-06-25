// locale-switcher.tsx
// The little language toggle (e.g. EN / ES) in the header. Clicking a language
// reloads the *same* page in that language without losing the current path.
// We use React's useTransition so the click stays responsive (and the buttons
// disable) while Next.js fetches the translated route.

"use client";

import { useLocale } from "next-intl"; // the language currently shown
import { useTransition } from "react";
// These are locale-aware versions of Next.js navigation helpers.
import { usePathname, useRouter } from "@/i18n/navigation";
// routing.locales is the list of supported languages.
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const activeLocale = useLocale(); // which language is active right now
  const pathname = usePathname(); // current page path, e.g. "/slides"
  const router = useRouter();
  // isPending is true while the locale switch is loading; startTransition wraps
  // the navigation so React keeps the UI interactive during it.
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 p-1"
      role="group"
      aria-label="Language"
    >
      {/* One button per supported language. */}
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale; // highlight the current language
        return (
          <button
            key={locale}
            type="button"
            disabled={isPending} // avoid double-clicks mid-switch
            aria-current={isActive ? "true" : undefined} // a11y: marks the active one
            onClick={() =>
              // Re-open the same path but in the chosen language. replace (not
              // push) so the language swap doesn't add a back-button entry.
              startTransition(() => {
                router.replace(pathname, { locale });
              })
            }
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors",
              isActive
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
