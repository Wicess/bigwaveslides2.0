import Image from "next/image";
import { cn } from "@/lib/utils";

type MediaImageProps = {
  src: string;
  alt: string;
  /** Responsive `sizes` hint for the optimizer. */
  sizes?: string;
  priority?: boolean;
  rounded?: boolean;
  /** Classes for the aspect/size container (e.g. `aspect-video`, `h-64`). */
  className?: string;
  /** Classes for the image itself (e.g. `object-cover`, hover transforms). */
  imgClassName?: string;
};

/**
 * Optimized image for R2/CDN-served media. Fill-based: the container controls
 * size (give it an aspect/height). Uses next/image (AVIF/WebP, lazy, responsive).
 */
export function MediaImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority,
  rounded = true,
  className,
  imgClassName,
}: MediaImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        rounded && "rounded-[var(--radius-lg)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover transition-transform duration-700 ease-out",
          imgClassName,
        )}
      />
    </div>
  );
}
