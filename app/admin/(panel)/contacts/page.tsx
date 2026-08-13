import { Inbox, Phone } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminContacts } from "@/server/data/admin-cms";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContactStatus } from "@/components/admin/contact-status";
import {
  AdminCard,
  Avatar,
  CountPill,
  EmptyState,
  Reveal,
  Toolbar,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  await requirePermission("contact.manage");
  const contacts = await getAdminContacts();

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM & comms"
        title="Contact inbox"
        description="Inquiries from the website contact form."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">Messages</h2>
          <CountPill>{contacts.length}</CountPill>
        </div>
      </Toolbar>

      {contacts.length === 0 ? (
        <Reveal delay={0.05}>
          <AdminCard>
            <EmptyState
              icon={Inbox}
              title="Inbox zero"
              hint="New inquiries from the contact form will land here."
            />
          </AdminCard>
        </Reveal>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contacts.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i * 0.04, 0.3)}>
              <AdminCard hover className="h-full p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-foreground font-semibold">
                          {c.name}
                        </p>
                        <a
                          href={`mailto:${c.email}`}
                          className="text-primary text-sm hover:underline"
                        >
                          {c.email}
                        </a>
                      </div>
                      <ContactStatus id={c.id} status={c.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      {c.subject ? (
                        <span className="font-medium">{c.subject}</span>
                      ) : null}
                      <span>{formatDate(c.createdAt, "en")}</span>
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                      ) : null}
                    </p>
                    <p className="bg-muted/50 text-foreground/80 mt-3 rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-line">
                      {c.message}
                    </p>
                  </div>
                </div>
              </AdminCard>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
