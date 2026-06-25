/*
 * WhyChooseUs
 * -----------
 * A homepage section that builds trust. It's a single card split into two
 * halves:
 *   - Left: a large HD photo with a headline and a "Rent now" button.
 *   - Right: a panel of headline stats (events served, slides, years, rating).
 *
 * Nice touches for the user:
 *   - The stat numbers animate by counting up from 0 when scrolled into view.
 *   - Both halves slide in from the sides as you scroll down to them.
 *
 * This is a Client Component ("use client") because it uses animation and
 * scroll-detection hooks that only run in the browser. Appears on the
 * homepage / landing page.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { EASE_OUT } from "@/components/motion/variants";

const WHY_IMAGE =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/why/trusted.jpg";

// Easing curve for the count-up animation. Given progress "x" from 0 to 1, it
// returns an eased 0..1 value that starts fast and slows down near the end,
// so the numbers feel snappy then settle gently instead of moving at a robotic
// constant speed.
function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Counter — shows a number that animates up from 0 to `to` once it scrolls
 * into view. `decimals` controls how many decimal places to show (e.g. 1 for
 * the 4.9 rating) and `suffix` appends a symbol like "+" or "★".
 */
function Counter({
  to,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  // ref attaches to the <span> below so we can watch when it enters the screen.
  const ref = useRef<HTMLSpanElement>(null);
  // useInView becomes true once this element scrolls into view. "once: true"
  // means it only fires the first time; the "-80px" margin triggers it slightly
  // before the element is fully visible.
  const inView = useInView(ref, { once: true, margin: "-80px" });
  // The number currently shown on screen; starts at 0 and animates toward `to`.
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Wait until the element is on screen before starting the animation.
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1600; // total animation length in milliseconds.
    // tick runs once per frame. We figure out how far through the animation we
    // are (p, from 0 to 1), apply easing, and set the displayed value.
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(to * easeOutCubic(p));
      // Keep requesting frames until we reach the end (p === 1).
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Cleanup: if the component unmounts mid-animation, stop the pending frame.
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function WhyChooseUs() {
  // "t" looks up translated text for the current language.
  const t = useTranslations("Home");
  // True if the user has asked their OS to minimize animations. We respect that
  // by skipping the slide-in motion below.
  const reduce = useReducedMotion();

  // The four headline stats. `to` is the target number the Counter animates to.
  const stats = [
    { to: 5000, suffix: "+", decimals: 0, label: t("statEvents") },
    { to: 40, suffix: "+", decimals: 0, label: t("statSlides") },
    { to: 12, suffix: "", decimals: 0, label: t("statYears") },
    { to: 4.9, suffix: "★", decimals: 1, label: t("statRating") },
  ];

  // Helper that returns framer-motion props for a "slide in on scroll" effect.
  // `from` is the horizontal start offset (negative = slides in from the left,
  // positive = from the right). The element starts invisible and shifted, then
  // animates to its natural spot once scrolled into view. If reduced motion is
  // requested, we return {} so no animation is applied.
  const slide = (from: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, x: from, y: 24 },
          whileInView: { opacity: 1, x: 0, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.7, ease: EASE_OUT },
        };

  return (
    <section className="bg-gradient-to-b from-white via-primary-50/50 to-white py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[96rem]">
        {/* The split card. On large screens it's a 2-column grid where the
            image column is wider (1.55fr) than the stats column (1fr). */}
        <div className="group grid overflow-hidden rounded-[var(--radius-xl)] shadow-[0_24px_70px_-30px_rgba(0,51,102,0.45)] transition-shadow duration-500 hover:shadow-[0_30px_80px_-28px_rgba(0,51,102,0.55)] lg:grid-cols-[1.55fr_1fr]">
          {/* Left — wider HD image with heading + CTA. slide(-48) makes it
              slide in from the left. */}
          <motion.div
            {...slide(-48)}
            className="relative flex min-h-[18rem] flex-col justify-end overflow-hidden p-7 text-white sm:min-h-[20rem] sm:p-9 lg:min-h-[22rem]"
          >
            <MediaImage
              src={WHY_IMAGE}
              alt={t("whyTitle")}
              rounded={false}
              className="absolute inset-0 size-full"
              imgClassName="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              sizes="(min-width:1024px) 60vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

            <div className="relative">
              <h2 className="max-w-md font-display text-3xl font-bold leading-[1.1] tracking-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)] sm:text-4xl">
                {t("whyTitle")}
              </h2>
              <Button
                asChild
                size="lg"
                className="mt-6 bg-white text-accent shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/90"
              >
                <Link href="/rent">
                  {t("ctaRentNow")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right — stats panel. slide(48) makes it slide in from the right,
              so the two halves meet in the middle. */}
          <motion.div
            {...slide(48)}
            className="flex flex-col justify-center gap-7 bg-gradient-to-br from-primary-50 to-white p-7 sm:p-9 lg:p-10"
          >
            <p className="max-w-sm text-pretty text-base leading-relaxed text-muted-foreground">
              {t("trustServing")}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {stats.map((s) => (
                <div key={s.label} className="group/stat">
                  <p className="font-display text-4xl font-bold text-accent transition-transform duration-300 group-hover/stat:scale-105 sm:text-5xl">
                    <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
