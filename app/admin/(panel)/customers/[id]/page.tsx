import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCustomer } from "@/server/data/admin-cms";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { CrmForm } from "@/components/admin/crm-form";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetail({ params }: Props) {
  await requirePermission("customer.read");
  const { id } = await params;
  const c = await getAdminCustomer(id);
  if (!c) notFound();

  return (
    <div>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Customers
      </Link>
      <AdminPageHeader title={c.name} description={`Joined ${formatDate(c.createdAt, "en")}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Profile</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="size-4 text-primary" /> {c.email}</li>
              {c.phone ? <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {c.phone}</li> : null}
              {c.organizationName ? <li className="flex items-center gap-2"><Building2 className="size-4 text-primary" /> {c.organizationName}{c.organizationType ? ` (${c.organizationType})` : ""}</li> : null}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-sm">
              Lifetime value: <span className="font-semibold text-primary">{formatPrice(c.lifetimeValueCents, "en")}</span>
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">History</h2>
            <HistoryGroup title="Orders" rows={c.orders.map((o) => ({ id: o.id, ref: o.orderNumber, when: o.createdAt, status: o.status, amount: o.totalCents }))} />
            <HistoryGroup title="Bookings" rows={c.bookings.map((b) => ({ id: b.id, ref: b.bookingNumber, when: b.eventStartDate, status: b.status, amount: b.totalCents }))} />
            <HistoryGroup title="Quotes" rows={c.quotes.map((q) => ({ id: q.id, ref: q.quoteNumber, when: q.createdAt, status: q.status, amount: q.estimateCents ?? 0 }))} />
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">CRM</h2>
          <CrmForm id={c.id} notes={c.crmNotes ?? ""} tags={c.crmTags} />
        </Card>
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
    <div className="mt-3 first:mt-0">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="divide-y divide-border text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2">
            <span className="font-mono text-xs">{r.ref}</span>
            <span className="flex items-center gap-2">
              <StatusBadge status={r.status} locale="en" />
              <span className="text-muted-foreground">{formatDate(r.when, "en")}</span>
              {r.amount > 0 ? <span className="font-medium">{formatPrice(r.amount, "en")}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
