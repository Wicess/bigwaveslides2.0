import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getServiceBySlug,
  getServiceSlugs,
  getAllServices,
} from "@/server/data/services";
import { getLocalized } from "@/lib/localized";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MediaImage } from "@/components/ui/media-image";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getServiceSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug).catch(() => null);
  if (!service) return {};
  return {
    title: getLocalized(service.metaTitle ?? service.title, locale),
    description: getLocalized(service.metaDescription ?? service.summary, locale),
  };
}

/** Normalize an `included` Json value into a list of localized strings. */
function toIncludedList(value: unknown, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => getLocalized(item, locale, String(item))).filter(Boolean);
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const service = await getServiceBySlug(slug).catch(() => null);
  if (!service) notFound();

  const t = await getTranslations("ServiceDetail");

  const title = getLocalized(service.title, locale);
  const summary = getLocalized(service.summary, locale);
  const description = getLocalized(service.description, locale);
  const included = toIncludedList(service.included, locale);
  const gallery = Array.isArray(service.gallery)
    ? (service.gallery as string[]).filter((g) => typeof g === "string")
    : [];

  const related = (await getAllServices().catch(() => []))
    .filter((s) => s.slug !== slug)
    .slice(0, 3);

  return (
    <main>
      <PageHeader eyebrow={summary || undefined} title={title} description={description}>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="gradient">
            <Link href="/contact">{t("getQuote")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/rent">{t("rentRelated")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Hero image */}
      {service.heroImage ? (
        <Section spacing="compact">
          <Container>
            <Reveal>
              <MediaImage
                src={service.heroImage}
                alt={title}
                priority
                sizes="(min-width: 1280px) 1152px, 100vw"
                className="aspect-[16/7]"
              />
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Included */}
      {included.length > 0 ? (
        <Section>
          <Container>
            <SectionHeader title={t("included")} />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {included.map((item, i) => (
                <Reveal key={item} delay={i * 0.04}>
                  <li className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-background p-4">
                    <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm">{item}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Gallery */}
      {gallery.length > 0 ? (
        <Section spacing="compact">
          <Container>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((src, i) => (
                <Reveal key={src} delay={i * 0.05}>
                  <MediaImage
                    src={src}
                    alt={`${title} — ${i + 1}`}
                    className="aspect-[4/3]"
                    imgClassName="hover:scale-105"
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Related services */}
      {related.length > 0 ? (
        <Section className="bg-muted/40">
          <Container>
            <SectionHeader title={t("relatedTitle")} />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((s, i) => (
                <Reveal key={s.slug} delay={i * 0.05}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                  >
                    <h3 className="text-lg font-semibold">
                      {getLocalized(s.title, locale)}
                    </h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {getLocalized(s.summary, locale)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {t("getQuote")}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Back link */}
      <Section spacing="compact" className="pb-16">
        <Container>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        </Container>
      </Section>
    </main>
  );
}
