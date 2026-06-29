import Link from "next/link";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCustomers } from "@/server/data/admin-cms";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminCustomersPage() {
  await requirePermission("customer.read");
  const customers = await getAdminCustomers();

  return (
    <div>
      <AdminPageHeader title="Customers" description="CRM — profiles, tags, and history." />
      <Card className="overflow-hidden">
        {customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No customers yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3">LTV</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${c.id}`} className="font-semibold text-primary">
                          {c.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{c.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap gap-1">
                          {c.crmTags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline">{t}</Badge>
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c._count.orders}o · {c._count.bookings}b · {c._count.quotes}q
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatPrice(c.lifetimeValueCents, "en")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(c.createdAt, "en")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {customers.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/customers/${c.id}`} className="block p-4 active:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-primary">{c.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-semibold">{formatPrice(c.lifetimeValueCents, "en")}</span>
                        <span className="block text-xs text-muted-foreground">{formatDate(c.createdAt, "en")}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.crmTags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {c._count.orders}o · {c._count.bookings}b · {c._count.quotes}q
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
