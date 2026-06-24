import Link from "next/link";
import {
  Users,
  MousePointerClick,
  Eye,
  ShoppingCart,
  ArrowRight,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  HelpCircle,
} from "lucide-react";
import { getAnalyticsOverview } from "@/server/data/analytics";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("en-US");

const DEVICE_ICON: Record<string, typeof Monitor> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
  BOT: Bot,
  UNKNOWN: HelpCircle,
};

export default async function AnalyticsPage() {
  const d = await getAnalyticsOverview(30);

  const kpis = [
    { label: "Visitors", value: n(d.visitors), today: d.visitorsToday, icon: Users },
    { label: "Sessions", value: n(d.visits), today: d.visitsToday, icon: MousePointerClick },
    { label: "Page views", value: n(d.pageViews), today: d.pageViewsToday, icon: Eye },
    { label: "Orders from cart", value: n(d.cart.orders), today: undefined, icon: ShoppingCart },
  ];

  const maxViews = Math.max(1, ...d.series.map((s) => s.views));
  const totalDevices = Math.max(1, d.devices.reduce((a, b) => a + b.count, 0));

  const funnel = [
    { label: "Cart views", value: d.cart.views },
    { label: "Add to cart", value: d.cart.adds },
    { label: "Removed", value: d.cart.removes },
    { label: "Checkout started", value: d.cart.checkouts },
    { label: "Order requested", value: d.cart.orders },
  ];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Traffic, engagement and cart activity over the last 30 days."
        action={
          <Link
            href="/admin/analytics/visitors"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Users className="size-4" /> View visitors
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="flex flex-col gap-3 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-3xl font-bold">{k.value}</span>
              <span className="text-sm text-muted-foreground">
                {k.label}
                {typeof k.today === "number" ? (
                  <span className="ml-1.5 text-xs font-medium text-primary">
                    +{n(k.today)} today
                  </span>
                ) : null}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Daily page views chart */}
      <Card className="mt-6 p-5">
        <h2 className="mb-4 font-semibold">Page views — last 30 days</h2>
        {d.series.length === 0 ? (
          <p className="text-sm text-muted-foreground">No traffic recorded yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {d.series.map((s) => (
              <div key={s.date} className="group relative flex-1" title={`${s.date}: ${s.views} views`}>
                <div
                  className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(2, (s.views / maxViews) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cart funnel + devices */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Cart activity</h2>
          <ul className="space-y-3">
            {funnel.map((f) => (
              <li key={f.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-semibold">{n(f.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary"
                    style={{ width: `${(f.value / maxFunnel) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Devices</h2>
          {d.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.devices
                .sort((a, b) => b.count - a.count)
                .map((dev) => {
                  const Icon = DEVICE_ICON[dev.device] ?? HelpCircle;
                  const pct = Math.round((dev.count / totalDevices) * 100);
                  return (
                    <li key={dev.device} className="flex items-center gap-3">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="w-20 text-sm capitalize">{dev.device.toLowerCase()}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-right text-sm font-semibold">
                        {n(dev.count)} · {pct}%
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>
      </div>

      {/* Top pages / states / countries */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Top pages</h2>
          {d.topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.topPages.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate font-mono text-xs">{p.path}</span>
                  <span className="shrink-0 font-semibold">{n(p.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
            <MapPin className="size-4 text-muted-foreground" /> Top states / regions
          </h2>
          {d.topRegions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.topRegions.map((r) => (
                <li key={`${r.region}-${r.country}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {r.region}
                    {r.country ? (
                      <span className="text-xs text-muted-foreground"> · {r.country}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-semibold">{n(r.visitors)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-semibold">
            <Globe className="size-4 text-muted-foreground" /> Top countries
          </h2>
          {d.topCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.topCountries.map((c) => (
                <li key={c.country} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{c.country}</span>
                  <span className="shrink-0 font-semibold">{n(c.visitors)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        Locations are resolved from the visitor&apos;s network at the edge and shown to city level.
        <Link href="/admin/analytics/visitors" className="inline-flex items-center gap-1 text-primary">
          See every visitor <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </div>
  );
}
