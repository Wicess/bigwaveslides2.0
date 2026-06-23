"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CalendarCheck, Send, Truck } from "lucide-react";
import { gsap } from "@/components/motion/gsap";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";

export function HowItWorks() {
  const t = useTranslations("Home");
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const steps = [
    { icon: CalendarCheck, title: t("step1Title"), desc: t("step1Desc") },
    { icon: Send, title: t("step2Title"), desc: t("step2Desc") },
    { icon: Truck, title: t("step3Title"), desc: t("step3Desc") },
  ];

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 55%",
              end: "bottom 75%",
              scrub: true,
            },
          },
        );
      }
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow={t("howEyebrow")}
          title={t("howTitle")}
          description={t("howDesc")}
          align="center"
          className="mx-auto items-center text-center"
        />

        <div className="relative mx-auto mt-12 max-w-2xl">
          {/* progress line */}
          <div className="absolute left-[27px] top-4 hidden h-[calc(100%-2rem)] w-0.5 bg-border sm:block">
            <div
              ref={lineRef}
              className="h-full w-full origin-top [background:var(--gradient-wave)]"
            />
          </div>

          <ol className="space-y-8">
            {steps.map((step, i) => (
              <li key={i} data-step className="flex gap-5">
                <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]">
                  <step.icon className="size-6" />
                </span>
                <div className="pt-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
