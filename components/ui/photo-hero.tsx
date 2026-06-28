import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

/**
 * PhotoHero — the full-bleed cover-photo banner used across inner pages (blog
 * article, about, services, shop, rent, legal). The photo runs up behind the
 * sticky nav (negative top margin) with a dark scrim. The title is centered,
 * animated (rise-in + a soft shimmer), and compact on mobile. Pass `children`
 * for extra controls (filters, jump links) below the copy.
 *
 * `eyebrow` is accepted for backwards compatibility but no longer rendered —
 * pages lead with the animated title only.
 */
export function PhotoHero({
  image,
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
      <Container className="relative z-10 max-w-[84rem] pb-9 pt-[118px] text-center sm:pb-14 sm:pt-[150px]">
        <div className="hero-rise mx-auto flex max-w-3xl flex-col items-center">
          <h1 className="text-shimmer bg-[linear-gradient(110deg,#ffffff_0%,#bfe6ff_30%,#ffffff_50%,#bfe6ff_70%,#ffffff_100%)] text-balance font-display text-[1.7rem] font-extrabold leading-[1.08] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85 sm:mt-4 sm:text-lg">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </header>
  );
}
