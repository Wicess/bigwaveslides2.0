import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section — controls vertical rhythm. Defaults are intentionally tight so
 * sections "hug" each other (brand rule: no excessive whitespace).
 * Use `spacing="compact"` for even tighter bands.
 */
export function Section({
  className,
  spacing = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  spacing?: "compact" | "default" | "loose";
}) {
  return (
    <section
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
        align === "center" && "items-center text-center",
        className,
      )}
    >
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
