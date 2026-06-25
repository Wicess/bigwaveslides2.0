// scroll-progress.tsx
// The thin colored bar across the very top of the page that grows from left to
// right as you scroll down — a visual indicator of how far through the page you
// are.

"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  // scrollYProgress is a 0->1 value: 0 at the top, 1 at the bottom of the page.
  const { scrollYProgress } = useScroll();
  // Feed that value through a spring so the bar eases rather than jumping.
  // stiffness/damping/mass tune how springy/snappy the motion feels.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    // origin-left makes the bar grow from the left edge; scaleX (0->1) sets its
    // width. Fixed to the top with a high z-index so it sits above everything.
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
    >
      {/* The visible gradient fill (brand "wave" gradient). */}
      <div className="h-full w-full [background:var(--gradient-wave)]" />
    </motion.div>
  );
}
