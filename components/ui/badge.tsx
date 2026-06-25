import * as React from "react";
// cva builds the class string for each `variant`; VariantProps derives its
// TypeScript type. See button.tsx for a fuller explanation of this pattern.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — a small rounded pill label used for tags, statuses, and highlights
 * (e.g. "New", "Popular", a rating chip). Pick the color with `variant`.
 *
 * Usage:
 *   <Badge>Popular</Badge>
 *   <Badge variant="success">In stock</Badge>
 */

// One `variant` group of color options; defaults to "primary".
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary-50 text-primary-700",
        secondary: "bg-secondary/15 text-secondary-600",
        accent: "bg-accent text-white",
        outline: "border border-border text-foreground",
        success: "bg-emerald-50 text-emerald-700",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Badge({
  className,
  variant,
  // Forward any other <span> attributes onto the rendered element.
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    // Build the variant classes, merge any caller className, then spread props.
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
