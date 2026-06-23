"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "./variants";

type KineticTextProps = {
  text: string;
  className?: string;
  /** Wrapper element. */
  as?: React.ElementType;
  /** Delay before the first word animates (s). */
  delay?: number;
  /** Per-word stagger (s). */
  stagger?: number;
};

/**
 * KineticText — animates each word up from a clipped baseline on scroll-in.
 * Renders plain text when reduced motion is preferred.
 */
export function KineticText({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  stagger = 0.06,
}: KineticTextProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return React.createElement(Tag, { className }, text);
  }

  return React.createElement(
    Tag,
    { className },
    words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "115%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.7,
              delay: delay + i * stagger,
              ease: EASE_OUT,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      )),
  );
}
