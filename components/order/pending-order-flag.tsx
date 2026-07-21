"use client";

/**
 * Invisible marker mounted by the order page. While the buyer is waiting for
 * payment details (AWAITING_DETAILS) it writes a localStorage flag that the
 * globally-mounted <PaymentWatcher /> polls against — so the "details are
 * ready" reveal works even if the buyer navigates away from the order page.
 * When the wait is over (details arrived, or paid) it clears the flag so the
 * watcher goes quiet.
 */
import { useEffect } from "react";

/** Shared contract with <PaymentWatcher />: JSON { number, email }. */
const PENDING_ORDER_KEY = "bws_pending_order";

export function PendingOrderFlag({
  orderNumber,
  email,
  active,
}: {
  orderNumber: string;
  email: string;
  active: boolean;
}) {
  useEffect(() => {
    // localStorage can throw (private mode / storage disabled) — the reveal
    // layer is a nicety, so it must never crash the order page.
    try {
      if (active) {
        window.localStorage.setItem(
          PENDING_ORDER_KEY,
          JSON.stringify({ number: orderNumber, email }),
        );
      } else {
        // Only clear a flag that belongs to THIS order: a buyer viewing an
        // old paid order must not silently cancel the watch on another order
        // that is still awaiting details.
        const raw = window.localStorage.getItem(PENDING_ORDER_KEY);
        if (raw) {
          const flag = JSON.parse(raw) as { number?: string } | null;
          if (flag?.number === orderNumber) {
            window.localStorage.removeItem(PENDING_ORDER_KEY);
          }
        }
      }
    } catch {
      // Storage unavailable — the page still works, just without the
      // background watch.
    }
  }, [active, orderNumber, email]);

  return null;
}
