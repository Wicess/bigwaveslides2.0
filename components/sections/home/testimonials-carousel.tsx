/*
 * TestimonialsCarousel
 * --------------------
 * A homepage section showing customer reviews over a darkened photo backdrop.
 *
 * It shows two different layouts:
 *   - Desktop: a fixed grid of 4 review cards. Every few seconds one random
 *     card is swapped out for a different review, so the section feels alive.
 *   - Mobile: a single-card-wide carousel you can swipe through. It also
 *     auto-advances on a timer, and pauses that timer while you're interacting.
 *
 * The reviews are shuffled into a random order so the section looks fresh on
 * each visit. This is a Client Component ("use client") because it uses timers,
 * randomness, and direct DOM scrolling that only work in the browser. Appears
 * on the homepage / landing page.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/lib/utils";
import { optimizedSrc } from "@/lib/image-loader";

// Background image (hosted on Cloudflare R2) shown behind the reviews.
const BG =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/categories/pool.jpg";
const DESKTOP_COUNT = 4; // how many cards the desktop grid shows at once.
const SWAP_MS = 3200; // desktop: how often (ms) one card is swapped out.
const MOBILE_MS = 4500; // mobile: how often (ms) the carousel auto-advances.
const EASE = [0.22, 1, 0.36, 1] as const; // a custom easing curve for animations.

type Testimonial = {
  id: string;
  authorName: string;
  authorRole: string | null;
  organization: string | null;
  rating: number;
  quote: unknown;
};

function ReviewCard({
  item,
  locale,
  verifiedLabel,
}: {
  item: Testimonial;
  locale: string;
  verifiedLabel: string;
}) {
  // Combine role + organization into one line (e.g. "Parent, Sunny Daycare"),
  // skipping any that are empty so we don't get stray commas.
  const location = [item.authorRole, item.organization]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_24px_55px_-22px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="text-foreground font-bold">{item.authorName}</p>
        <Stars rating={item.rating} size="size-4" />
      </div>
      <div className="text-primary mt-2.5 flex items-center gap-1.5">
        <BadgeCheck className="size-4" />
        <span className="text-sm font-medium">{verifiedLabel}</span>
      </div>
      <blockquote className="text-foreground/90 mt-4 flex-1 leading-relaxed text-pretty">
        {getLocalized(item.quote, locale)}
      </blockquote>
      {location ? (
        <p className="text-muted-foreground mt-5 text-sm">{location}</p>
      ) : null}
    </article>
  );
}

export function TestimonialsCarousel({
  testimonials,
  locale,
}: {
  testimonials: Testimonial[];
  locale: string;
}) {
  const t = useTranslations("Home");
  // True if the user prefers reduced motion; we skip animations/timers if so.
  const reduce = useReducedMotion();
  const n = testimonials.length; // total number of reviews available.
  const verified = t("verifiedCustomer");

  // `order` is the shuffled list of review indexes; `slots` is which reviews
  // are currently shown in the 4 desktop cards.
  //
  // Why start with a plain 0,1,2,3... order instead of shuffling right away?
  // This component renders on the server first (SSR). If we shuffled during
  // render, the server and the browser would pick different random orders and
  // React would complain about the mismatch ("hydration error"). So we render a
  // predictable order on both sides, then shuffle in useEffect (browser-only)
  // once the page is interactive.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: n }, (_, i) => i),
  );
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: Math.min(DESKTOP_COUNT, n) }, (_, i) => i),
  );

  // Mobile swipe carousel state.
  // scrollerRef: the scrollable row element, so we can read/control scrolling.
  // pausedRef: whether auto-advance is paused (because the user is swiping).
  // resumeRef: the timer id that re-enables auto-advance after a pause.
  // active: which card is currently centered (used to highlight the dots).
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(0);

  // Runs once after mount (browser only): shuffle the review order using the
  // Fisher-Yates algorithm (walk from the end, swap each item with a random
  // earlier one). Then pick the first few for the desktop slots.
  useEffect(() => {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    setOrder(arr);
    setSlots(arr.slice(0, Math.min(DESKTOP_COUNT, n)));
  }, [n]);

  // Desktop: every few seconds, swap one random card for an off-screen review.
  // We skip this entirely if the user prefers reduced motion, or if there
  // aren't more reviews than visible slots (nothing new to rotate in).
  useEffect(() => {
    if (reduce || n <= DESKTOP_COUNT) return;
    const id = setInterval(() => {
      setSlots((cur) => {
        // Reviews currently on screen, so we don't pick one that's a duplicate.
        const visible = new Set(cur);
        const candidates = order.filter((idx) => !visible.has(idx));
        if (candidates.length === 0) return cur;
        // Choose a random visible slot to replace, and a random off-screen
        // review to put there.
        const slot = Math.floor(Math.random() * cur.length);
        const incoming =
          candidates[Math.floor(Math.random() * candidates.length)]!;
        const next = cur.slice();
        next[slot] = incoming;
        return next;
      });
    }, SWAP_MS);
    // Stop the timer when the component unmounts.
    return () => clearInterval(id);
  }, [order, n, reduce]);

  // Mobile: gently auto-advance the swipeable carousel (pauses while swiping).
  useEffect(() => {
    if (reduce || n <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      // Do nothing if the row isn't mounted yet, or the user is mid-swipe.
      if (!el || pausedRef.current) return;
      // Find which card is currently nearest the center of the viewport by
      // comparing each card's center to the scroller's center.
      const center = el.scrollLeft + el.clientWidth / 2;
      let cur = 0;
      let best = Infinity;
      Array.from(el.children).forEach((c, i) => {
        const node = c as HTMLElement;
        const cc = node.offsetLeft + node.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < best) {
          best = d;
          cur = i;
        }
      });
      // Smoothly scroll to the next card (wrapping back to the first with %),
      // centering it horizontally in the visible area.
      const next = el.children[(cur + 1) % n] as HTMLElement | undefined;
      if (next) {
        el.scrollTo({
          left: next.offsetLeft - (el.clientWidth - next.clientWidth) / 2,
          behavior: "smooth",
        });
      }
    }, MOBILE_MS);
    return () => clearInterval(id);
  }, [reduce, n]);

  // Nothing to render if there are no testimonials.
  if (n === 0) return null;

  // Called whenever the mobile row scrolls. It works out which card is nearest
  // the center and stores its index in `active`, which keeps the little dots
  // below in sync with the card you're currently looking at.
  const syncActive = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const node = c as HTMLElement;
      const cc = node.offsetLeft + node.clientWidth / 2;
      const d = Math.abs(cc - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActive(best);
  };

  // Pause auto-advance briefly when the user takes over (e.g. starts swiping).
  // We flag it paused, then set a 7-second timer to resume. Each new
  // interaction clears the old timer so the pause keeps extending while the
  // user is actively scrolling.
  const pause = () => {
    pausedRef.current = true;
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 7000);
  };

  return (
    <section className="relative isolate overflow-hidden py-14 sm:py-20">
      {/* Full-bleed darkened backdrop */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizedSrc(BG, 1400)}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
        <div className="from-ink/85 via-ink/80 to-ink/90 absolute inset-0 bg-gradient-to-b" />
      </div>

      <Container>
        <h2 className="font-display text-center text-3xl font-extrabold tracking-tight text-white uppercase drop-shadow-[0_3px_16px_rgba(0,0,0,0.6)] sm:text-4xl lg:text-5xl">
          {t("testimonialsTitle")}
        </h2>

        {/* Desktop: 4 cards that randomly refresh (hidden on mobile). */}
        <div className="mt-12 hidden grid-cols-2 items-stretch gap-5 sm:grid lg:grid-cols-4">
          {slots.map((idx, slot) => {
            const item = testimonials[idx];
            return (
              <div key={slot} className="relative min-h-[15rem]">
                {/* AnimatePresence + a key tied to the review id lets framer-
                    motion animate the old card out and the new one in whenever
                    this slot swaps to a different review. */}
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={item?.id ?? idx}
                    className="h-full"
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    {item ? (
                      <ReviewCard
                        item={item}
                        locale={locale}
                        verifiedLabel={verified}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Mobile: swipeable carousel (auto-advances, pauses on swipe). */}
        <div className="mt-10 sm:hidden">
          {/* onScroll keeps the dots in sync; onPointerDown pauses auto-advance
              the moment the user touches the row. snap-x snaps each card into
              place, and the scrollbar is hidden for a cleaner look. */}
          <div
            ref={scrollerRef}
            onScroll={syncActive}
            onPointerDown={pause}
            className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {order.map((idx) => {
              const item = testimonials[idx]!;
              return (
                <div key={item.id} className="w-[86%] shrink-0 snap-center">
                  <ReviewCard
                    item={item}
                    locale={locale}
                    verifiedLabel={verified}
                  />
                </div>
              );
            })}
          </div>

          {/* The row of progress dots. The dot matching `active` (the centered
              card) widens and brightens; the rest stay small and faded. */}
          <div className="mt-5 hidden justify-center gap-2 sm:flex">
            {order.map((idx, i) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === active ? "w-6 bg-white" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
