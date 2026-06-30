// "use client" marks this as a Client Component: it runs in the browser
// because it uses state, timers, and motion (interactive behavior).
"use client";

/*
 * HeroCarousel
 * The animated, full-screen background behind the homepage hero. It rotates
 * through a promo video and high-res photos, fading smoothly between them, and
 * shows little dots at the bottom to jump between slides. Rendered by <Hero>.
 */
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// A slide is either a video (with an optional poster image shown before it
// loads) or a photo (with alt text for accessibility).
export type HeroSlide =
  | { type: "video"; src: string; poster?: string }
  | { type: "image"; src: string; alt: string };

const IMAGE_MS = 6000; // how long a photo stays on screen before advancing
const VIDEO_FALLBACK_MS = 14000; // safety timer to advance if a video never fires "ended"
const FADE_S = 1.2; // crossfade length, in seconds
const EASE = [0.22, 1, 0.36, 1] as const; // easing curve for a smooth, gentle fade

/**
 * Full-bleed background carousel: a looping promo video and HD photos.
 *
 * To avoid any black flash between slides, every slide stays mounted and
 * stacked. The incoming slide fades IN on top while the outgoing one is held
 * fully opaque underneath (its fade-out is delayed until the new one fully
 * covers it) — so there's never a moment where the dark backdrop shows through.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0); // which slide is currently showing
  const reduce = useReducedMotion(); // true if the user prefers less motion (accessibility)
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]); // direct handles to each <video>
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null); // the auto-advance timer

  // Move to a given slide. The math wraps the number around so it always lands
  // in range (e.g. going past the last slide loops back to the first).
  const go = React.useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  // Runs every time the active slide changes: resets the timer and plays/pauses
  // videos so only the visible one is playing.
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

    // Videos use a longer fallback timer (they normally advance on their own
    // "ended" event); photos advance after the shorter IMAGE_MS.
    if (current?.type === "video") {
      timer.current = setTimeout(() => go(index + 1), VIDEO_FALLBACK_MS);
    } else {
      timer.current = setTimeout(() => go(index + 1), IMAGE_MS);
    }
    // Cleanup: clear the timer when the slide changes or the component unmounts,
    // so we never advance twice.
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, slides, go]);

  return (
    // inset-0 makes this fill its parent; bg-ink is the dark fallback color.
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          // Every slide stays mounted and stacked on top of each other; we just
          // animate opacity. The active one sits above (higher zIndex) so it
          // fades in cleanly over the previous one.
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
                // Save a reference to this <video> so the effect above can
                // play/pause it.
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                // object-cover fills the area without distorting the video.
                className="size-full object-cover"
                muted // required for browsers to allow autoplay
                playsInline // play inline on iOS instead of going fullscreen
                preload="metadata" // only load enough to know size/length, saving data
                poster={slide.poster} // still image shown until the video plays
                // When the video finishes, advance — but only if it's the active one.
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
                // Slow "Ken Burns" zoom on the active photo for a lively feel.
                // Skipped entirely if the user prefers reduced motion.
                animate={reduce ? undefined : { scale: active ? 1.12 : 1.04 }}
                transition={{ duration: active ? IMAGE_MS / 1000 + FADE_S : 0, ease: "linear" }}
                draggable={false} // stop the browser's drag-to-save image behavior
              />
            )}
          </motion.div>
        );
      })}

      {/* Scrim — keeps the HD imagery bright while giving the see-through
          navbar (top) and the hero copy enough contrast. A vertical gradient
          handles the navbar + bottom, and a centered radial pool anchors the
          headline/subtitle so the copy stays legible over busy imagery. */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
      <div className="absolute inset-0 z-[5] [background:radial-gradient(120%_80%_at_50%_48%,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.28)_38%,transparent_72%)]" />

      {/* Slide indicators — the little dots at the bottom. Clicking one jumps
          to that slide. left-1/2 + -translate-x-1/2 centers the row. */}
      <div className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2.5 sm:flex">
        {slides.map((slide, i) => (
          <button
            key={`dot-${slide.type}-${i}`}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index} // marks the current dot for screen readers
            onClick={() => go(i)}
            // The active dot widens (w-9) and turns solid white; the others are
            // small and translucent, brightening on hover.
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
