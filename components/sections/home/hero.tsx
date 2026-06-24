import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";
import { HeroCarousel, type HeroSlide } from "@/components/sections/home/hero-carousel";

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/hero";

const SLIDES: HeroSlide[] = [
  { type: "video", src: `${R2}/hero.mp4`, poster: `${R2}/slide-1.jpg` },
  { type: "image", src: `${R2}/slide-1.jpg`, alt: "Aerial view of a vibrant water park" },
  { type: "image", src: `${R2}/slide-2.jpg`, alt: "Family water-play structure with slides" },
];

export async function Hero({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const t = await getTranslations("Home");

  return (
    <section className="relative flex min-h-[calc(100svh-7rem)] w-full items-center overflow-hidden bg-ink">
      <HeroCarousel slides={SLIDES} />

      <Container className="relative z-10 py-20">
        <div className="max-w-2xl">
          <Reveal y={16}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
              {t("eyebrow")}
            </p>
          </Reveal>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-7xl">
            <KineticText text={t("tagline")} as="span" className="block" />
          </h1>
          <Reveal y={16} delay={0.15}>
            <p className="mt-5 max-w-lg text-lg text-white/85">
              {t("subtitle")}
            </p>
          </Reveal>
          <Reveal y={16} delay={0.25}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link href="/rent">
                  {t("ctaRent")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20"
              >
                <Link href="/shop">{t("ctaShop")}</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal y={16} delay={0.35}>
            <div className="mt-7 flex items-center gap-3">
              <Stars rating={rating} />
              <span className="text-sm text-white/80">
                <span className="font-semibold text-white">{rating.toFixed(1)}</span> ·{" "}
                {t("trustReviews", { count: reviewCount })}
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
