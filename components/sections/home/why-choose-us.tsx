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

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function Counter({
  to,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(to * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
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
  const t = useTranslations("Home");
  const reduce = useReducedMotion();

  const stats = [
    { to: 5000, suffix: "+", decimals: 0, label: t("statEvents") },
    { to: 40, suffix: "+", decimals: 0, label: t("statSlides") },
    { to: 12, suffix: "", decimals: 0, label: t("statYears") },
    { to: 4.9, suffix: "★", decimals: 1, label: t("statRating") },
  ];

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
        <div className="group grid overflow-hidden rounded-[var(--radius-xl)] shadow-[0_24px_70px_-30px_rgba(0,51,102,0.45)] transition-shadow duration-500 hover:shadow-[0_30px_80px_-28px_rgba(0,51,102,0.55)] lg:grid-cols-[1.55fr_1fr]">
          {/* Left — wider HD image with heading + CTA */}
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

          {/* Right — dark stats panel */}
          <motion.div
            {...slide(48)}
            className="flex flex-col justify-center gap-7 bg-[#0a1a2f] p-7 sm:p-9 lg:p-10"
          >
            <p className="max-w-sm text-pretty text-base leading-relaxed text-white/70">
              {t("trustServing")}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {stats.map((s) => (
                <div key={s.label} className="group/stat">
                  <p className="font-display text-4xl font-bold text-white transition-transform duration-300 group-hover/stat:scale-105 sm:text-5xl">
                    <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/55">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
