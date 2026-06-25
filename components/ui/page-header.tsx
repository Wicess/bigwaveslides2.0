// `import type` brings in only the TypeScript type (no runtime code).
import type { ReactNode } from "react";
// Reuses the shared layout/heading building blocks for consistency.
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section";

/**
 * PageHeader — the title banner at the top of inner pages (e.g. /about,
 * /slides). It renders an optional eyebrow, a big <h1> title, an optional
 * description, and any extra `children` (such as buttons) below.
 *
 * The large top padding (`pt-28`+) leaves room for the fixed site header so
 * the title isn't hidden behind it.
 *
 * Usage:
 *   <PageHeader eyebrow="About" title="Our story" description="..." />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border pb-10 pt-28 sm:pt-32 lg:pb-14">
      {/* Decorative background glow. `aria-hidden` hides it from screen
          readers; `pointer-events-none` keeps it from blocking clicks; and
          `-z-10` places it behind the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 60% at 80% 0%, rgba(0,212,255,0.14), transparent 70%)",
        }}
      />
      <Container>
        {/* Each piece below renders only if its prop was provided. */}
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
