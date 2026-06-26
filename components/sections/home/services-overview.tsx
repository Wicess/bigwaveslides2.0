import { getTranslations } from "next-intl/server";
import {
  PartyPopper,
  Wrench,
  Sparkles,
  LifeBuoy,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";

type Service = {
  slug: string;
  title: unknown;
  summary: unknown;
  category: "EVENT" | "INSTALL" | "MAINTENANCE" | "SUPPORT";
};

const ICONS: Record<Service["category"], LucideIcon> = {
  EVENT: PartyPopper,
  INSTALL: Wrench,
  MAINTENANCE: Sparkles,
  SUPPORT: LifeBuoy,
};

export async function ServicesOverview({
  services,
  locale,
}: {
  services: Service[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (services.length === 0) return null;

  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow={t("servicesEyebrow")}
          title={t("servicesTitle")}
          description={t("servicesDesc")}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = ICONS[s.category] ?? PartyPopper;
            return (
              <Reveal key={s.slug} delay={i * 0.05}>
                <Link
                  href={`/services#${s.slug}`}
                  className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-primary-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">
                    {getLocalized(s.title, locale)}
                  </h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {getLocalized(s.summary, locale)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t("ctaSecondary")}{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
