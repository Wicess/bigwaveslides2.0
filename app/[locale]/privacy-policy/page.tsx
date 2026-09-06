import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PRIVACY } from "@/lib/legal-content";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";

const PRIVACY_HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = PRIVACY;
  // buildMetadata (not a bare object) so the page gets its self-referencing
  // canonical and the site-wide robots directives — it ships in the sitemap.
  return buildMetadata({
    locale,
    path: "/privacy-policy",
    title: data.metaTitle,
    // data.intro is visible page copy, so it is not shortened — the snippet
    // takes its first sentence when the whole thing overruns what Google
    // renders. Same reasoning as the use-case hero descriptions.
    description: data.metaDescription,
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const data = PRIVACY;

  return (
    <main>
      <PhotoHero
        image={PRIVACY_HERO}
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
