"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./variants";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Vertical offset to travel from (px). */
  y?: number;
  /** Delay before animating (s). */
  delay?: number;
  /** Animate only the first time it enters the viewport. */
  once?: boolean;
};

/** Scroll-reveal wrapper. Falls back to a plain element when reduced motion is on. */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
