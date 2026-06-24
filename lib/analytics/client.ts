// Browser-side helper to send analytics events to /api/track.
// Safe to import from client components. No-ops during SSR.

export type ClientEventType =
  | "PAGE_VIEW"
  | "PAGE_LEAVE"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CART_VIEW"
  | "CHECKOUT_START"
  | "ORDER_REQUEST"
  | "BOOKING_REQUEST"
  | "QUOTE_REQUEST"
  | "CONTACT";

export type ClientEventPayload = {
  type: ClientEventType;
  path?: string;
  title?: string;
  referrer?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

const ENDPOINT = "/api/track";

/** Fire-and-forget analytics event. Uses sendBeacon on unload, fetch otherwise. */
export function trackEvent(payload: ClientEventPayload, useBeacon = false): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
