// Scroll helpers that cooperate with the Lenis smooth-scroll instance (exposed
// on window by LenisProvider). Falls back to native scrolling when Lenis is off
// (reduced-motion) or not yet mounted.

type LenisLike = { scrollTo: (target: number, opts?: { immediate?: boolean }) => void };

function getLenis(): LenisLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { __lenis?: LenisLike }).__lenis;
}

/** Jump to the top of the page immediately (no smooth glide). */
export function scrollToTop(): void {
  if (typeof window === "undefined") return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo({ top: 0, left: 0 });
}
