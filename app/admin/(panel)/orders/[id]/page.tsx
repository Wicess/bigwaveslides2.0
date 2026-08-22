import { notFound } from "next/navigation";
import { geoFromIp } from "@/lib/analytics/geo";
import { Package, User, Settings, MapPin } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrder } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrderControls } from "@/components/admin/order-controls";
import { OrderPaymentPanel } from "@/components/admin/order-payment-panel";
import { loadPaymentMethods, DEFAULT_METHODS } from "@/lib/payment-methods";
import {
  AdminCard,
  BackLink,
  Reveal,
  SectionTitle,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetail({ params }: Props) {
  await requirePermission("order.read");
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const rails = await loadPaymentMethods().catch(() => DEFAULT_METHODS);

  const address =
    (order.deliveryAddress as { address?: string; city?: string } | null) ?? {};
  const geo =
    (order.geo as {
      country?: string | null;
      region?: string | null;
      city?: string | null;
      ip?: string | null;
      datacenter?: boolean;
      /** Set when the location was matched from the browsing session rather
       *  than captured at checkout — see scripts/backfill-order-geo.ts. */
      fromSession?: boolean;
    } | null) ?? null;

  // Orders placed where the edge geo headers were absent land here with an IP
  // and nothing else. Rather than showing a bare address, resolve it now —
  // best-effort, in-process cached, and it never throws — so historical orders
  // display a location too instead of staying blank forever.
  let place = [geo?.city, geo?.region, geo?.country].filter(Boolean).join(", ");
  let datacenter = geo?.datacenter;
  if (!place && geo?.ip) {
    const late = await geoFromIp(geo.ip);
    if (late) {
      place = [late.city, late.region, late.country].filter(Boolean).join(", ");
      datacenter = late.datacenter;
    }
  }
  const placedFrom = place || (geo?.ip ? "Location unavailable" : "—");

  return (
    <div>
      <BackLink href="/admin/orders">Orders</BackLink>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-foreground font-mono text-2xl font-bold">
              {order.orderNumber}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatDate(order.createdAt, "en")}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <AdminCard className="p-6">
              <SectionTitle icon={Package}>Items</SectionTitle>
              <ul className="divide-border/70 divide-y text-sm">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 py-2.5"
                  >
                    <span className="text-foreground/80">
                      {item.name}{" "}
                      <span className="text-muted-foreground">
                        × {item.quantity}
                      </span>
                    </span>
                    <span className="text-foreground font-semibold">
                      {formatPrice(item.lineTotalCents, "en")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-border mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-foreground font-semibold">Total</span>
                <span className="font-display text-primary text-lg font-bold">
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
                <Field
                  label="Phone"
                  value={order.contactPhone ?? order.guestPhone ?? "—"}
                />
                <Field
                  label="Address"
                  value={
                    [address.address, address.city]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                    <MapPin className="size-3.5" /> Placed from (IP location)
                  </p>
                  <p className="text-foreground/80 mt-0.5">
                    {placedFrom}
                    {geo?.ip ? (
                      <span className="text-muted-foreground font-mono text-xs">
                        {" · "}
                        {geo.ip}
                      </span>
                    ) : null}
                    {geo?.fromSession ? (
                      <span className="text-muted-foreground ml-2 text-xs italic">
                        matched from the browsing session
                      </span>
                    ) : null}
                    {datacenter ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        datacenter / VPN — not the customer&apos;s real location
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              {order.notes ? (
                <p className="bg-muted/50 text-foreground/80 mt-4 rounded-2xl p-3.5 text-sm whitespace-pre-line">
                  {order.notes}
                </p>
              ) : null}
            </AdminCard>
          </Reveal>
        </div>

        <div className="space-y-5">
          <Reveal delay={0.12}>
            <AdminCard className="h-fit p-6">
              <SectionTitle icon={Settings}>
                Quote → invoice → payment
              </SectionTitle>
              <OrderPaymentPanel
                orderId={order.id}
                stage={order.stage}
                plan={order.paymentPlan}
                state={order.paymentDetailsState}
                methodKey={order.paymentMethodKey}
                methodLabel={order.paymentMethodLabel}
                destination={order.paymentDestination}
                proofTxId={order.proofTxId}
                proofImageUrl={order.proofImageUrl}
                proofNote={order.proofNote}
                proofSubmittedAt={order.proofSubmittedAt?.toISOString() ?? null}
                totalCents={order.totalCents}
                methods={rails.map((m) => ({
                  method: m.method,
                  label: m.label,
                }))}
              />
            </AdminCard>
          </Reveal>

          <Reveal delay={0.14}>
            <AdminCard className="h-fit p-6">
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="text-foreground/80 mt-0.5">{value}</p>
    </div>
  );
}
