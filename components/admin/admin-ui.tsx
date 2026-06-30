import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin UI kit — presentational building blocks shared across the admin panel,
 * styled for the warm "Cocoa & Amber" theme. All are Server-Component friendly
 * (no hooks); motion is pure CSS (see globals.css → .admin-rise / .admin-pop),
 * staggered with an inline animation-delay.
 */

/** Fade/rise-in wrapper. `delay` (seconds) staggers items in a list. */
export function Reveal({
  children,
  className,
  delay = 0,
  type = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  type?: "rise" | "pop" | "slide-in";
}) {
  return (
    <div className={cn(`admin-${type}`, className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

/** A soft white panel — the standard admin surface. */
export function AdminCard({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border/70 bg-[var(--admin-card)] shadow-[var(--shadow-soft)]",
        hover && "admin-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Card header row with a title and optional "view all" link or action node. */
export function CardHead({
  title,
  href,
  linkLabel = "View all",
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold tracking-tight text-foreground">{title}</h2>
      {action ??
        (href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-700"
          >
            {linkLabel} <ArrowRight className="size-4" />
          </Link>
        ) : null)}
    </div>
  );
}

/** KPI / stat tile — icon chip, big value, label, optional trend + link. */
export function StatTile({
  icon: Icon,
  label,
  value,
  trend,
  href,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  trend?: string;
  href?: string;
  delay?: number;
}) {
  const body = (
    <div
      className={cn(
        "group h-full rounded-[var(--radius-lg)] border border-border/70 bg-[var(--admin-card)] p-5 shadow-[var(--shadow-soft)]",
        href && "admin-lift",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
          <Icon className="size-5" />
        </span>
        {trend ? (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <Reveal delay={delay} className="h-full">
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </Reveal>
  );
}

/** Round icon chip used in list rows. */
export function IconChip({
  icon: Icon,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary",
        className,
      )}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}
