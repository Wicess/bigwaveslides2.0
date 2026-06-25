import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

const CTA_BG =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/featured/serengeti.jpg";

export async function FinalCta() {
  const t = await getTranslations("Home");

  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12 sm:py-24">
            {/* HD photo + brand gradient wash */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CTA_BG}
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 -z-10 [background:linear-gradient(135deg,rgba(0,153,255,0.92)_0%,rgba(0,102,204,0.88)_45%,rgba(0,51,102,0.92)_100%)]" />
            {/* soft light blooms */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(45% 60% at 18% 12%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(50% 70% at 88% 90%, rgba(0,212,255,0.5), transparent 60%)",
              }}
            />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight drop-shadow-[0_3px_16px_rgba(0,0,0,0.35)] sm:text-5xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-white/90 sm:text-lg">
                {t("ctaDesc")}
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary shadow-xl transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <Link href="/quote">
                    {t("ctaButton")} <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="glass"
                  className="text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Link href="/rent">{t("ctaSecondary")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
