import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export async function FinalCta() {
  const t = await getTranslations("Home");

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-14 text-center text-white [background:var(--gradient-wave)] sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(40% 60% at 20% 20%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(40% 60% at 85% 80%, rgba(0,51,102,0.5), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold sm:text-5xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85">
                {t("ctaDesc")}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link href="/quote">
                    {t("ctaButton")} <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="glass"
                  className="text-white"
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
