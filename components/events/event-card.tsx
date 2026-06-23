import { getTranslations } from "next-intl/server";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { MediaImage } from "@/components/ui/media-image";
import { Badge } from "@/components/ui/badge";
import { spotsLeft, type EventCard as EventCardData } from "@/server/data/events";

export async function EventCard({
  event,
  locale,
  priority,
  past,
}: {
  event: EventCardData;
  locale: string;
  priority?: boolean;
  past?: boolean;
}) {
  const t = await getTranslations("Events");
  const title = getLocalized(event.title, locale);
  const excerpt = getLocalized(event.excerpt, locale);
  const left = spotsLeft(event.capacity, event._count.registrations);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative">
        {event.coverImage ? (
          <MediaImage
            src={event.coverImage}
            alt={title}
            className="aspect-[16/10] w-full"
            imgClassName="group-hover:scale-[1.04]"
            sizes="(min-width:1024px) 33vw, 100vw"
            priority={priority}
            rounded={false}
          />
        ) : (
          <div className="aspect-[16/10] w-full bg-muted" />
        )}
        {!past && left != null && left <= 10 ? (
          <Badge
            variant={left === 0 ? "accent" : "primary"}
            className="absolute left-3 top-3"
          >
            {left === 0 ? t("full") : t("spotsLeft", { count: left })}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary" />
            {formatDate(event.startAt, locale)}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              {event.location}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 text-lg font-semibold transition-colors group-hover:text-primary">
          {title}
        </h3>
        {excerpt ? (
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
            {excerpt}
          </p>
        ) : (
          <span className="flex-1" />
        )}

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {past ? t("viewRecap") : t("viewDetails")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
