import { requirePermission } from "@/lib/admin-auth";
import { getAdminSubscribers } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewsletterTable, type SubscriberRow } from "@/components/admin/newsletter-table";

export default async function AdminNewsletterPage() {
  await requirePermission("newsletter.manage");
  const subs = await getAdminSubscribers();
  const active = subs.filter((s) => s.status === "SUBSCRIBED").length;

  const rows: SubscriberRow[] = subs.map((s) => ({
    id: s.id,
    email: s.email,
    source: s.source ?? null,
    status: s.status,
    createdAt: formatDate(s.createdAt, "en"),
    createdAtISO: new Date(s.createdAt).toISOString(),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description={`${active} active subscriber${active === 1 ? "" : "s"} of ${subs.length} total.`}
      />
      <NewsletterTable subscribers={rows} />
    </div>
  );
}
