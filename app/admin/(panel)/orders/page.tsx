import Link from "next/link";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrders } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/account/status-badge";

export default async function AdminOrdersPage() {
  await requirePermission("order.read");
  const orders = await getAdminOrders();

  return (
    <div>
      <AdminPageHeader title="Orders" description="Request-based product orders." />
      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-primary">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{o.guestName ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{o.guestEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt, "en")}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(o.totalCents, "en")}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} locale="en" /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} locale="en" /></td>
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
