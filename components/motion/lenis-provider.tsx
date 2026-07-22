// lenis-provider.tsx
// Wraps the whole app to enable "smooth scrolling". Normally the browser jumps
// pixel-by-pixel as you scroll; Lenis smooths it into a gliding motion. We also
// connect Lenis to GSAP's ScrollTrigger so scroll-based animations stay in sync
// with the smoothed scroll position. If the user prefers reduced motion, we do
// nothing and let the browser scroll normally.

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
// Lenis is the smooth-scroll library.
import Lenis from "lenis";
// gsap drives animations; ScrollTrigger fires animations based on scroll.
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Smooth-scroll provider. Initializes Lenis and syncs it with GSAP
 * ScrollTrigger so scroll-driven animations stay perfectly in step.
 * Disabled entirely when the user prefers reduced motion.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = React.useRef<Lenis | null>(null);
  const pathname = usePathname();

  // useEffect runs once after the component mounts (in the browser only).
  React.useEffect(() => {
    // Safety check: skip on the server where `window` doesn't exist.
    if (typeof window === "undefined") return;
    // Respect the OS "reduce motion" setting — bail out and use native scroll.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    // Start smooth scrolling.
    // - lerp: how much "catch-up" smoothing each frame (lower = smoother/slower)
    // - smoothWheel: smooth the mouse wheel
    // - wheelMultiplier: scroll speed factor
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;
    // Expose it so navigations elsewhere can reset scroll (see lib/scroll.ts).
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    // Whenever Lenis scrolls, tell ScrollTrigger to recalculate so scroll-based
    // animations match the smoothed position.
    lenis.on("scroll", ScrollTrigger.update);

    // GSAP's ticker is a shared animation loop. On each frame we hand the time
    // to Lenis (converted from seconds to milliseconds) so it can advance.
    const onRaf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onRaf);
    // Disable GSAP's lag smoothing so Lenis controls the timing itself.
    gsap.ticker.lagSmoothing(0);

    // Cleanup when the component unmounts: stop the loop and tear down Lenis.
    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  // On every route change, jump back to the top. Lenis holds its scroll
  // position across client navigations, which otherwise lands the next page
  // wherever the previous one was scrolled to (e.g. quote → invoice opened at
  // the bottom). Skip when navigating to an in-page anchor.
  React.useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  // This provider doesn't render any visible markup — it just renders whatever
  // children it wraps, after attaching the smooth-scroll behavior above.
  return <>{children}</>;
}
