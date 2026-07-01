// back-to-top.tsx
// A floating round button (bottom-right) that appears once the user has
// scrolled down a bit, and smooth-scrolls them back to the top when clicked.
// It fades/scales in and out with a CSS transition (no framer-motion, so this
// tiny helper no longer pulls the animation library into every page's bundle).

"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTop({ label }: { label: string }) {
  // Whether the button is currently visible.
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show the button only after scrolling past 600px.
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll(); // run once on mount to set the correct initial state
    // passive: true tells the browser we won't block scrolling — better perf.
    window.addEventListener("scroll", onScroll, { passive: true });
    // Remove the listener when the component unmounts to avoid leaks.
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Always rendered; visibility + fade/scale handled by a CSS transition so
    // there's no framer-motion AnimatePresence. Hidden from AT + tab order when
    // not shown.
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={label}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={cn(
        "bg-accent hover:bg-accent-light fixed right-6 bottom-6 z-50 grid size-11 place-items-center rounded-full text-white shadow-[var(--shadow-soft)] transition-all duration-300 ease-out",
        show
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-2.5 scale-90 opacity-0",
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
