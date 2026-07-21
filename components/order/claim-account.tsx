"use client";

import { useEffect, useRef } from "react";
import { claimAccountFromOrder } from "@/server/actions/account";

/*
 * Renders nothing. On mount (i.e. the customer opened this order link — which
 * we only email to them), silently signs this browser into the order's
 * customer account. Runs once per page load; guarded against React's dev
 * double-invoke.
 */
export function ClaimAccount({ orderNumber }: { orderNumber: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void claimAccountFromOrder(orderNumber);
  }, [orderNumber]);
  return null;
}
