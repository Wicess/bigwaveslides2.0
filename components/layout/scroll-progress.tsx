// scroll-progress.tsx
// The thin colored bar across the very top of the page that grows from left to
// right as you scroll down — a visual indicator of how far through the page you
// are.
//
// Pure CSS (scroll() timeline) — no "use client", no framer-motion, no scroll
// listener. It runs entirely on the compositor, so it costs no main-thread time
// (better INP/TBT). Browsers without scroll-timeline support simply show no bar
// (it stays scaleX(0)). Styling + the animation live in globals.css
// (`.bws-scroll-progress`).

/** Thin gradient progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  return (
    <div
      aria-hidden
      className="bws-scroll-progress fixed inset-x-0 top-0 z-[60] h-0.5 origin-left [background:var(--gradient-wave)]"
    />
  );
}
