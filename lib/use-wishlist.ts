"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "bws.wishlist";
const EVENT = "bws:wishlist-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Client-side wishlist persisted to localStorage. Server persistence for
 * signed-in customers is wired in Phase 14 (auth & accounts).
 */
export function useWishlist() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(read());
    setReady(true);
    const sync = () => setSlugs(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string) => {
    const current = read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    write(next);
    setSlugs(next);
    return next.includes(slug);
  }, []);

  return { slugs, has, toggle, ready, count: slugs.length };
}
