import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Award,
  Heart,
  Truck,
  ShoppingBag,
  MapPin,
  FileText,
  CalendarCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { PhotoHero } from "@/components/ui/photo-hero";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  return buildMetadata({
    locale,
    path: "/about",
    title: fr
      ? "À propos — location & vente de glissades d'eau aux États-Unis"
      : "About Us — Water Slide Rentals & Sales Across the USA",
    description: fr
      ? "Spécialistes de la location et de la vente de glissades d'eau gonflables : entièrement assurés, propres et ponctuels pour des fêtes et événements inoubliables partout aux États-Unis."
      : "Family-run water slide rental and sales specialists — delivered, set up, sanitized, and fully insured in all 50 states from $199/day. Here's who we are and how we work.",
    keywords: [
      "water slide rental company",
      "inflatable rental company",
      "water slide rentals USA",
    ],
  });
}

const VALUES: { key: 1 | 2 | 3 | 4; icon: LucideIcon }[] = [
  { key: 1, icon: ShieldCheck },
  { key: 2, icon: Clock },
  { key: 3, icon: Award },
  { key: 4, icon: Heart },
];

// Real, defensible numbers only — these are all true of the business today.
const STATS: {
  key: "States" | "Fleet" | "Insured" | "Days";
  to: number;
  suffix?: string;
}[] = [
  { key: "States", to: 50 },
  { key: "Fleet", to: 55, suffix: "+" },
  { key: "Insured", to: 100, suffix: "%" },
  { key: "Days", to: 7 },
];

// Flip to true once the real team photos are uploaded — the section stays
// fully built and translated, it just doesn't render until then.
const SHOW_TEAM = false as boolean;

