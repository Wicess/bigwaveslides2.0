import Link from "next/link";
import {
  ShoppingCart,
  CalendarCheck,
  FileText,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { getAdminDashboard } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/account/status-badge";

export default async function AdminDashboard() {
  const d = await getAdminDashboard();

  const kpis = [
    { label: "Pending orders", value: d.ordersPending, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Booking requests", value: d.bookingsRequested, icon: CalendarCheck, href: "/admin/bookings" },
    { label: "New quotes", value: d.quotesNew, icon: FileText, href: "/admin/quotes" },
    { label: "Revenue (paid)", value: formatPrice(d.revenueCents, "en"), icon: DollarSign },
  ];

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Commerce operations at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const body = (
            <Card className="flex flex-col gap-3 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-3xl font-bold">{k.value}</span>
              <span className="text-sm text-muted-foreground">{k.label}</span>
            </Card>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="transition-transform hover:-translate-y-0.5">
              {body}
            </Link>
          ) : (
            <div key={k.label}>{body}</div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-primary">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {d.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{o.guestName ?? o.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">{o.orderNumber}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={o.paymentStatus} locale="en" />
                      <span className="font-semibold">{formatPrice(o.totalCents, "en")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent bookings */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent bookings</h2>
            <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-primary">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {d.recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.recentBookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.guestName ?? b.bookingNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(b.eventStartDate, "en")}
                      </span>
                    </span>
                    <StatusBadge status={b.status} locale="en" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Activity */}
      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        {d.recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-medium">{a.actor?.name ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">
                    {a.summary ?? a.action}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(a.createdAt, "en")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
