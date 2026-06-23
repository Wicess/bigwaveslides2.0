import { requirePermission } from "@/lib/admin-auth";
import { getAdminContacts } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContactStatus } from "@/components/admin/contact-status";

export default async function AdminContactsPage() {
  await requirePermission("contact.manage");
  const contacts = await getAdminContacts();

  return (
    <div>
      <AdminPageHeader title="Contact inbox" description="Inquiries from the contact form." />
      {contacts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No inquiries yet.</Card>
      ) : (
        <ul className="space-y-3">
          {contacts.map((c) => (
            <li key={c.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {c.name}{" "}
                      <a href={`mailto:${c.email}`} className="text-sm font-normal text-primary hover:underline">
                        {c.email}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.subject ? `${c.subject} · ` : ""}{formatDate(c.createdAt, "en")}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{c.message}</p>
                  </div>
                  <ContactStatus id={c.id} status={c.status} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
