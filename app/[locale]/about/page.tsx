import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Award,
  Heart,
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
      : "Family-run water slide rental and sales specialists — fully insured, spotless, and on time for unforgettable parties and events nationwide. Meet the team behind the splash.",
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

const STATS: { key: "Events" | "Slides" | "Years" | "Cities"; to: number; suffix?: string }[] = [
  { key: "Events", to: 5000, suffix: "+" },
  { key: "Slides", to: 120, suffix: "+" },
  { key: "Years", to: 12, suffix: "+" },
  { key: "Cities", to: 40, suffix: "+" },
];

const TEAM: { name: string; role: string; image: string }[] = [
  {
    name: "Marcus Reed",
    role: "Founder & CEO",
    image: "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/team/1782624097442-0xajff-marcus.jpg",
  },
  {
    name: "Daniela Cruz",
    role: "Operations Lead",
    image: "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/team/1782624096502-4tq4jm-daniela.jpg",
  },
  {
    name: "Tyrone Walsh",
    role: "Head of Safety",
    image: "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/team/1782624098761-ae6zut-tyrone.jpg",
  },
  {
    name: "Aisha Bennett",
    role: "Customer Care",
    image: "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/team/1782624094683-yklqrn-aisha.jpg",
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
        image="https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/about/1782501611506-twt9il-aquaforms-1800-island-waterpark-at-showboat-atlantic-city-usa-photo14-1536x1006.jpg"
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
                <p className="text-lg text-muted-foreground">{t("missionText")}</p>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section spacing="compact" className="border-t border-border bg-muted/50">
        <Container>
          <SectionHeader title={t("statsTitle")} align="center" />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.05}>
                <Card className="flex flex-col items-center gap-1 p-6 text-center">
                  <span className="text-4xl font-bold text-primary sm:text-5xl">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t(`stat${s.key}`)}
                  </span>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section spacing="compact" className="border-t border-border">
        <Container>
          <SectionHeader title={t("valuesTitle")} align="center" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.key} delay={i * 0.05}>
                  <Card className="flex h-full flex-col gap-3 p-6">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="text-lg font-semibold">{t(`value${v.key}Title`)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`value${v.key}Desc`)}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section spacing="compact" className="border-t border-border bg-muted/50">
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
                        className="aspect-[4/5] w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Role + name */}
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {m.role}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-medium leading-tight">
                      {m.name}
                    </h3>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="compact" className="border-t border-border pb-16">
        <Container>
          <Reveal>
            <Card
              variant="glass"
              className="flex flex-col items-center gap-4 p-10 text-center"
            >
              <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
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
