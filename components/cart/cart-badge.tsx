"use client";

import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";

/** Live item-count bubble for the header cart icon. */
export function CartBadge({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = (await res.json()) as { count: number };
        if (!cancelled) setCount(data.count);
      } catch {
        /* ignore */
      }
    };

    // Update immediately from event detail, then reconcile with the server.
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === "number") setCount(detail.count);
      else refresh();
    };

    refresh();
    window.addEventListener(CART_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, onChange);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span
      aria-label={`${count}`}
      className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
