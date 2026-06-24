import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrder } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderControls } from "@/components/admin/order-controls";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetail({ params }: Props) {
  await requirePermission("order.read");
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = (order.deliveryAddress as { address?: string; city?: string } | null) ?? {};

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt, "en")}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} locale="en" />
          <StatusBadge status={order.paymentStatus} locale="en" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Items</h2>
            <ul className="divide-y divide-border text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2.5">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.lineTotalCents, "en")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.totalCents, "en")}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Customer</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Name</dt><dd>{order.guestName ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{order.guestEmail ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{order.contactPhone ?? order.guestPhone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Address</dt><dd>{[address.address, address.city].filter(Boolean).join(", ") || "—"}</dd></div>
            </dl>
            {order.notes ? (
              <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">
                {order.notes}
              </p>
            ) : null}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Manage</h2>
          <OrderControls
            id={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            invoiceNote={order.invoiceNote}
          />
        </Card>
      </div>
    </div>
  );
}
