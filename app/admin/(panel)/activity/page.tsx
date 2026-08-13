import { History } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getActivityLogs } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  Avatar,
  EmptyState,
  Reveal,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  await requirePermission("activity.read");
  const logs = await getActivityLogs();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governance"
        title="Activity log"
        description="Audit trail of admin actions."
      />

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {logs.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              hint="Admin actions will be recorded here."
            />
          ) : (
            <ul className="divide-border/70 divide-y">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="hover:bg-primary-50/40 flex items-center gap-3.5 px-5 py-3.5 transition-colors"
                >
                  <Avatar name={l.actor?.name ?? "System"} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="text-foreground font-semibold">
                        {l.actor?.name ?? "System"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {l.summary ?? l.action}
                      </span>
                      {l.entityType ? (
                        <span className="bg-muted text-muted-foreground ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                          {l.entityType}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-right text-xs">
                    <span className="block">
                      {formatDate(l.createdAt, "en")}
                    </span>
                    {l.ip ? (
                      <span className="block font-mono opacity-70">{l.ip}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </Reveal>
    </div>
  );
}
