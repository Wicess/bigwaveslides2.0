"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type HeroSlide =
  | { type: "video"; src: string; poster?: string }
  | { type: "image"; src: string; alt: string };

const IMAGE_MS = 6000;
const VIDEO_FALLBACK_MS = 14000;
const FADE_S = 1.2;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed background carousel: a looping promo video and HD photos.
 *
 * To avoid any black flash between slides, every slide stays mounted and
 * stacked. The incoming slide fades IN on top while the outgoing one is held
 * fully opaque underneath (its fade-out is delayed until the new one fully
 * covers it) — so there's never a moment where the dark backdrop shows through.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const reduce = useReducedMotion();
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = React.useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  React.useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const current = slides[index];

    // Play the active video from the start; pause the others.
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      } else {
        v.pause();
      }
    });

    if (current?.type === "video") {
      timer.current = setTimeout(() => go(index + 1), VIDEO_FALLBACK_MS);
    } else {
      timer.current = setTimeout(() => go(index + 1), IMAGE_MS);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, slides, go]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <motion.div
            key={`${slide.type}-${i}`}
            className="absolute inset-0"
            style={{ zIndex: active ? 2 : 1 }}
            initial={false}
            animate={{ opacity: active ? 1 : 0 }}
            // Active fades in immediately; inactive holds opaque (delay) then drops,
            // so the new slide is fully covering before the old one disappears.
            transition={{ duration: FADE_S, ease: EASE, delay: active ? 0 : FADE_S }}
          >
            {slide.type === "video" ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className="size-full object-cover"
                muted
                playsInline
                preload="auto"
                poster={slide.poster}
                onEnded={() => active && go(index + 1)}
              >
                <source src={slide.src} type="video/mp4" />
              </video>
            ) : (
              <motion.img
                src={slide.src}
                alt={slide.alt}
                className="size-full object-cover"
                initial={false}
                animate={reduce ? undefined : { scale: active ? 1.12 : 1.04 }}
                transition={{ duration: active ? IMAGE_MS / 1000 + FADE_S : 0, ease: "linear" }}
                draggable={false}
              />
            )}
          </motion.div>
        );
      })}

      {/* Light scrim — keeps the HD imagery bright while giving the see-through
          navbar (top) and the hero copy (bottom) just enough contrast. */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-b from-black/35 via-black/5 to-black/50" />

      {/* Slide indicators */}
      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={`dot-${slide.type}-${i}`}
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
