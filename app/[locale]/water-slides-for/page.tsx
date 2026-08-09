import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { USE_CASES } from "@/lib/use-cases";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

const HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/water-slides-for",
    title: "Water Slide Rentals for Every Occasion",
    description:
      "Birthday parties, pool parties, school field days, church festivals, corporate events and more — find the perfect water slide rental for your occasion. Nationwide delivery.",
    keywords: [
      "water slide rental for events",
      "water slide rental occasions",
      "party water slide rental",
    ],
  });
}

export default async function UseCasesHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <main>
      <PhotoHero
        image={HERO}
        title="A Water Slide for Every Occasion"
        description="Whatever you're celebrating, we deliver, set up, and pick up the perfect water slide. Pick your occasion to see how it works and get a free quote."
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              From backyard birthdays to school field days and company picnics,
              Big Wave Slides has a fully-insured water slide sized for your
              event — delivered and set up anywhere in the country.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.slug} delay={(i % 3) * 0.05}>
                <Link
                  href={`/water-slides-for/${u.slug}`}
                  className="group border-border bg-background hover:border-primary/40 flex h-full flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  <h2 className="font-display group-hover:text-primary text-lg font-semibold transition-colors">
                    {u.name}
                  </h2>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    {u.heroDescription}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
