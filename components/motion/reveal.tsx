// reveal.tsx
// Scroll-reveal wrapper. Previously this used framer-motion's `whileInView`,
// which renders `opacity: 0` into the SSR HTML and only reveals after the JS
// bundle hydrates — so on a slow connection the nav painted while the content
// stayed invisible for seconds. This version is pure CSS (scroll-driven
// animations): the content is ALWAYS present in the HTML and visible by
// default, and where the browser supports `animation-timeline: view()` it
// glides in as it scrolls into view. No JS, no hydration gate, no client
// boundary — which also strips framer-motion out of every page that reveals
// content. Browsers without support (and reduced-motion users) simply see the
// content immediately. The animation styling lives in globals.css.

import * as React from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Direction the element travels in from. */
  direction?: Direction;
  /** Also scale up slightly from 96%. */
  scale?: boolean;
  // Accepted for backwards compatibility with existing call sites; the CSS
  // engine derives timing from scroll position, so these are no longer wired.
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  y?: number;
};

export function Reveal({
  children,
  className,
  direction = "up",
  scale = false,
}: RevealProps) {
  return (
    <div
      className={cn(className)}
      data-reveal={direction}
      data-reveal-scale={scale ? "" : undefined}
    >
      {children}
    </div>
  );
}
