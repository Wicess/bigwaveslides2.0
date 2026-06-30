import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stars — a read-only 5-star rating display used in reviews/testimonials.
 *
 * Pass a numeric `rating` (e.g. 4.6). It always draws 5 star icons and fills
 * the first N gold, where N is the rating rounded to the nearest whole star.
 * `size` is a Tailwind sizing class so callers can make the stars bigger.
 *
 * Usage:
 *   <Stars rating={4.6} />
 *   <Stars rating={5} size="size-5" />
 */
export function Stars({
  rating,
  className,
  size = "size-4",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  // Round to the nearest whole star to decide how many are "filled".
  const rounded = Math.round(rating);
  return (
    <div
      role="img"
      className={cn("inline-flex items-center gap-0.5", className)}
      // Screen-reader label showing the exact rating (the icons are decorative).
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      {/* Render five stars; `i` is the star's position, 1 through 5. */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          // `key` helps React track each star in the list efficiently.
          key={i}
          className={cn(
            size,
            // Stars up to `rounded` are gold; the rest are a faint outline.
            i <= rounded
              ? "fill-amber-400 text-amber-400"
              : "fill-border text-border",
          )}
        />
      ))}
    </div>
  );
}
