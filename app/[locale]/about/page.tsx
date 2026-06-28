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
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "About" });
  return { title: t("title"), description: t("intro") };
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
      {/* Hero — same treatment as the blog article page: a cover photo running
          up behind the nav with a dark scrim so the white heading stays legible. */}
      <header className="relative -mt-[108px] overflow-hidden border-b border-border bg-neutral-900 sm:-mt-[116px]">
        <img
          src="https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/about/1782501611506-twt9il-aquaforms-1800-island-waterpark-at-showboat-atlantic-city-usa-photo14-1536x1006.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/55 to-neutral-950/45"
        />
        <Container className="relative z-10 max-w-[84rem] pb-12 pt-[122px] sm:pb-14 sm:pt-[146px]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-400">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-4xl text-balance font-display text-[2rem] font-bold leading-[1.07] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{t("intro")}</p>
        </Container>
      </header>

      {/* Story + mission */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal className="space-y-4">
              <SectionHeader title={t("storyTitle")} />
              <p className="text-muted-foreground">{t("storyP1")}</p>
              <p className="text-muted-foreground">{t("storyP2")}</p>
            </Reveal>
            <Reveal delay={0.08}>
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
      <Section spacing="compact" className="bg-muted/40">
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
      <Section>
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
      <Section spacing="compact" className="bg-muted/40">
        <Container>
          <SectionHeader
            eyebrow={t("teamEyebrow")}
            title={t("teamTitle")}
            description={t("teamDesc")}
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {TEAM.map((m, i) => {
              const first = m.name.split(" ")[0] ?? m.name;
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

                    {/* Talk-with pill */}
                    <Link
                      href="/contact"
                      className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-neutral-900 py-2 pl-2 pr-4 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image}
                        alt=""
                        className="size-6 rounded-full object-cover"
                      />
                      {t("talkWith", { name: first })}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="compact" className="pb-16">
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
