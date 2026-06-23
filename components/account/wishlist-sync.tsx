"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncWishlist } from "@/server/actions/wishlist";

const KEY = "bws.wishlist";

/**
 * On first authenticated mount, merge any guest localStorage wishlist into the
 * customer's saved items, then clear it. Runs once per session.
 */
export function WishlistSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      const slugs = raw ? (JSON.parse(raw) as string[]) : [];
      if (slugs.length === 0) return;
      void syncWishlist(slugs).then((res) => {
        if (res.ok) {
          window.localStorage.removeItem(KEY);
          window.dispatchEvent(new Event("bws:wishlist-change"));
          router.refresh();
        }
      });
    } catch {
      /* ignore */
    }
  }, [router]);

  return null;
}
