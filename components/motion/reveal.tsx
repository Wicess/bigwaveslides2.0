// reveal.tsx
// A small wrapper component that fades + slides its children into view the
// first time they are scrolled onto the screen. Think of it as: "wrap any
// section in <Reveal> and it will gently animate in as the user scrolls down".
//
// If the visitor has turned on the OS "reduce motion" accessibility setting,
// we skip the animation entirely and just render a normal <div> so nothing
// moves.

// "use client" tells Next.js this runs in the browser (it uses scroll/animation),
// not only on the server.
"use client";

import * as React from "react";
// framer-motion gives us animated elements (motion.div) and a hook that tells
// us whether the user prefers reduced motion.
import { motion, useReducedMotion } from "framer-motion";
// EASE_OUT is the shared timing curve so all animations feel consistent.
import { EASE_OUT } from "./variants";

// The props (inputs) this component accepts.
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
  // true when the user has asked their device to minimize motion.
  const reduce = useReducedMotion();

  // Accessibility fallback: if reduced motion is preferred, render a plain
  // <div> with no animation at all.
  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  // Otherwise render an animated element:
  // - initial: where it starts (invisible and pushed down by `y` pixels)
  // - whileInView: the target once it scrolls into view (visible, no offset)
  // - viewport.once: animate only the first time (don't replay on re-scroll)
  // - viewport.margin "-80px": trigger slightly before it fully enters, so the
  //   reveal feels timely rather than late.
  // - transition: how long it takes, an optional delay, and the easing curve.
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
