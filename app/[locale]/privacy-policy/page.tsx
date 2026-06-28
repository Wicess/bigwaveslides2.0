import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PRIVACY, pickLocale } from "@/lib/legal-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";

const PRIVACY_HERO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: PRIVACY[pickLocale(locale)].title };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const data = PRIVACY[pickLocale(locale)];

  return (
    <main>
      <PhotoHero image={PRIVACY_HERO} title={data.title} description={data.intro} />
      <Section spacing="compact" className="bg-muted/30 pb-16">
        <Container className="max-w-3xl space-y-8">
          {data.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </Container>
      </Section>
    </main>
  );
}
