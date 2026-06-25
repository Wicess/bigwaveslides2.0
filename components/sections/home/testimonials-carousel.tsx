"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Stars } from "@/components/ui/stars";
import { cn } from "@/lib/utils";

const BG =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/categories/pool.jpg";
const DESKTOP_COUNT = 4;
const SWAP_MS = 3200;
const MOBILE_MS = 4500;
const EASE = [0.22, 1, 0.36, 1] as const;

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
  const location = [item.authorRole, item.organization]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_24px_55px_-22px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="font-bold text-foreground">{item.authorName}</p>
        <Stars rating={item.rating} size="size-4" />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-primary">
        <BadgeCheck className="size-4" />
        <span className="text-sm font-medium">{verifiedLabel}</span>
      </div>
      <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground/90">
        {getLocalized(item.quote, locale)}
      </blockquote>
      {location ? (
        <p className="mt-5 text-sm text-muted-foreground">{location}</p>
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
  const reduce = useReducedMotion();
  const n = testimonials.length;
  const verified = t("verifiedCustomer");

  // Deterministic initial order for SSR; shuffle on the client after mount.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: n }, (_, i) => i),
  );
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: Math.min(DESKTOP_COUNT, n) }, (_, i) => i),
  );

  // Mobile swipe carousel state
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(0);

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
  useEffect(() => {
    if (reduce || n <= DESKTOP_COUNT) return;
    const id = setInterval(() => {
      setSlots((cur) => {
        const visible = new Set(cur);
        const candidates = order.filter((idx) => !visible.has(idx));
        if (candidates.length === 0) return cur;
        const slot = Math.floor(Math.random() * cur.length);
        const incoming = candidates[Math.floor(Math.random() * candidates.length)]!;
        const next = cur.slice();
        next[slot] = incoming;
        return next;
      });
    }, SWAP_MS);
    return () => clearInterval(id);
  }, [order, n, reduce]);

  // Mobile: gently auto-advance the swipeable carousel (pauses while swiping).
  useEffect(() => {
    if (reduce || n <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el || pausedRef.current) return;
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

  if (n === 0) return null;

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

  // Pause auto-advance briefly when the user takes over.
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
        <img src={BG} alt="" className="size-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/80 to-ink/90" />
      </div>

      <Container>
        <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-tight text-white drop-shadow-[0_3px_16px_rgba(0,0,0,0.6)] sm:text-4xl lg:text-5xl">
          {t("testimonialsTitle")}
        </h2>

        {/* Desktop: 4 cards that randomly refresh */}
        <div className="mt-12 hidden grid-cols-2 items-stretch gap-5 sm:grid lg:grid-cols-4">
          {slots.map((idx, slot) => {
            const item = testimonials[idx];
            return (
              <div key={slot} className="relative min-h-[15rem]">
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

        {/* Mobile: swipeable carousel (auto-advances, pauses on swipe) */}
        <div className="mt-10 sm:hidden">
          <div
            ref={scrollerRef}
            onScroll={syncActive}
            onPointerDown={pause}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

          <div className="mt-5 flex justify-center gap-2">
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