const TEAM: { name: string; role: string; image: string }[] = [
  {
    name: "Marcus Reed",
    role: "Founder & CEO",
    image:
      "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/team/1782624097442-0xajff-marcus.jpg",
  },
  {
    name: "Daniela Cruz",
    role: "Operations Lead",
    image:
      "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/team/1782624096502-4tq4jm-daniela.jpg",
  },
  {
    name: "Tyrone Walsh",
    role: "Head of Safety",
    image:
      "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/team/1782624098761-ae6zut-tyrone.jpg",
  },
  {
    name: "Aisha Bennett",
    role: "Customer Care",
    image:
      "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/team/1782624094683-yklqrn-aisha.jpg",
  },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("About");

  return (
    <main>
      {/* Hero — centered animated title (shared PhotoHero). */}
      <PhotoHero
        image="https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/about/1782501611506-twt9il-aquaforms-1800-island-waterpark-at-showboat-atlantic-city-usa-photo14-1536x1006.jpg"
        title={t("title")}
        description={t("intro")}
      />

      {/* Story + mission */}
      <Section spacing="compact">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal direction="right" className="space-y-4">
              <SectionHeader title={t("storyTitle")} />
              <p className="text-muted-foreground">{t("storyP1")}</p>
              <p className="text-muted-foreground">{t("storyP2")}</p>
            </Reveal>
            <Reveal direction="left" delay={0.08}>
              <Card
                variant="glass"
                className="flex h-full flex-col justify-center gap-3 p-8"
              >
                <h2 className="text-2xl font-bold">{t("missionTitle")}</h2>
                <p className="text-muted-foreground text-lg">
                  {t("missionText")}
                </p>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* What we do — rentals + sales, with real inclusions and price anchor. */}
      <Section spacing="compact" className="border-border border-t">
        <Container>
          <SectionHeader title={t("whatTitle")} align="center" />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <Card className="flex h-full flex-col gap-3 p-8">
                <span className="bg-primary-50 text-primary grid size-12 place-items-center rounded-xl">
                  <Truck className="size-6" />
                </span>
                <h3 className="text-xl font-bold">{t("whatRentTitle")}</h3>
                <p className="text-muted-foreground">{t("whatRentDesc")}</p>
                <Link
                  href="/rent"
                  className="text-primary mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold hover:underline"
                >
                  {t("whatRentCta")} <ArrowRight className="size-4" />
                </Link>
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card className="flex h-full flex-col gap-3 p-8">
                <span className="bg-primary-50 text-primary grid size-12 place-items-center rounded-xl">
                  <ShoppingBag className="size-6" />
                </span>
                <h3 className="text-xl font-bold">{t("whatBuyTitle")}</h3>
                <p className="text-muted-foreground">{t("whatBuyDesc")}</p>
                <Link
                  href="/shop"
                  className="text-primary mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold hover:underline"
                >
                  {t("whatBuyCta")} <ArrowRight className="size-4" />
                </Link>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section spacing="compact" className="border-border bg-muted/50 border-t">
        <Container>
          <SectionHeader title={t("statsTitle")} align="center" />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.05}>
                <Card className="flex flex-col items-center gap-1 p-6 text-center">
                  <span className="text-primary text-4xl font-bold sm:text-5xl">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {t(`stat${s.key}`)}
                  </span>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section spacing="compact" className="border-border border-t">
        <Container>
          <SectionHeader title={t("valuesTitle")} align="center" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.key} delay={i * 0.05}>
                  <Card className="flex h-full flex-col gap-3 p-6">
                    <span className="bg-primary-50 text-primary grid size-12 place-items-center rounded-xl">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="text-lg font-semibold">
                      {t(`value${v.key}Title`)}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t(`value${v.key}Desc`)}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* How booking works — the request-based flow, honestly explained. */}
      <Section spacing="compact" className="border-border bg-muted/50 border-t">
        <Container>
          <SectionHeader title={t("howTitle")} align="center" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(
              [
                { n: 1, icon: FileText },
                { n: 2, icon: CalendarCheck },
                { n: 3, icon: Truck },
              ] as const
            ).map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary grid size-8 place-items-center rounded-full text-sm font-bold text-white">
                      {s.n}
                    </span>
                    <s.icon className="text-primary size-5" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {t(`how${s.n}Title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`how${s.n}Desc`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Where we work — nationwide reach, Dallas HQ, link to city pages. */}
      <Section spacing="compact" className="border-border border-t">
        <Container>
          <Reveal>
            <Card
              variant="glass"
              className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <div className="flex items-start gap-4">
                <span className="bg-primary-50 text-primary grid size-12 shrink-0 place-items-center rounded-xl">
                  <MapPin className="size-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">{t("whereTitle")}</h2>
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    {t("whereText")}
                  </p>
                </div>
              </div>
              <Button asChild variant="gradient" className="shrink-0">
                <Link href="/water-slide-rentals">
                  {t("whereCta")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Card>
          </Reveal>
        </Container>
      </Section>

      {/* Team — hidden until the real team photos are uploaded (SHOW_TEAM). */}
      {SHOW_TEAM ? (
        <Section
          spacing="compact"
          className="border-border bg-muted/50 border-t"
        >
          <Container>
            <SectionHeader
              title={t("teamTitle")}
              description={t("teamDesc")}
              align="center"
            />
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
              {TEAM.map((m, i) => {
                return (
                  <Reveal key={m.name} delay={i * 0.05}>
                    <div className="group flex flex-col">
                      {/* Portrait */}
                      <div className="relative overflow-hidden rounded-2xl bg-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.image}
                          alt={m.name}
                          className="aspect-[4/5] w-full object-cover grayscale transition-all duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
                        />
                      </div>

                      {/* Role + name */}
                      <p className="text-muted-foreground mt-4 text-xs tracking-[0.16em] uppercase">
                        {m.role}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl leading-tight font-medium">
                        {m.name}
                      </h3>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA */}
      <Section spacing="compact" className="border-border border-t pb-16">
        <Container>
          <Reveal>
            <Card
              variant="glass"
              className="flex flex-col items-center gap-4 p-10 text-center"
            >
              <h2 className="text-2xl font-bold sm:text-3xl">
                {t("ctaTitle")}
              </h2>
              <Button asChild size="lg" variant="gradient">
                <Link href="/contact">{t("ctaButton")}</Link>
              </Button>
            </Card>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
