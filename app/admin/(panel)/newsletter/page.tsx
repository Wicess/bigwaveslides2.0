import { requirePermission } from "@/lib/admin-auth";
import { getAdminSubscribers } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminNewsletterPage() {
  await requirePermission("newsletter.manage");
  const subs = await getAdminSubscribers();
  const active = subs.filter((s) => s.status === "SUBSCRIBED").length;

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description={`${active} active subscriber${active === 1 ? "" : "s"}.`}
      />
      <Card className="overflow-hidden">
        {subs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-muted-foreground">{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt, "en")}</td>
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
