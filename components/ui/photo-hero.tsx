import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * PhotoHero — the full-bleed cover-photo banner used across inner pages (blog
 * article, about, services, shop, rent). The photo runs up behind the sticky
 * nav (via the negative top margin) with a dark scrim so the white
 * eyebrow/title/description stay legible. Pass `children` for extra controls
 * (filters, buttons) below the copy.
 */
export function PhotoHero({
  image,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  image: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Extra classes on the <header> (e.g. `hidden md:block` to hide on mobile). */
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative -mt-[108px] overflow-hidden border-b border-border bg-neutral-900 sm:-mt-[116px]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/55 to-neutral-950/45"
      />
      <Container className="relative z-10 max-w-[84rem] pb-12 pt-[122px] sm:pb-14 sm:pt-[146px]">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 max-w-4xl text-balance font-display text-[2rem] font-bold leading-[1.07] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{description}</p>
        ) : null}
        {children}
      </Container>
    </header>
  );
}
