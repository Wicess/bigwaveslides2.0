"use client";

import { useEffect, useState } from "react";
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
const MOBILE_MS = 4200;
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
  const [mobileStep, setMobileStep] = useState(0);

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

  // Mobile: auto-advancing carousel that fades between single reviews.
  useEffect(() => {
    if (reduce || n <= 1) return;
    const id = setInterval(() => setMobileStep((s) => s + 1), MOBILE_MS);
    return () => clearInterval(id);
  }, [reduce, n]);

  if (n === 0) return null;

  const mobileIndex = order.length ? order[mobileStep % n]! : 0;
  const mobileItem = testimonials[mobileIndex]!;

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

        {/* Mobile: single auto-advancing card */}
        <div className="mt-10 sm:hidden">
          <div className="relative min-h-[14rem]">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={mobileItem.id}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <ReviewCard
                  item={mobileItem}
                  locale={locale}
                  verifiedLabel={verified}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex justify-center gap-2">
            {testimonials.map((tt, i) => (
              <span
                key={tt.id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === mobileIndex ? "w-6 bg-white" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
