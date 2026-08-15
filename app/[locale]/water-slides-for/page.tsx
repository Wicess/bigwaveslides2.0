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

// Split once at module scope rather than per render.
const SEASONAL = USE_CASES.filter((u) => u.season);
const YEAR_ROUND = USE_CASES.filter((u) => !u.season);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/water-slides-for",
    title:
      "Inflatable Rentals for Every Occasion — Fall Festivals to Birthdays",
    og: {
      eyebrow: "By occasion",
      subtitle: "Fall festivals, trunk-or-treats, schools, churches, birthdays",
      badge: "Free quote",
      price: "From $155/day",
    },
    description:
      "Fall festivals, trunk-or-treats, school carnivals, Halloween parties, birthdays and corporate family days — find the right inflatable rental for your event. October dates book 3–4 weeks ahead.",
    keywords: [
      "fall festival inflatable rentals",
      "trunk or treat inflatable rentals",
      "school carnival inflatable rentals",
      "halloween inflatable rentals",
      "water slide rental for events",
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
        title="An Inflatable for Every Occasion"
        description="Fall festivals, trunk-or-treats and school carnivals through to backyard birthdays — we deliver, set up, and pick up. Pick your occasion to see how it works and get a free quote."
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              From fall festivals and trunk-or-treats to backyard birthdays and
              company picnics, Splash Republic has a fully-insured inflatable
              sized for your event — delivered and set up anywhere in the
              country. Every slide runs wet in summer and dry in cooler months,
              so the same unit works in October as in July.
            </p>
          </Reveal>

          {/* Seasonal group first. October is the busiest month of the year for
              inflatable rentals and those dates are booked 3–4 weeks out, so a
              visitor landing here in autumn should meet the fall pages before
              the year-round ones. */}
          {(
            [
              ["Fall & Halloween events", SEASONAL],
              ["Year-round occasions", YEAR_ROUND],
            ] as const
          )
            .filter(([, list]) => list.length > 0)
            .map(([heading, list]) => (
              <div key={heading} className="mt-10">
                <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {heading}
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((u, i) => (
                    <Reveal key={u.slug} delay={(i % 3) * 0.05}>
                      <Link
                        href={`/water-slides-for/${u.slug}`}
                        className="group border-border bg-background hover:border-primary/40 flex h-full flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                      >
                        {u.season ? (
                          <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                            {u.season.label}
                          </span>
                        ) : null}
                        <h3 className="font-display group-hover:text-primary text-lg font-semibold transition-colors">
                          {u.name}
                        </h3>
                        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                          {u.heroDescription}
                        </p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
        </Container>
      </Section>
    </main>
  );
}
