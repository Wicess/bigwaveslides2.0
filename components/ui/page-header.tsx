// `import type` brings in only the TypeScript type (no runtime code).
import type { ReactNode } from "react";
// Reuses the shared layout/heading building blocks for consistency.
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the title banner at the top of inner pages (e.g. /about,
 * /shop). It renders an optional eyebrow, a big <h1> title, an optional
 * description, and any extra `children` (such as buttons) below.
 *
 * The large top padding (`pt-28`+) leaves room for the fixed site header so
 * the title isn't hidden behind it.
 *
 * `tone` controls the look:
 *   - "light" (default): white background, dark text — used by most pages.
 *   - "brand": the deep-navy gradient from the homepage, white text — used by
 *     the shop so it visually matches the landing page.
 *
 * Usage:
 *   <PageHeader eyebrow="About" title="Our story" description="..." />
 *   <PageHeader tone="brand" eyebrow="Shop" title="Water slides for sale" />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  tone = "light",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  tone?: "light" | "brand";
}) {
  const brand = tone === "brand";

  return (
    <section
      className={cn(
        "relative overflow-hidden pb-10 pt-28 sm:pt-32 lg:pb-14",
        brand
          ? "border-b border-white/10 text-white [background:linear-gradient(180deg,#0a1a2f_0%,#0e2742_100%)]"
          : "border-b border-border",
      )}
    >
      {/* Decorative background glow. `aria-hidden` hides it from screen
          readers; `pointer-events-none` keeps it from blocking clicks; and
          `-z-10` places it behind the text (but above the section bg). The
          brand variant uses a stronger blue glow to pop on the navy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: brand
            ? "radial-gradient(55% 70% at 82% 0%, rgba(0,153,255,0.38), transparent 70%)"
            : "radial-gradient(50% 60% at 80% 0%, rgba(0,212,255,0.14), transparent 70%)",
        }}
      />
      <Container>
        {/* Each piece below renders only if its prop was provided. */}
        {eyebrow ? (
          <Eyebrow className={brand ? "text-secondary-400" : undefined}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <h1
          className={cn(
            "mt-3 max-w-3xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl",
            brand && "text-white",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-lg",
              brand ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
