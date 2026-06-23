"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Lazy-load the WebGL canvas so it never blocks first paint or SSR.
const WaveCanvas = dynamic(() => import("./wave-canvas"), {
  ssr: false,
  loading: () => (
    <div className="size-full animate-pulse rounded-[inherit] bg-primary-50" />
  ),
});

/** 3D liquid blob with a static gradient fallback for reduced motion. */
export function WaveScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {reduce ? (
        <div
          className="size-full"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #00D4FF, #0099FF 45%, #003366 100%)",
          }}
        />
      ) : (
        <WaveCanvas />
      )}
    </div>
  );
}
