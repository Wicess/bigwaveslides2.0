import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, type LucideIcon } from "lucide-react";
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

/** Back navigation link used at the top of detail pages. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="admin-rise mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
    >
      <ArrowLeft className="size-4" /> {children}
    </Link>
  );
}

/** Section card title with an icon chip. */
export function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-bold text-foreground">
      <span className="grid size-8 place-items-center rounded-lg bg-primary-50 text-primary">
        <Icon className="size-[18px]" />
      </span>
      {children}
    </h2>
  );
}

/** Gradient initials avatar. */
export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}

/** Small count pill, e.g. next to a page title. */
export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary">
      {children}
    </span>
  );
}

/** Centered empty-state for lists. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-50 text-primary">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-display text-base font-bold text-foreground">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Toolbar row above a list — slot in filters/search on the left, actions right. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "admin-rise mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Sticky, styled <thead> cell. */
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}
