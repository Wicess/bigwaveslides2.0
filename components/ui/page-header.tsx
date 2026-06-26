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
  backgroundImage,
  align = "left",
  overlapHeader = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  tone?: "light" | "brand";
  /**
   * Optional photo rendered behind the header. A soft overlay is layered on
   * top so the title stays legible without washing the photo out. Used by the
   * blog page.
   */
  backgroundImage?: string;
  /** Text alignment for the eyebrow/title/description block. */
  align?: "left" | "center";
  /**
   * Pull the banner up so it sits *behind* the translucent sticky nav bar
   * (the photo then runs edge-to-edge up to the announcement line, with the
   * frosted nav floating on top). Adds extra top padding to clear the nav.
   */
  overlapHeader?: boolean;
}) {
  const brand = tone === "brand";
  const centered = align === "center";
  // When the photo title sits on a photo it needs a shadow to stay readable.
  const onPhoto = Boolean(backgroundImage);

  return (
    <section
      className={cn(
        "relative overflow-hidden pb-10 pt-28 sm:pt-32 lg:pb-14",
        // Slide the banner up under the sticky header so the photo reaches the
        // top of the page; bump the top padding back so text clears the nav.
        overlapHeader && "-mt-[108px] pt-[150px] pb-16 sm:-mt-[116px] sm:pt-[184px] lg:pb-20",
        brand
          ? "border-b border-white/10 text-white [background:linear-gradient(180deg,#0a1a2f_0%,#0e2742_100%)]"
          : "border-b border-border",
      )}
    >
      {/* Optional photo background. `-z-20` keeps it behind both the overlay
          (below) and the text. `object-cover` fills the banner without
          distortion. */}
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover"
        />
      ) : null}

      {/* Decorative background glow. `aria-hidden` hides it from screen
          readers; `pointer-events-none` keeps it from blocking clicks; and
          `-z-10` places it behind the text (but above the section bg). The
          brand variant uses a stronger blue glow to pop on the navy. When a
          photo background is set we instead lay down a *soft* overlay — just
          enough to seat the title without blurring/washing out the photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: onPhoto
            ? "linear-gradient(180deg, rgba(0,30,60,0.28) 0%, rgba(0,30,60,0.12) 40%, rgba(0,30,60,0.42) 100%)"
            : brand
              ? "radial-gradient(55% 70% at 82% 0%, rgba(0,153,255,0.38), transparent 70%)"
              : "radial-gradient(50% 60% at 80% 0%, rgba(0,212,255,0.14), transparent 70%)",
        }}
      />
      <Container className={cn(centered && "flex flex-col items-center text-center")}>
        {/* Each piece below renders only if its prop was provided. */}
        {eyebrow ? (
          <Eyebrow className={brand ? "text-secondary-400" : undefined}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <h1
          className={cn(
            "mt-3 max-w-3xl text-balance font-display font-bold leading-[1.03] tracking-tight",
            centered
              ? "text-5xl sm:text-6xl lg:text-7xl"
              : "text-4xl sm:text-5xl lg:text-6xl",
            onPhoto ? "text-primary" : brand && "text-white",
          )}
          style={
            onPhoto
              ? { textShadow: "0 2px 18px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.5)" }
              : undefined
          }
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-2xl text-lg",
              centered && "mx-auto",
              onPhoto
                ? "font-medium text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]"
                : brand
                  ? "text-white/75"
                  : "text-muted-foreground",
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
