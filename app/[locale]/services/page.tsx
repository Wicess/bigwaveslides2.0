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
import { routing } from "@/i18n/routing";
import { getLocalized } from "@/lib/localized";
import { buildMetadata } from "@/lib/seo";
import { optimizedSrc } from "@/lib/image-loader";
import {
  ALL_SERVICES,
  SERVICES_HERO_IMAGE,
  type ServiceItem,
  type ServiceCtaKind,
} from "@/lib/services-content";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { Button } from "@/components/ui/button";
import { HoverVideo } from "@/components/services/hover-video";
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
  return buildMetadata({
    locale,
    path: "/services",
    title: "Water Slide Installation, Delivery & Setup Services",
    description:
      "Professional water slide delivery, setup, cleaning and custom builds for parties, events and water parks nationwide. Get a free service quote.",
    keywords: [
      "water slide installation",
      "professional water slide installation",
      "water slide delivery",
      "water slide setup",
      "commercial water slide installation",
      "water slide cleaning service",
    ],
  });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");

  return (
    <main>
      {/* Hero — centered animated title (shared PhotoHero). */}
      <PhotoHero
        image={SERVICES_HERO_IMAGE}
        title={t("title")}
        description={t("desc")}
        compact
      >
        {/* Quick-jump pills to each service — compact so the hero stays short. */}
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:mt-5 sm:gap-2">
          {ALL_SERVICES.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-3.5 sm:py-1.5 sm:text-xs"
            >
              {getLocalized(s.title, locale)}
            </a>
          ))}
        </div>
      </PhotoHero>

      {/* Services → continuous alternating bands (no gaps between sections);
          hover an image to play its clip. */}
      {ALL_SERVICES.map((s, i) => {
        const Icon = ICONS[s.icon];
        const title = getLocalized(s.title, locale);
        const paragraphs = getLocalized(s.body, locale).split(/\n{2,}/);
        const flip = i % 2 === 1;
        return (
          <section
            key={s.slug}
            id={s.slug}
            className={cn(
              "scroll-mt-28 overflow-x-clip py-12 sm:py-14",
              i % 2 === 1 && "bg-muted/40",
            )}
          >
            <Container className="max-w-[84rem]">
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                {/* Media — slides in from its outer edge; hover plays the clip */}
                <Reveal
                  direction={flip ? "left" : "right"}
                  className={cn("relative", flip && "lg:order-2")}
                >
                  <HoverVideo
                    image={s.image}
                    video={s.video}
                    alt={title}
                    className="aspect-[4/3] w-full shadow-[var(--shadow-soft)]"
                    sizes="(min-width:1024px) 42vw, 100vw"
                  />
                  <span className="text-primary pointer-events-none absolute top-4 left-4 z-10 grid size-11 place-items-center rounded-xl bg-white/95 shadow-md backdrop-blur">
                    <Icon className="size-6" />
                  </span>
                </Reveal>

                {/* Copy — slides in from the opposite side */}
                <Reveal
                  direction={flip ? "right" : "left"}
                  delay={0.1}
                  className={cn(flip && "lg:order-1")}
                >
                  <h2 className="font-display text-foreground text-[1.7rem] leading-[1.1] font-bold tracking-tight sm:text-4xl">
                    {title}
                  </h2>
                  <span
                    aria-hidden
                    className="mt-3 block h-1 w-12 rounded-full bg-[linear-gradient(90deg,#0099ff,#00d4ff)]"
                  />
                  <p className="text-foreground/70 mt-4 text-lg leading-relaxed font-medium">
                    {getLocalized(s.tagline, locale)}
                  </p>
                  <div className="text-muted-foreground mt-4 space-y-3 text-[1.025rem] leading-relaxed">
                    {paragraphs.map((p, pi) => (
                      <p key={pi}>{p}</p>
                    ))}
                  </div>

                  <p className="text-muted-foreground mt-6 text-xs font-semibold tracking-wide uppercase">
                    {t("highlights")}
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {s.highlights.map((h, hi) => (
                      <li key={hi} className="flex items-start gap-2 text-sm">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" />
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
                </Reveal>
              </div>
            </Container>
          </section>
        );
      })}

      {/* Closing CTA — photo background with scrim */}
      <Section
        spacing="compact"
        className="border-foreground/10 border-t pb-16"
      >
        <Container className="max-w-[84rem]">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-[var(--shadow-soft)] sm:py-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizedSrc(SERVICES_HERO_IMAGE, 1600)}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,26,47,0.92)_0%,rgba(14,39,66,0.8)_100%)]"
              />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {t("ctaTitle")}
                </h2>
                <Button asChild size="lg" variant="gradient" className="mt-6">
                  <Link href="/contact">{t("ctaButton")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
