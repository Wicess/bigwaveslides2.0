// parallax.tsx
// Subtle scroll-linked movement. Wrap an element and it drifts vertically as it
// passes through the viewport, adding depth without layout shift.
//
// This is now PURE CSS (scroll-driven `animation-timeline: view()`) — no
// framer-motion, no "use client", no hydration. That strips framer-motion out
// of every page whose only motion was a hero parallax (all PhotoHero pages),
// which is a large main-thread / TBT win. Browsers without scroll-timeline
// support (and reduced-motion users) simply see a static image. The animation
// itself lives in globals.css (`.bws-parallax`). Best used on a slightly
// oversized element (e.g. a background image scaled to ~118%) so the drift
// never reveals edges.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Parallax({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  /** Accepted for backwards compatibility; travel is now CSS-defined. */
  distance?: number;
}) {
  return (
    <div className={className}>
      <div className={cn("bws-parallax size-full")}>{children}</div>
    </div>
  );
}
