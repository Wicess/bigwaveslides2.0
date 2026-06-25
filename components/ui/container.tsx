import * as React from "react";
// `cn` merges Tailwind class strings together (and resolves conflicts).
// See the comment in button.tsx for more on how cn works.
import { cn } from "@/lib/utils";

/**
 * Container — the standard horizontal wrapper used on every page.
 *
 * It centers content, caps the maximum width, and adds responsive side
 * padding so text never touches the screen edges. Wrap a page's content in
 * <Container> to keep all sections aligned to the same left/right boundaries.
 *
 * Usage:
 *   <Container>...page content...</Container>
 *   <Container className="max-w-3xl">...narrower content...</Container>
 */
export function Container({
  className,
  children,
  // `...props` collects any other standard <div> attributes (id, onClick,
  // aria-*, etc.) so they can be forwarded straight onto the rendered <div>.
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // mx-auto = center horizontally; max-w-7xl = width cap; px-* = side
      // padding that grows on larger screens. Any `className` passed in is
      // merged on the end so callers can override or extend these defaults.
      className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8", className)}
      // Spread the remaining props onto the element (prop forwarding).
      {...props}
    >
      {children}
    </div>
  );
}
