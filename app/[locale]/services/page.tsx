import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  PartyPopper,
  Wrench,
  Sparkles,
  LifeBuoy,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getAllServices } from "@/server/data/services";
import { getLocalized } from "@/lib/localized";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string }> };

type ServiceCategory = "EVENT" | "INSTALL" | "MAINTENANCE" | "SUPPORT";

const ICONS: Record<ServiceCategory, LucideIcon> = {
  EVENT: PartyPopper,
  INSTALL: Wrench,
  MAINTENANCE: Sparkles,
  SUPPORT: LifeBuoy,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "ServicesPage" });
  return { title: t("title"), description: t("desc") };
}

function ServiceCard({
  slug,
  title,
  summary,
  category,
  cta,
}: {
  slug: string;
  title: string;
  summary: string;
  category: ServiceCategory;
  cta: string;
}) {
  const Icon = ICONS[category] ?? PartyPopper;
  return (
    <Link
      href={`/services/${slug}`}
      className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
    >
      <span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");
  const tDetail = await getTranslations("ServiceDetail");
  const services = await getAllServices().catch(() => []);

  const events = services.filter((s) => s.category === "EVENT");
  const support = services.filter((s) => s.category !== "EVENT");

  const groups = [
    { key: "events", label: t("eventsGroup"), items: events },
    { key: "support", label: t("supportGroup"), items: support },
  ].filter((g) => g.items.length > 0);

  return (
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />

      {groups.map((group) => (
        <Section key={group.key}>
          <Container>
            <SectionHeader title={group.label} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((s, i) => (
                <Reveal key={s.slug} delay={i * 0.05}>
                  <ServiceCard
                    slug={s.slug}
                    title={getLocalized(s.title, locale)}
                    summary={getLocalized(s.summary, locale)}
                    category={s.category as ServiceCategory}
                    cta={tDetail("getQuote")}
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ))}

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
