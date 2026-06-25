// back-to-top.tsx
// A floating round button (bottom-right) that appears once the user has
// scrolled down a bit, and smooth-scrolls them back to the top when clicked.
// It animates in/out with framer-motion.

"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
// AnimatePresence lets us animate an element as it's removed from the page.
import { AnimatePresence, motion } from "framer-motion";

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
    // AnimatePresence keeps the exit animation playing as the button leaves.
    <AnimatePresence>
      {show ? (
        <motion.button
          type="button"
          // initial -> animate: how it fades/scales in; exit: how it fades out.
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          // Smoothly scroll the page back to the top when clicked.
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={label}
          className="fixed bottom-6 right-6 z-50 grid size-11 place-items-center rounded-full bg-accent text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-light"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
