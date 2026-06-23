"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useInView } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";

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

  const stats = [
    { to: 5000, suffix: "+", decimals: 0, label: t("statEvents") },
    { to: 40, suffix: "+", decimals: 0, label: t("statSlides") },
    { to: 12, suffix: "", decimals: 0, label: t("statYears") },
    { to: 4.9, suffix: "★", decimals: 1, label: t("statRating") },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="overflow-hidden rounded-[var(--radius-xl)] px-6 py-12 text-white [background:var(--gradient-deep)] sm:px-12">
          <SectionHeader
            eyebrow={<span className="text-secondary">{t("whyEyebrow")}</span>}
            title={<span className="text-white">{t("whyTitle")}</span>}
            align="center"
            className="mx-auto items-center text-center"
          />
          <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl font-bold sm:text-5xl">
                  <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} />
                </p>
                <p className="mt-2 text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
