import { requirePermission } from "@/lib/admin-auth";
import { getActivityLogs } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminActivityPage() {
  await requirePermission("activity.read");
  const logs = await getActivityLogs();

  return (
    <div>
      <AdminPageHeader title="Activity log" description="Audit trail of admin actions." />
      <Card className="overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="font-medium">{l.actor?.name ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">{l.summary ?? l.action}</span>
                  {l.entityType ? (
                    <span className="ml-1 text-xs text-muted-foreground">({l.entityType})</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(l.createdAt, "en")}
                  {l.ip ? ` · ${l.ip}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
