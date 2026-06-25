import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card primitives — a set of composable pieces for building boxed content
 * (product cards, info panels, etc.). Compose them together:
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Title</CardTitle>
 *       <CardDescription>Subtitle</CardDescription>
 *     </CardHeader>
 *     <CardContent>...</CardContent>
 *     <CardFooter>...</CardFooter>
 *   </Card>
 *
 * Each piece is a thin styled <div>/<h3>/<p> that also forwards any extra
 * props, so they stay flexible and easy to override with `className`.
 */

/**
 * Card — the outer container. `variant="solid"` is a normal bordered card;
 * `variant="glass"` uses the frosted-glass style.
 */
export function Card({
  className,
  variant = "solid",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "solid" | "glass" }) {
  return (
    <div
      className={cn(
        // Shared shape: rounded corners + soft shadow (from CSS variables).
        "rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)]",
        // Apply only the classes for the chosen variant.
        variant === "solid" && "border border-border bg-background",
        variant === "glass" && "glass",
        className,
      )}
      {...props}
    />
  );
}

// CardHeader — top region of the card; usually holds the title/description.
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

// CardTitle — the card's heading, rendered as an <h3>.
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold leading-tight", className)}
      {...props}
    />
  );
}

// CardDescription — muted supporting text under the title, rendered as a <p>.
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

// CardContent — main body of the card. `pt-0` keeps it snug under the header.
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

// CardFooter — bottom region, typically for actions/buttons (laid out in a row).
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}
