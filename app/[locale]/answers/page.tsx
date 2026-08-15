import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { QA_CATEGORIES, allQA } from "@/lib/qa";
import { buildMetadata } from "@/lib/seo";
import { faqLd, breadcrumbLd, absoluteUrl } from "@/lib/structured-data";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { PhotoHero } from "@/components/ui/photo-hero";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ locale: string }> };

const HERO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/answers",
    title: "Water Slide Rental Questions Answered — Cost, Space & Power",
    description:
      "Straight answers on water slide rental cost, space, water and power needs, safety, weather and booking. Nationwide US delivery from $199/day.",
    og: {
      eyebrow: "Answers",
      subtitle: "Cost, space, water, power, safety, weather and booking",
      badge: "25 answers",
      price: "From $199/day",
    },
    keywords: [
      "water slide rental questions",
      "how much does a water slide rental cost",
      "how much space for a water slide",
      "do water slides need electricity",
      "are inflatable water slides safe",
      "how to book a water slide rental",
      "water slide rental requirements",
    ],
  });
}

export default async function AnswersPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <main>
      <JsonLd data={faqLd(allQA())} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Answers", url: absoluteUrl(locale, "/answers") },
        ])}
      />

      <PhotoHero
        image={HERO}
        title="Water Slide Rental Questions & Answers"
        description="Clear, straight answers to the questions renters ask most — cost, space and setup, safety, weather, and booking. Splash Republic delivers nationwide from $199/day, fully insured."
      />

      <Section spacing="compact" className="pt-10 pb-16">
        <Container className="max-w-3xl">
          <Reveal>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Everything you need to know before you rent an inflatable water
              slide or bounce house — with real numbers on pricing, space, and
              requirements. Still have a question? Get a free, no-obligation
              quote and we'll answer it directly.
            </p>
          </Reveal>

          <div className="mt-12 space-y-12">
            {QA_CATEGORIES.map((cat) => (
              <section
                key={cat.slug}
                id={cat.slug}
                aria-labelledby={`${cat.slug}-heading`}
              >
                <Reveal>
                  <h2
                    id={`${cat.slug}-heading`}
                    className="text-primary flex items-center gap-3 text-sm font-semibold tracking-[0.18em] uppercase"
                  >
                    <span className="bg-primary/40 h-px w-8" />
                    {cat.title}
                  </h2>
                </Reveal>

                <div className="mt-6 space-y-8">
                  {cat.items.map((item) => (
                    <Reveal key={item.q} className="scroll-mt-24">
                      <h3 className="font-display text-xl font-semibold">
                        {item.q}
                      </h3>
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        {item.a}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <Reveal className="mt-14">
            <div className="overflow-hidden rounded-3xl px-6 py-12 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Still have a question?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/75">
                Tell us your date, venue, and city and we'll send a free,
                no-obligation quote with delivery, setup, and insurance
                included.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link href="/contact">Request a free quote</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/rent">Browse water slides</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
