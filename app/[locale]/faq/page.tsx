import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChevronDown, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { FAQS, pickLocale } from "@/lib/legal-content";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { faqLd } from "@/lib/structured-data";

const FAQ_HERO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/blog/1782484385557-8bhjem-turnstiles-island-h2o-live-kissimmee-usa-1.jpg";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  const data = FAQS[pickLocale(locale)];
  return buildMetadata({
    locale,
    path: "/faq",
    title: fr
      ? "Questions fréquentes — location de glissades d'eau gonflables"
      : "Water Slide Rental FAQ — Delivery, Setup, Pricing & Booking",
    description: data.intro,
    keywords: fr
      ? [
          "faq location glissade d'eau",
          "questions location glissade gonflable",
          "prix location glissade d'eau",
          "livraison installation glissade d'eau",
        ]
      : [
          "water slide rental FAQ",
          "inflatable water slide questions",
          "water slide rental cost",
          "water slide delivery and setup",
          "how to book a water slide rental",
        ],
  });
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const data = FAQS[pickLocale(locale)];

  return (
    <main>
      <JsonLd data={faqLd(data.items.map((i) => ({ q: i.q, a: i.a })))} />
      <PhotoHero image={FAQ_HERO} title={data.title} description={data.intro} />
      <Section spacing="compact" className="bg-muted/30 pb-16">
        <Container className="max-w-3xl">
          <ul className="space-y-3">
            {data.items.map((item) => (
              <li key={item.q}>
                <details className="group border-border bg-background rounded-[var(--radius-lg)] border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold">
                    {item.q}
                    <ChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-muted-foreground px-5 pb-5">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>

          {locale !== "fr" ? (
            <Link
              href="/answers"
              className="border-border bg-background hover:border-primary/40 hover:text-primary mt-6 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border p-5 font-semibold transition-colors"
            >
              More questions answered — cost, space, setup, safety & weather
              <ArrowRight className="text-primary size-5 shrink-0" />
            </Link>
          ) : null}
        </Container>
      </Section>
    </main>
  );
}
