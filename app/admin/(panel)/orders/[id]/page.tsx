import { notFound } from "next/navigation";
import { Package, User, Settings, MapPin } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrder } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderControls } from "@/components/admin/order-controls";
import { AdminCard, BackLink, Reveal, SectionTitle } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetail({ params }: Props) {
  await requirePermission("order.read");
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = (order.deliveryAddress as { address?: string; city?: string } | null) ?? {};
  const geo = (order.geo as { country?: string; region?: string; city?: string; ip?: string } | null) ?? null;
  const placedFrom =
    geo && (geo.city || geo.region || geo.country)
      ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ") + (geo.ip ? ` · ${geo.ip}` : "")
      : "—";

  return (
    <div>
      <BackLink href="/admin/orders">Orders</BackLink>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt, "en")}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.status} locale="en" />
            <StatusBadge status={order.paymentStatus} locale="en" />
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <AdminCard className="p-6">
              <SectionTitle icon={Package}>Items</SectionTitle>
              <ul className="divide-y divide-border/70 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-2.5">
                    <span className="text-foreground/80">
                      {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(item.lineTotalCents, "en")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-lg font-bold text-primary">
                  {formatPrice(order.totalCents, "en")}
                </span>
              </div>
            </AdminCard>
          </Reveal>

          <Reveal delay={0.1}>
            <AdminCard className="p-6">
              <SectionTitle icon={User}>Customer</SectionTitle>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Name" value={order.guestName ?? "—"} />
                <Field label="Email" value={order.guestEmail ?? "—"} />
                <Field label="Phone" value={order.contactPhone ?? order.guestPhone ?? "—"} />
                <Field
                  label="Address"
                  value={[address.address, address.city].filter(Boolean).join(", ") || "—"}
                />
                <div className="sm:col-span-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5" /> Placed from (IP location)
                  </p>
                  <p className="mt-0.5 text-foreground/80">{placedFrom}</p>
                </div>
              </div>
              {order.notes ? (
                <p className="mt-4 whitespace-pre-line rounded-2xl bg-muted/50 p-3.5 text-sm text-foreground/80">
                  {order.notes}
                </p>
              ) : null}
            </AdminCard>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <AdminCard className="h-fit p-6 lg:sticky lg:top-2">
            <SectionTitle icon={Settings}>Manage</SectionTitle>
            <OrderControls
              id={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
              invoiceNote={order.invoiceNote}
            />
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground/80">{value}</p>
    </div>
  );
}
