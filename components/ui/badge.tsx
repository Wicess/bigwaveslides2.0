import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

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
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
