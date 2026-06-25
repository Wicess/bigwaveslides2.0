// "use client" marks this as a Client Component: it runs in the browser, which
// is required to use animation hooks like framer-motion's below.
"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion/variants";

/**
 * Page-transition wrapper.
 *
 * A `template.tsx` is like `layout.tsx` but with one key difference: the
 * App Router throws away and re-creates it on every navigation. That fresh
 * mount lets us replay an "enter" animation each time the page changes.
 * Persistent chrome (header/footer) lives in layout.tsx and is unaffected.
 */
export default function Template({ children }: { children: ReactNode }) {
  // Respect the OS "reduce motion" accessibility setting.
  const reduce = useReducedMotion();

  // If the user prefers reduced motion, render children with no animation.
  if (reduce) return <>{children}</>;

  return (
    // Fade in and slide up slightly on mount: from invisible/offset (`initial`)
    // to fully visible/in place (`animate`).
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
