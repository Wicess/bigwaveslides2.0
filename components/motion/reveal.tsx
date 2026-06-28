// reveal.tsx
// Scroll-reveal wrapper: fades + glides its children into view the first time
// they scroll on-screen. Supports a direction (up/down/left/right) and an
// optional scale for a soft "zoom-in", with a slow, smooth easing for a
// premium feel. Falls back to a plain <div> when the visitor prefers reduced
// motion.
"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./variants";

type Direction = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Direction the element travels in from. */
  direction?: Direction;
  /** Distance to travel (px). */
  distance?: number;
  /** Also scale up slightly from 96%. */
  scale?: boolean;
  /** Delay before animating (s). */
  delay?: number;
  /** Animation duration (s). */
  duration?: number;
  /** Animate only the first time it enters the viewport. */
  once?: boolean;
  /** Legacy: explicit vertical offset (overrides direction/distance). */
  y?: number;
};

function offset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

export function Reveal({
  children,
  className,
  direction = "up",
  distance = 28,
  scale = false,
  delay = 0,
  duration = 0.7,
  once = true,
  y,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const from = y != null ? { y } : offset(direction, distance);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...from, ...(scale ? { scale: 0.96 } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0, ...(scale ? { scale: 1 } : {}) }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
