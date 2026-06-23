import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";
import { WaveScene } from "@/components/three/wave-scene";
import { DateWidget } from "./date-widget";

export async function Hero({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const t = await getTranslations("Home");

  return (
    <section className="relative overflow-hidden pb-12 pt-28 sm:pt-32 lg:pb-16 lg:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 75% 15%, rgba(0,212,255,0.20), transparent 70%), radial-gradient(50% 50% at 10% 80%, rgba(0,153,255,0.16), transparent 70%)",
        }}
      />
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Reveal y={16}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {t("eyebrow")}
            </p>
          </Reveal>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
            <KineticText text={t("tagline")} as="span" className="block text-gradient" />
          </h1>
          <Reveal y={16} delay={0.15}>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              {t("subtitle")}
            </p>
          </Reveal>
          <Reveal y={16} delay={0.25}>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="gradient" size="lg">
                <Link href="/rent">
                  {t("ctaRent")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/shop">{t("ctaShop")}</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal y={16} delay={0.35}>
            <div className="mt-6 flex items-center gap-3">
              <Stars rating={rating} />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {rating.toFixed(1)}
                </span>{" "}
                · {t("trustReviews", { count: reviewCount })}
              </span>
            </div>
          </Reveal>
          <Reveal y={16} delay={0.45}>
            <div className="mt-8">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("heroDateLabel")}
              </p>
              <DateWidget label={t("heroDateLabel")} cta={t("heroDateCta")} />
            </div>
          </Reveal>
        </div>

        <div className="relative">
          <WaveScene className="mx-auto aspect-square w-full max-w-lg rounded-[var(--radius-xl)]" />
        </div>
      </Container>
    </section>
  );
}
