import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Marquee — seamless infinite horizontal scroll. Children are duplicated so the
 * loop has no visible seam. Pauses on hover; honors reduced motion (CSS).
 */
export function Marquee({
  children,
  className,
  durationSeconds = 32,
  reverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  durationSeconds?: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]",
        className,
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            "animate-marquee flex shrink-0 items-center gap-8 pr-8 group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
          style={
            {
              "--marquee-duration": `${durationSeconds}s`,
            } as React.CSSProperties
          }
        >
          {children}
        </div>
      ))}
    </div>
  );
}
