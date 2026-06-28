// parallax.tsx
// Subtle scroll-linked movement. Wrap an element and it drifts vertically as it
// passes through the viewport, adding depth without layout shift. Disabled for
// visitors who prefer reduced motion. Best used on a slightly oversized element
// (e.g. a background image scaled to ~115%) so the drift never reveals edges.
"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function Parallax({
  children,
  className,
  /** Total travel (px) across the scroll range. */
  distance = 60,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [distance / 2, -distance / 2],
  );

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="size-full">
        {children}
      </motion.div>
    </div>
  );
}
