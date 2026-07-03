import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { US_STATES } from "@/lib/locations";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

const HERO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/blog/1782479234273-ipwk85-overview-dream-space-water-park-chongqing-china-photo01-2048x1277.jpg";

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/water-slide-rentals",
    title: "Water Slide Rentals Near You — Delivered in All 50 States",
    description:
      "Rent premium inflatable water slides & bounce houses from $199/day — delivered, set up, sanitized & fully insured across all 50 U.S. states. Find water slide rentals in your city and get a free quote today.",
    keywords: [
      "water slide rentals",
      "water slide rental near me",
      "inflatable water slide rental USA",
      "bounce house and water slide rentals",
      "party water slide rental near me",
      "backyard water slide rental",
    ],
  });
}

export default async function LocationsHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <main>
      <PhotoHero
        image={HERO}
        title="Water Slide Rentals, Delivered Nationwide"
        description="From coast to coast — find premium, fully-insured inflatable water slide rentals in your state. Delivered, set up, and picked up by our team."
      />

      <Section spacing="compact" className="pt-10">
        <Container className="max-w-[84rem]">
          <Reveal className="max-w-3xl">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Big Wave Slides delivers across all 50 states. Pick your state to
              see local water slide rentals, delivery details, and answers to
              the questions renters ask most.
            </p>
          </Reveal>

          <div className="mt-10 space-y-10">
            {REGIONS.map((region) => (
              <Reveal key={region} className="space-y-4">
                <h2 className="text-primary flex items-center gap-3 text-sm font-semibold tracking-[0.18em] uppercase">
                  <span className="bg-primary/40 h-px w-8" />
                  {region}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {US_STATES.filter((s) => s.region === region).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/water-slide-rentals/${s.slug}`}
                      className="border-border bg-background hover:border-primary/40 hover:text-primary rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
