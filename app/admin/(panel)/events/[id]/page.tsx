import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminEvent } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EventForm, type EventFormValues } from "@/components/admin/event-form";

type Props = { params: Promise<{ id: string }> };

/** Date → `YYYY-MM-DDTHH:mm` for datetime-local inputs. */
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminEditEvent({ params }: Props) {
  await requirePermission("event.write");
  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) notFound();

  const title = (event.title as { en?: string; fr?: string }) ?? {};
  const excerpt = (event.excerpt as { en?: string; fr?: string }) ?? {};
  const desc = (event.description as { en?: string; fr?: string }) ?? {};

  const defaults: EventFormValues = {
    id: event.id,
    titleEn: title.en ?? "",
    titleFr: title.fr ?? "",
    slug: event.slug,
    excerptEn: excerpt.en ?? "",
    excerptFr: excerpt.fr ?? "",
    descEn: desc.en ?? "",
    descFr: desc.fr ?? "",
    status: event.status,
    startAt: toLocalInput(event.startAt),
    endAt: toLocalInput(event.endAt),
    location: event.location ?? "",
    coverImage: event.coverImage ?? "",
    capacity: event.capacity != null ? String(event.capacity) : "",
    registrationEnabled: event.registrationEnabled,
    featured: event.featured,
  };

  return (
    <div>
      <Link href="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Events
      </Link>
      <AdminPageHeader title={getLocalized(event.title, "en")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <EventForm defaults={defaults} />
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">
            Registrations ({event.registrations.length})
          </h2>
          {event.registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {event.registrations.map((r) => (
                <li key={r.id} className="py-2">
                  <p className="font-medium">{r.name} <span className="text-xs font-normal text-muted-foreground">×{r.partySize}</span></p>
                  <p className="text-xs text-muted-foreground">{r.email} · {formatDate(r.createdAt, "en")}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
