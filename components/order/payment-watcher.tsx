"use client";

/**
 * Global background watcher for the "payment details posted" moment.
 *
 * Mounted once in the locale layout. Every 6 seconds it checks localStorage
 * for a pending-order flag (written by <PendingOrderFlag /> on the order
 * page while the order is AWAITING_DETAILS). If one exists it asks the
 * status endpoint whether the admin has posted payment details yet, and the
 * instant that flips it clears the flag, marks the reveal for announcement,
 * and refreshes/redirects so the buyer sees the details with zero manual
 * reloading — even if they wandered off to another page in the meantime.
 */
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLivePoll } from "@/lib/use-live-poll";

/** Shared contract with <PendingOrderFlag />: JSON { number, email }. */
const PENDING_ORDER_KEY = "bws_pending_order";
/**
 * Shared contract with the details card: it reads + deletes this
 * sessionStorage marker to fire its one-time "details arrived" announcement.
 */
const ANNOUNCE_KEY = "bws_payment_announce";

// 20s, not 6s. The old cadence billed 600 invocations an hour per open tab and
// woke Postgres on each one. A buyer waiting on payment details does not need
// six-second granularity — and the poll now pauses entirely when the tab is
// hidden or idle, with an immediate check on return, so returning to the tab
// is FASTER than the old always-on loop rather than slower.
const POLL_MS = 20_000;
/**
 * Stop watching an order 25 minutes after we FIRST saw its flag. Tracked in
 * a Map keyed by order number (not a mount-time constant) because the layout
 * — and therefore this watcher — stays mounted across client navigations,
 * so one mount can outlive several distinct orders.
 */
const MAX_WATCH_MS = 25 * 60 * 1_000;

export function PaymentWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  // The interval closure is armed once; refs let it read the CURRENT
  // pathname/router without re-arming (and re-timing) the poll loop on
  // every navigation.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const firstSeen = useRef<Map<string, number>>(new Map());
  const inFlight = useRef(false);
  // Effect-scoped `check` is published here so the poll hook can call it.
  const checkRef = useRef<null | (() => void | Promise<void>)>(null);

  useEffect(() => {
    // SSR / non-browser guard — this effect only makes sense with real
    // window storage and timers.
    if (typeof window === "undefined") return;

    const check = async () => {
      // Re-read the flag INSIDE every tick. The order page writes it in its
      // own effect, which runs AFTER this component's mount effect — a
      // single mount-time read would therefore never see the flag on the
      // exact page where the buyer is waiting.
      let flag: { number?: string; email?: string } | null = null;
      try {
        flag = JSON.parse(
          window.localStorage.getItem(PENDING_ORDER_KEY) ?? "null",
        );
      } catch {
        flag = null;
      }
      if (!flag?.number || !flag.email) return;
      const { number, email } = flag;

      // Give up on an order after 25 minutes of watching: the admin clearly
      // isn't responding in real time, and endless polling wastes requests.
      const seen = firstSeen.current;
      if (!seen.has(number)) seen.set(number, Date.now());
      if (Date.now() - (seen.get(number) ?? 0) > MAX_WATCH_MS) return;

      // One request at a time — a slow response must not stack with the
      // next tick (or a visibilitychange re-check).
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(number)}/status?email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          hasDetails?: boolean;
          paid?: boolean;
        } | null;

        // Contract: fired after EVERY completed status check, so the order
        // page's waiting card can show a live "last checked" pulse.
        window.dispatchEvent(
          new CustomEvent("bws:payment-poll", {
            detail: { orderNumber: number, at: Date.now() },
          }),
        );

        if (!data?.ok) return;
        if (data.hasDetails || data.paid) {
          // The wait is over: clear the flag first so no further tick (or a
          // second tab) re-fires the reveal for this order.
          try {
            window.localStorage.removeItem(PENDING_ORDER_KEY);
          } catch {}
          // Session-scoped marker: the details card consumes (reads +
          // deletes) it to announce the reveal exactly once.
          try {
            window.sessionStorage.setItem(ANNOUNCE_KEY, number);
          } catch {}
          window.dispatchEvent(
            new CustomEvent("bws:payment-ready", {
              detail: { orderNumber: number },
            }),
          );

          const currentPath = pathRef.current ?? window.location.pathname;
          if (currentPath.includes(`/order/${number}`)) {
            // Already on the order page — a soft refresh re-renders the
            // server component with the freshly posted details.
            router.refresh();
          } else {
            // Elsewhere on the site — take the buyer to their order. Reuse
            // whatever locale segment the current URL carries (fr → /fr/…)
            // rather than hardcoding prefixes, so this survives any
            // localePrefix strategy.
            const seg = currentPath.split("/")[1];
            const prefix = seg === "en" ? `/${seg}` : "";
            router.push(`${prefix}/order/${number}`);
          }
        }
      } catch {
        // Network hiccup — stay silent; the next tick retries.
      } finally {
        inFlight.current = false;
      }
    };

    checkRef.current = check;
  }, [router]);

  // Pauses on hidden/idle, resumes with an immediate check. See useLivePoll.
  // idleMs is generous here (10 min) because a buyer genuinely waiting on
  // payment details may sit still without touching the page.
  useLivePoll(() => checkRef.current?.(), {
    intervalMs: POLL_MS,
    idleMs: 10 * 60_000,
  });

  return null;
}
