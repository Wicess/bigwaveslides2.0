"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { Stars } from "@/components/ui/stars";

type Testimonial = {
  id: string;
  authorName: string;
  authorRole: string | null;
  organization: string | null;
  rating: number;
  quote: unknown;
};

export function TestimonialsCarousel({
  testimonials,
  locale,
}: {
  testimonials: Testimonial[];
  locale: string;
}) {
  const t = useTranslations("Home");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: dir * (scrollerRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-muted/40 py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow={t("testimonialsEyebrow")}
            title={t("testimonialsTitle")}
          />
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="grid size-11 place-items-center rounded-full border border-border bg-background transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="grid size-11 place-items-center rounded-full border border-border bg-background transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="flex w-[85%] shrink-0 snap-start flex-col rounded-[var(--radius-lg)] border border-border bg-background p-6 sm:w-[45%] lg:w-[31%]"
            >
              <Quote className="size-8 text-primary/30" />
              <blockquote className="mt-3 flex-1 text-pretty text-foreground/90">
                “{getLocalized(item.quote, locale)}”
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[item.authorRole, item.organization]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Stars rating={item.rating} size="size-3.5" />
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
