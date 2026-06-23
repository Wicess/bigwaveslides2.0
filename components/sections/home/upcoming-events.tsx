import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin, CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media-image";

type EventItem = {
  slug: string;
  title: unknown;
  excerpt: unknown;
  startAt: Date;
  location: string | null;
  coverImage: string | null;
};

export async function UpcomingEvents({
  events,
  locale,
}: {
  events: EventItem[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (events.length === 0) return null;

  return (
    <Section spacing="compact" className="bg-muted/40">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader eyebrow={t("eventsEyebrow")} title={t("eventsTitle")} />
          <Link
            href="/events"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            {t("eventsCta")} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {events.map((e, i) => (
            <Reveal key={e.slug} delay={i * 0.08}>
              <Link
                href={`/events/${e.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background"
              >
                {e.coverImage ? (
                  <MediaImage
                    src={e.coverImage}
                    alt={getLocalized(e.title, locale)}
                    className="aspect-[16/10] w-full rounded-none"
                    imgClassName="group-hover:scale-105"
                    sizes="(min-width:768px) 33vw, 100vw"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      <CalendarDays className="size-4" />
                      {formatDate(e.startAt, locale)}
                    </span>
                    {e.location ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        {e.location}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold transition-colors group-hover:text-primary">
                    {getLocalized(e.title, locale)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {getLocalized(e.excerpt, locale)}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
