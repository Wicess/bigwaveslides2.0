"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion/variants";

/**
 * Page-transition wrapper. App Router re-mounts templates on navigation,
 * giving each page a fresh enter animation. Sticky/fixed chrome lives in the
 * layout (outside this transform), so it is unaffected.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
