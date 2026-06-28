import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { routing } from "@/i18n/routing";
import { FAQS, pickLocale } from "@/lib/legal-content";
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
  return { title: FAQS[pickLocale(locale)].title };
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
                <details className="group rounded-[var(--radius-lg)] border border-border bg-background">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold">
                    {item.q}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-muted-foreground">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </main>
  );
}
