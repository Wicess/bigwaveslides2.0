"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type HeroSlide =
  | { type: "video"; src: string; poster?: string }
  | { type: "image"; src: string; alt: string };

const IMAGE_MS = 6000;
const VIDEO_FALLBACK_MS = 14000;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed background carousel: a looping promo video and HD photos that
 * auto-crossfade. Images get a slow Ken-Burns push for depth. The hero copy is
 * overlaid on top by the parent — this only renders the switching backdrop,
 * legibility scrims, and the slide indicators.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const reduce = useReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = React.useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  React.useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const current = slides[index];
    if (current?.type === "video") {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
      // onEnded advances; this is a safety net if metadata/ended never fires.
      timer.current = setTimeout(() => go(index + 1), VIDEO_FALLBACK_MS);
    } else {
      timer.current = setTimeout(() => go(index + 1), IMAGE_MS);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, slides, go]);

  const current = slides[index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {current?.type === "video" ? (
            <video
              ref={videoRef}
              className="size-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              poster={current.poster}
              onEnded={() => go(index + 1)}
            >
              <source src={current.src} type="video/mp4" />
            </video>
          ) : current ? (
            <motion.img
              src={current.src}
              alt={current.alt}
              className="size-full object-cover"
              initial={reduce ? undefined : { scale: 1.02 }}
              animate={reduce ? undefined : { scale: 1.14 }}
              transition={{ duration: IMAGE_MS / 1000 + 1.2, ease: "linear" }}
              draggable={false}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Legibility scrims */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

      {/* Slide indicators */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={`${slide.type}-${i}`}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-9 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}
