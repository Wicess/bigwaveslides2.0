import { getTranslations } from "next-intl/server";
import { ArrowRight, ShoppingBag } from "lucide-react";
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
    <section className="relative -mt-[6.75rem] flex min-h-svh w-full items-center justify-center overflow-hidden bg-ink sm:-mt-[7.25rem]">
      <HeroCarousel slides={SLIDES} />

      <Container className="relative z-10 flex flex-col items-center pt-[6.75rem] text-center sm:pt-[7.25rem]">
        {/* Designed, colorful brand wordmark */}
        <h1 className="font-display text-6xl font-extrabold leading-[0.92] tracking-[-0.035em] sm:text-7xl lg:text-[8rem]">
          <KineticText
            text="Big Wave"
            as="span"
            className="block bg-[linear-gradient(110deg,#7fe9ff_0%,#00d4ff_35%,#0099ff_70%,#0066ff_100%)] bg-clip-text text-transparent drop-shadow-[0_6px_40px_rgba(0,153,255,0.45)]"
          />
          <KineticText
            text="Slides"
            as="span"
            className="mt-1 block text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          />
        </h1>

        <Reveal y={16} delay={0.15}>
          <p className="mx-auto mt-7 max-w-xl text-lg text-white/85 sm:text-xl">
            {t("subtitle")}
          </p>
        </Reveal>

        <Reveal y={16} delay={0.25}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href="/rent">
                {t("ctaRentNow")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20"
            >
              <Link href="/shop">
                <ShoppingBag className="size-4" /> {t("ctaBuyNow")}
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal y={16} delay={0.35}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Stars rating={rating} />
            <span className="text-sm text-white/80">
              <span className="font-semibold text-white">{rating.toFixed(1)}</span> ·{" "}
              {t("trustReviews", { count: reviewCount })}
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
