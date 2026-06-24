"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/client";

/**
 * Records a PAGE_VIEW on every route change and a PAGE_LEAVE (with time spent)
 * when the visitor navigates away or hides the tab. Mounted once in the
 * storefront layout — admin routes are not tracked.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const enteredAt = useRef<number>(Date.now());
  const currentPath = useRef<string>(pathname);

  // Page view on each route change (and a leave event for the previous page).
  useEffect(() => {
    const prev = currentPath.current;
    if (prev && prev !== pathname) {
      trackEvent({
        type: "PAGE_LEAVE",
        path: prev,
        durationMs: Date.now() - enteredAt.current,
      });
    }
    currentPath.current = pathname;
    enteredAt.current = Date.now();
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

  // Leave event when the tab is hidden or the page is being unloaded.
  useEffect(() => {
    const sendLeave = () => {
      trackEvent(
        {
          type: "PAGE_LEAVE",
          path: currentPath.current,
          durationMs: Date.now() - enteredAt.current,
        },
        true,
      );
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendLeave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
    };
  }, []);

  return null;
}
