import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getApprovedTestimonials } from "@/server/data/testimonials";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { TestimonialForm } from "@/components/testimonials/testimonial-form";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "Testimonials",
  });
  // buildMetadata (not a bare object) so the page gets its self-referencing
  // canonical and the site-wide robots directives — it ships in the sitemap.
  return buildMetadata({
    locale,
    path: "/testimonials",
    // Deliberately NOT t("title")/t("desc") — those are hero copy, written to
    // be read on the page. The meta pair is written for a search result.
    title: t("metaTitle"),
    description: t("metaDesc"),
  });
}

export default async function TestimonialsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Testimonials");
  const testimonials = await getApprovedTestimonials();

  return (
    <main>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <Section spacing="compact" className="pt-8">
        <Container>
          {testimonials.length === 0 ? (
            <p className="text-muted-foreground text-center">{t("empty")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 0.05}>
                  <TestimonialCard testimonial={item} locale={locale} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="bg-muted/40 pb-16">
        <Container className="max-w-2xl">
          <SectionHeader
            eyebrow={t("leaveEyebrow")}
            title={t("leaveTitle")}
            description={t("leaveDesc")}
            align="center"
          />
          <Card className="mt-8 p-6 sm:p-8">
            <TestimonialForm />
          </Card>
        </Container>
      </Section>
    </main>
  );
}
