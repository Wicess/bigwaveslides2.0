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
import { PageHeader } from "@/components/ui/page-header";
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

const TEAM: { name: string; role: string }[] = [
  { name: "Marcus Reed", role: "Founder & CEO" },
  { name: "Daniela Cruz", role: "Operations Lead" },
  { name: "Tyrone Walsh", role: "Head of Safety" },
  { name: "Aisha Bennett", role: "Customer Care" },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("About");

  return (
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

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
            eyebrow={t("teamTitle")}
            title={t("teamTitle")}
            description={t("teamDesc")}
            align="center"
          />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} delay={i * 0.05}>
                <Card className="flex flex-col items-center gap-3 p-6 text-center">
                  <span className="grid size-20 place-items-center rounded-full bg-[image:var(--gradient-wave)] text-2xl font-bold text-white">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.role}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
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
                <Link href="/quote">{t("ctaButton")}</Link>
              </Button>
            </Card>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
