import { notFound } from "next/navigation";
import { Mail, Phone, Building2, History, Sparkles } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCustomer } from "@/server/data/admin-cms";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { CrmForm } from "@/components/admin/crm-form";
import { AdminCard, Avatar, BackLink, Reveal, SectionTitle } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetail({ params }: Props) {
  await requirePermission("customer.read");
  const { id } = await params;
  const c = await getAdminCustomer(id);
  if (!c) notFound();

  return (
    <div>
      <BackLink href="/admin/customers">Customers</BackLink>

      <Reveal>
        <div className="flex items-center gap-4">
          <Avatar name={c.name} className="size-14 text-base" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{c.name}</h1>
            <p className="text-sm text-muted-foreground">Joined {formatDate(c.createdAt, "en")}</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <AdminCard className="p-6">
              <SectionTitle icon={Mail}>Profile</SectionTitle>
              <ul className="space-y-2.5 text-sm text-foreground/80">
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-primary" /> {c.email}
                </li>
                {c.phone ? (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-4 text-primary" /> {c.phone}
                  </li>
                ) : null}
                {c.organizationName ? (
                  <li className="flex items-center gap-2.5">
                    <Building2 className="size-4 text-primary" /> {c.organizationName}
                    {c.organizationType ? ` (${c.organizationType})` : ""}
                  </li>
                ) : null}
              </ul>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/50 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="size-4 text-primary" /> Lifetime value
                </span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatPrice(c.lifetimeValueCents, "en")}
                </span>
              </div>
            </AdminCard>
          </Reveal>

          <Reveal delay={0.1}>
            <AdminCard className="p-6">
              <SectionTitle icon={History}>History</SectionTitle>
              <div className="space-y-5">
                <HistoryGroup
                  title="Orders"
                  rows={c.orders.map((o) => ({ id: o.id, ref: o.orderNumber, when: o.createdAt, status: o.status, amount: o.totalCents }))}
                />
                <HistoryGroup
                  title="Bookings"
                  rows={c.bookings.map((b) => ({ id: b.id, ref: b.bookingNumber, when: b.eventStartDate, status: b.status, amount: b.totalCents }))}
                />
                <HistoryGroup
                  title="Quotes"
                  rows={c.quotes.map((q) => ({ id: q.id, ref: q.quoteNumber, when: q.createdAt, status: q.status, amount: q.estimateCents ?? 0 }))}
                />
                {c.orders.length === 0 && c.bookings.length === 0 && c.quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history yet.</p>
                ) : null}
              </div>
            </AdminCard>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <AdminCard className="h-fit p-6 lg:sticky lg:top-2">
            <SectionTitle icon={Sparkles}>CRM</SectionTitle>
            <CrmForm id={c.id} notes={c.crmNotes ?? ""} tags={c.crmTags} />
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}

function HistoryGroup({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; ref: string; when: Date; status: string; amount: number }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="divide-y divide-border/70 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="font-mono text-xs font-semibold text-primary">{r.ref}</span>
            <span className="flex items-center gap-2">
              <StatusBadge status={r.status} locale="en" />
              <span className="text-muted-foreground">{formatDate(r.when, "en")}</span>
              {r.amount > 0 ? (
                <span className="font-semibold text-foreground">{formatPrice(r.amount, "en")}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
