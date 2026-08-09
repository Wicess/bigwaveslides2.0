import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TERMS, pickLocale } from "@/lib/legal-content";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";

const TERMS_HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782484404870-axgpl1-aquasplash-water-world-at-shanghai-lsnow-indoor-skiing-theme-resort-shanghai-china-photo28-1-2048x1534.jpg";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: TERMS[pickLocale(locale)].title };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const data = TERMS[pickLocale(locale)];

  return (
    <main>
      <PhotoHero
        image={TERMS_HERO}
        title={data.title}
        description={data.intro}
      />
      <Section spacing="compact" className="bg-muted/30 pb-16">
        <Container className="max-w-3xl space-y-8">
          {data.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold">{s.heading}</h2>
              <p className="text-muted-foreground mt-2">{s.body}</p>
            </section>
          ))}
        </Container>
      </Section>
    </main>
  );
}
