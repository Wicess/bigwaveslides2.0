import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminEvents } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminEventsPage() {
  await requirePermission("event.write");
  const events = await getAdminEvents();

  return (
    <div>
      <AdminPageHeader
        title="Events"
        description="Community events and registrations."
        action={
          <Button asChild size="sm" variant="gradient">
            <Link href="/admin/events/new"><Plus className="size-4" /> New event</Link>
          </Button>
        }
      />
      <Card className="overflow-hidden">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/events/${e.id}`} className="font-semibold text-primary">
                        {getLocalized(e.title, "en")}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{e.location ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(e.startAt, "en")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.registrationEnabled ? e._count.registrations : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
