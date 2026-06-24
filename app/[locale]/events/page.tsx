import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getEvents } from "@/server/data/events";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { PageHeader } from "@/components/ui/page-header";
import { EventCard } from "@/components/events/event-card";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

// ISR: surface admin content edits on the live site within this window.
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Events" });
  return { title: t("title"), description: t("desc") };
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Events");
  const { upcoming, past } = await getEvents();

  return (
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      <Section spacing="compact" className="pt-8">
        <Container>
          <SectionHeader title={t("upcomingTitle")} />
          {upcoming.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border p-12 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />
              <p className="font-semibold">{t("noUpcomingTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t("noUpcomingDesc")}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.05}>
                  <EventCard event={event} locale={locale} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {past.length > 0 ? (
        <Section className="bg-muted/40">
          <Container>
            <SectionHeader title={t("pastTitle")} description={t("pastDesc")} />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.05}>
                  <EventCard event={event} locale={locale} past />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
