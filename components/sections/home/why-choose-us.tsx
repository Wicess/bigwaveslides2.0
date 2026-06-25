"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";

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

  const stats = [
    { to: 5000, suffix: "+", decimals: 0, label: t("statEvents") },
    { to: 40, suffix: "+", decimals: 0, label: t("statSlides") },
    { to: 12, suffix: "", decimals: 0, label: t("statYears") },
    { to: 4.9, suffix: "★", decimals: 1, label: t("statRating") },
  ];

  return (
    <section className="bg-gradient-to-b from-white via-primary-50/50 to-white py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="grid overflow-hidden rounded-[var(--radius-xl)] shadow-[0_24px_70px_-30px_rgba(0,51,102,0.45)] lg:grid-cols-2">
          {/* Left — HD image with heading + CTA */}
          <div className="relative flex min-h-[24rem] flex-col justify-end p-8 text-white sm:p-10 lg:min-h-[32rem]">
            <MediaImage
              src={WHY_IMAGE}
              alt={t("whyTitle")}
              rounded={false}
              className="absolute inset-0 size-full"
              imgClassName="object-cover"
              sizes="(min-width:1024px) 50vw, 100vw"
            />
            {/* scrim for legible copy */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary-400">
                {t("whyEyebrow")}
              </p>
              <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-[1.1] tracking-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)] sm:text-4xl">
                {t("whyTitle")}
              </h2>
              <Button
                asChild
                size="lg"
                className="mt-7 bg-white text-accent hover:bg-white/90"
              >
                <Link href="/rent">
                  {t("ctaRentNow")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — dark stats panel */}
          <div className="flex flex-col justify-center gap-8 bg-[#0a1a2f] p-8 sm:p-10 lg:p-12">
            <p className="max-w-sm text-pretty text-base leading-relaxed text-white/70">
              {t("trustServing")}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                    <Counter to={s.to} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/55">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
