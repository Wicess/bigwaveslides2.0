import * as React from "react";
// `cn` merges Tailwind class strings (and drops falsy values like `false`,
// which is what the `spacing === "..."` checks below rely on).
import { cn } from "@/lib/utils";

/**
 * This file exports three small building blocks used to lay out page sections
 * consistently across the whole site:
 *   - Section:       a <section> wrapper that controls top/bottom spacing.
 *   - Eyebrow:       a small uppercase label shown above a heading.
 *   - SectionHeader: an eyebrow + title + description grouped together.
 */

/**
 * Section — controls vertical rhythm. Defaults are intentionally tight so
 * sections "hug" each other (brand rule: no excessive whitespace).
 * Use `spacing="compact"` for even tighter bands.
 */
export function Section({
  className,
  // `spacing` picks one of three vertical-padding presets (see below).
  spacing = "default",
  children,
  // Forward any other <section> attributes (id, aria-*, etc.) onto the element.
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  // The `&` joins React's standard section attributes with our custom prop.
  spacing?: "compact" | "default" | "loose";
}) {
  return (
    <section
      // Only the line whose `spacing === "..."` check is true contributes its
      // padding classes; the others evaluate to `false` and cn ignores them.
      // `className` is last so callers can override the defaults.
      className={cn(
        spacing === "compact" && "py-10 sm:py-12",
        spacing === "default" && "py-12 sm:py-16 lg:py-20",
        spacing === "loose" && "py-16 sm:py-24 lg:py-28",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/**
 * Eyebrow — the small, spaced-out, uppercase label that sits above a heading
 * (e.g. "OUR SLIDES"). Purely visual; render any text or icons as children.
 */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * SectionHeader — the standard heading block at the top of a section.
 * Combines an optional eyebrow, a required title, and an optional description,
 * and can be left-aligned (default) or centered.
 *
 * `?` after a prop name means it is optional; props typed `React.ReactNode`
 * accept text, numbers, or JSX.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        // Add centering classes only when align === "center".
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {/* Render the eyebrow only if one was passed in; otherwise nothing. */}
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
