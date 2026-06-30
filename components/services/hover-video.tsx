"use client";

import * as React from "react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

/**
 * HoverVideo — shows a still image and, on hover (desktop) or when scrolled
 * into view (touch), cross-fades to a muted looping clip. The image stays
 * mounted underneath so there's never a blank frame while the video buffers.
 */
export function HoverVideo({
  image,
  video,
  alt,
  className,
  sizes,
  priority,
}: {
  image: string;
  video: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const play = React.useCallback(() => {
    setActive(true);
    const v = ref.current;
    if (v) void v.play().catch(() => {});
  }, []);
  const stop = React.useCallback(() => {
    setActive(false);
    ref.current?.pause();
  }, []);

  // On touch devices (no hover), auto-play when the clip scrolls into view and
  // pause when it leaves — so the videos play on scroll without needing a hover.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: hover)").matches) return; // desktop keeps hover
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.6) play();
        else stop();
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, stop]);

  return (
    <div
      ref={boxRef}
      className={cn(
        "group/hv relative overflow-hidden rounded-[var(--radius-lg)] bg-muted",
        className,
      )}
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      <MediaImage
        src={image}
        alt={alt}
        rounded={false}
        className="size-full"
        imgClassName={cn(
          "transition-transform duration-700 ease-out group-hover/hv:scale-105",
        )}
        sizes={sizes}
        priority={priority}
      />

      <video
        ref={ref}
        src={video}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setReady(true)}
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out",
          active && ready ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      {/* Subtle "hover to play" affordance, hidden once playing. */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-opacity duration-300",
          active ? "opacity-0" : "opacity-100 group-hover/hv:opacity-0",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 translate-x-px">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </div>
  );
}
