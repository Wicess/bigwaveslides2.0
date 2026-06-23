import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getEventBySlug, getEventSlugs, spotsLeft } from "@/server/data/events";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { PageHeader } from "@/components/ui/page-header";
import { RegistrationForm } from "@/components/events/registration-form";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { eventLd, absoluteUrl } from "@/lib/structured-data";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: getLocalized(event.metaTitle ?? event.title, locale),
    description: getLocalized(event.metaDescription ?? event.excerpt, locale),
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const t = await getTranslations("EventDetail");
  const title = getLocalized(event.title, locale);
  const excerpt = getLocalized(event.excerpt, locale);
  const description = getLocalized(event.description, locale) || excerpt;
  const gallery = Array.isArray(event.galleryMedia)
    ? (event.galleryMedia as string[]).filter((g) => typeof g === "string")
    : [];

  const isPast =
    event.status === "PAST" ||
    (event.endAt ? new Date(event.endAt) < new Date() : new Date(event.startAt) < new Date());
  const left = spotsLeft(event.capacity, event._count.registrations);
  const canRegister =
    event.registrationEnabled && !isPast && (left == null || left > 0);

  return (
    <main>
      <JsonLd
        data={eventLd({
          name: title,
          description: excerpt,
          image: event.coverImage,
          url: absoluteUrl(locale, `/events/${event.slug}`),
          startDate: event.startAt.toISOString(),
          endDate: event.endAt?.toISOString(),
          location: event.location,
        })}
      />
      <PageHeader eyebrow={t("eyebrow")} title={title} description={excerpt}>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            {formatDate(event.startAt, locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              {event.location}
            </span>
          ) : null}
          {left != null ? (
            <span className="inline-flex items-center gap-2">
              <Users className="size-5 text-primary" />
              {left > 0 ? t("spotsLeft", { count: left }) : t("full")}
            </span>
          ) : null}
        </div>
      </PageHeader>

      <Section spacing="compact" className="pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-8">
              {event.coverImage ? (
                <Reveal>
                  <MediaImage
                    src={event.coverImage}
                    alt={title}
                    priority
                    className="aspect-[16/9]"
                    sizes="(min-width:1024px) 60vw, 100vw"
                  />
                </Reveal>
              ) : null}

              {description ? (
                <Reveal>
                  <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </Reveal>
              ) : null}

              {gallery.length > 0 ? (
                <Reveal>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {gallery.map((src, i) => (
                      <MediaImage
                        key={src}
                        src={src}
                        alt={`${title} — ${i + 1}`}
                        className="aspect-square"
                        imgClassName="hover:scale-105"
                      />
                    ))}
                  </div>
                </Reveal>
              ) : null}
            </div>

            {/* Registration */}
            <div>
              <Card className="p-6 lg:sticky lg:top-28">
                {canRegister ? (
                  <>
                    <h2 className="text-xl font-semibold">{t("registerTitle")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("registerIntro")}
                    </p>
                    <div className="mt-5">
                      <RegistrationForm eventId={event.id} />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Badge variant={isPast ? "outline" : "accent"}>
                      {isPast ? t("eventEnded") : t("registrationClosed")}
                    </Badge>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {isPast ? t("endedNote") : t("closedNote")}
                    </p>
                    <Link
                      href="/events"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <ArrowLeft className="size-4" />
                      {t("allEvents")}
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
