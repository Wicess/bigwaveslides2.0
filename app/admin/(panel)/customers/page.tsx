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
          <div className="overflow-x-auto">
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
        )}
      </Card>
    </div>
  );
}
