"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/client";

/**
 * Records PAGE_VIEW events for the storefront (admin routes are not tracked).
 *
 * Compute-frugal by design: writing a row to Postgres on *every* page view (and
 * a matching PAGE_LEAVE) is what keeps a serverless DB pinned awake and drains
 * a free-tier compute quota. So we:
 *   - never record PAGE_LEAVE (time-on-page is low value and doubled the writes;
 *     GA4/Clarity cover engagement),
 *   - always record the FIRST view of a browser session (so every session and
 *     its landing page is captured), then
 *   - sample subsequent views at NEXT_PUBLIC_ANALYTICS_SAMPLE (default 0.15).
 * Conversion events (add-to-cart, quote, order, …) are fired from their own
 * components and are always recorded — they're rare and high-value.
 */
const SAMPLE = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.15;
})();

export function AnalyticsTracker() {
  const pathname = usePathname();
  // Guards against React StrictMode double-invoke firing two views per path.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    // First view of this browser session is always recorded; the rest are
    // sampled. sessionStorage is per-tab and clears when the tab closes, which
    // matches "one landing view per session" closely enough.
    let firstOfSession = false;
    try {
      firstOfSession = sessionStorage.getItem("bws_pv_seen") == null;
      if (firstOfSession) sessionStorage.setItem("bws_pv_seen", "1");
    } catch {
      /* storage blocked — fall through to sampling */
    }

    if (!firstOfSession && Math.random() >= SAMPLE) return;

    trackEvent({
      type: "PAGE_VIEW",
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
      referrer:
        typeof document !== "undefined" && document.referrer
          ? document.referrer
          : undefined,
    });
  }, [pathname]);

  return null;
}
