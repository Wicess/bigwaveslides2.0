// variants.ts
// Reusable framer-motion "variants" — named animation states (like "hidden"
// and "show") that components can switch between. Keeping them in one file
// means every animated section across the site looks and feels the same.
//
// A variant is just an object describing start/end styles plus how to get
// there (duration + easing). Components reference these by name.

import type { Variants } from "framer-motion";

// Shared easing — a refined "out-expo"-style curve used across the brand.
// These four numbers are a cubic-bezier curve: the animation starts fast and
// glides to a smooth stop. Reusing it keeps the motion consistent everywhere.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Fade in while sliding up 24px. The most common entrance for text/sections.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 }, // starting state: invisible, nudged down
  show: {
    opacity: 1, // end state: fully visible...
    y: 0, // ...and back in its natural position
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

// Simple opacity-only fade (no movement).
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

// Fade in while growing slightly from 96% to full size — good for cards/images.
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

// A "container" variant for animating a list of children one after another.
// `stagger` is the gap between each child; `delayChildren` waits before the
// first one starts. The children use their own variants (e.g. fadeUp) and the
// parent orchestrates the timing.
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});
