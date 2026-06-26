import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  PartyPopper,
  Building2,
  GraduationCap,
  ShoppingBag,
  HardHat,
  Truck,
  Wrench,
  ShieldCheck,
  Check,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getLocalized } from "@/lib/localized";
import {
  SERVICE_GROUPS,
  ALL_SERVICES,
  SERVICES_HERO_IMAGE,
  type ServiceItem,
  type ServiceCtaKind,
} from "@/lib/services-content";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

const ICONS: Record<ServiceItem["icon"], LucideIcon> = {
  party: PartyPopper,
  building: Building2,
  school: GraduationCap,
  shop: ShoppingBag,
  build: HardHat,
  truck: Truck,
  wrench: Wrench,
  shield: ShieldCheck,
};

const CTA_HREF: Record<ServiceCtaKind, string> = {
  quote: "/contact",
  shop: "/shop",
  rent: "/rent",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "ServicesPage" });
  return { title: t("title"), description: t("desc") };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");

  return (
    <main>
      {/* Hero — same cover-photo treatment as the article/about pages. */}
      <header className="relative -mt-[108px] overflow-hidden border-b border-border bg-neutral-900 sm:-mt-[116px]">
        <img
          src={SERVICES_HERO_IMAGE}
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
          <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{t("desc")}</p>

          {/* Quick-jump pills to each service. */}
          <div className="mt-7 flex flex-wrap gap-2">
            {ALL_SERVICES.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {getLocalized(s.title, locale)}
              </a>
            ))}
          </div>
        </Container>
      </header>

      {/* Service groups → alternating image/text rows. */}
      {SERVICE_GROUPS.map((group, gi) => (
        <Section
          key={group.key}
          spacing="default"
          className={cn(gi % 2 === 1 && "bg-muted/40")}
        >
          <Container className="max-w-[84rem]">
            <h2 className="mb-10 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-primary/40" />
              {getLocalized(group.label, locale)}
            </h2>

            <div className="space-y-16 lg:space-y-24">
              {group.items.map((s, i) => {
                const Icon = ICONS[s.icon];
                const title = getLocalized(s.title, locale);
                const paragraphs = getLocalized(s.body, locale).split(/\n{2,}/);
                const flip = i % 2 === 1;
                return (
                  <Reveal key={s.slug}>
                    <section
                      id={s.slug}
                      className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2 lg:gap-14"
                    >
                      {/* Image */}
                      <div className={cn("relative", flip && "lg:order-2")}>
                        <MediaImage
                          src={s.image}
                          alt={title}
                          className="aspect-[4/3] w-full shadow-[var(--shadow-soft)]"
                          sizes="(min-width:1024px) 42vw, 100vw"
                        />
                        <span className="absolute left-4 top-4 grid size-11 place-items-center rounded-xl bg-white/95 text-primary shadow-md backdrop-blur">
                          <Icon className="size-6" />
                        </span>
                      </div>

                      {/* Copy */}
                      <div className={cn(flip && "lg:order-1")}>
                        <h3 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                          {title}
                        </h3>
                        <p className="mt-3 text-lg font-medium text-primary">
                          {getLocalized(s.tagline, locale)}
                        </p>
                        <div className="mt-4 space-y-3 text-[1.025rem] leading-relaxed text-muted-foreground">
                          {paragraphs.map((p, pi) => (
                            <p key={pi}>{p}</p>
                          ))}
                        </div>

                        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("highlights")}
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {s.highlights.map((h, hi) => (
                            <li key={hi} className="flex items-start gap-2 text-sm">
                              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                              <span>{getLocalized(h, locale)}</span>
                            </li>
                          ))}
                        </ul>

                        <Button asChild size="lg" variant="gradient" className="mt-7">
                          <Link href={CTA_HREF[s.cta.kind]}>
                            {getLocalized(s.cta.label, locale)}
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </section>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </Section>
      ))}

      {/* Closing CTA */}
      <Section spacing="compact" className="pb-16">
        <Container className="max-w-[84rem]">
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
