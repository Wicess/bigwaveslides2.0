// "use client" marks this as a Client Component: it runs in the browser
// because it uses state, effects, and animation (which the server can't do).
"use client";

import { useEffect, useRef, useState } from "react";
// useInView tells us when the element scrolls into the viewport.
import { useInView } from "framer-motion";

/**
 * CountUp — an animated number that counts up from 0 to `to` the first time it
 * scrolls into view. Used for stats (e.g. "500+ events", "4.9 rating").
 *
 * Props:
 *   to        target number to count to
 *   decimals  how many decimal places to show (default 0)
 *   suffix    text appended after the number, e.g. "+" or "%"
 *   duration  animation length in milliseconds
 *
 * Usage:
 *   <CountUp to={500} suffix="+" />
 *   <CountUp to={4.9} decimals={1} />
 */

// Easing function: maps animation progress (0..1) to an eased 0..1 value so the
// count decelerates near the end instead of moving at a constant speed.
function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  duration = 1600,
  className,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  // ref points to the <span> so useInView can watch its scroll position.
  const ref = useRef<HTMLSpanElement>(null);
  // `once: true` = animate only the first time it appears; `margin` starts the
  // animation slightly before the element is fully on screen.
  const inView = useInView(ref, { once: true, margin: "-80px" });
  // `value` is the number currently displayed; it updates each animation frame.
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Do nothing until the element has scrolled into view.
    if (!inView) return;
    let raf = 0; // id of the pending animation frame, used for cleanup
    const start = performance.now();
    // `tick` runs once per frame, advancing the displayed value.
    const tick = (now: number) => {
      // p = progress from 0 to 1 based on how much time has elapsed.
      const p = Math.min(1, (now - start) / duration);
      setValue(to * easeOutCubic(p));
      // Keep requesting frames until we reach the end (p === 1).
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Cleanup: stop the animation if the component unmounts mid-count.
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {/* toFixed formats the number to the requested decimal places. */}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
