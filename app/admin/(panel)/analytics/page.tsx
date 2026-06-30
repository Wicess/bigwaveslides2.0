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
  FileText,
} from "lucide-react";
import { getAnalyticsOverview } from "@/server/data/analytics";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, CardHead, StatTile, Reveal } from "@/components/admin/admin-ui";

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
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Traffic, engagement and cart activity over the last 30 days."
        action={
          <Button asChild size="sm" variant="gradient">
            <Link href="/admin/analytics/visitors">
              <Users className="size-4" /> View visitors
            </Link>
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <StatTile
            key={k.label}
            icon={k.icon}
            label={k.label}
            value={k.value}
            trend={typeof k.today === "number" ? `+${n(k.today)} today` : undefined}
            delay={0.05 * i}
          />
        ))}
      </div>

      {/* Daily page views chart */}
      <Reveal delay={0.1}>
        <AdminCard className="p-6">
          <CardHead title="Page views — last 30 days" />
          {d.series.length === 0 ? (
            <p className="text-sm text-muted-foreground">No traffic recorded yet.</p>
          ) : (
            <ChartArea data={d.series} />
          )}
        </AdminCard>
      </Reveal>

      {/* Cart funnel + devices */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <AdminCard className="h-full p-6">
            <CardHead title="Cart activity" />
            <ul className="space-y-3.5">
              {funnel.map((f) => (
                <li key={f.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-bold text-foreground">{n(f.value)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full [background:var(--gradient-wave)]"
                      style={{ width: `${(f.value / maxFunnel) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>
        </Reveal>

        <Reveal delay={0.1}>
          <AdminCard className="h-full p-6">
            <CardHead title="Devices" />
            {d.devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="space-y-3.5">
                {d.devices
                  .sort((a, b) => b.count - a.count)
                  .map((dev) => {
                    const Icon = DEVICE_ICON[dev.device] ?? HelpCircle;
                    const pct = Math.round((dev.count / totalDevices) * 100);
                    return (
                      <li key={dev.device} className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="w-20 text-sm font-medium capitalize text-foreground">
                          {dev.device.toLowerCase()}
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full [background:var(--gradient-wave)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm font-bold text-foreground">
                          {pct}%
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </AdminCard>
        </Reveal>
      </div>

      {/* Top pages / states / countries */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal delay={0.05}>
          <RankCard icon={FileText} title="Top pages">
            {d.topPages.length === 0 ? (
              <Empty />
            ) : (
              d.topPages.map((p) => (
                <Row key={p.path} label={<span className="truncate font-mono text-xs">{p.path}</span>} value={n(p.views)} />
              ))
            )}
          </RankCard>
        </Reveal>
        <Reveal delay={0.1}>
          <RankCard icon={MapPin} title="Top states / regions">
            {d.topRegions.length === 0 ? (
              <Empty />
            ) : (
              d.topRegions.map((r) => (
                <Row
                  key={`${r.region}-${r.country}`}
                  label={
                    <span className="truncate">
                      {r.region}
                      {r.country ? (
                        <span className="text-xs text-muted-foreground"> · {r.country}</span>
                      ) : null}
                    </span>
                  }
                  value={n(r.visitors)}
                />
              ))
            )}
          </RankCard>
        </Reveal>
        <Reveal delay={0.15}>
          <RankCard icon={Globe} title="Top countries">
            {d.topCountries.length === 0 ? (
              <Empty />
            ) : (
              d.topCountries.map((c) => (
                <Row key={c.country} label={<span className="truncate">{c.country}</span>} value={n(c.visitors)} />
              ))
            )}
          </RankCard>
        </Reveal>
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        Locations are resolved from the visitor&apos;s network at the edge and shown to city level.
        <Link
          href="/admin/analytics/visitors"
          className="inline-flex items-center gap-1 font-semibold text-primary"
        >
          See every visitor <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </div>
  );
}

function RankCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Monitor;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AdminCard className="h-full p-6">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-foreground">
        <span className="grid size-8 place-items-center rounded-lg bg-primary-50 text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <ul className="divide-y divide-border/70 text-sm">{children}</ul>
    </AdminCard>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0 text-foreground/80">{label}</span>
      <span className="shrink-0 font-bold text-foreground">{value}</span>
    </li>
  );
}

function Empty() {
  return <li className="py-2.5 text-sm text-muted-foreground">No data yet.</li>;
}

/** Pure-SVG area chart of daily page views. */
function ChartArea({ data }: { data: { date: string; views: number }[] }) {
  const points = data.slice(-90);
  if (points.length < 2) {
    return <p className="text-sm text-muted-foreground">Not enough data yet.</p>;
  }
  const w = 800;
  const h = 180;
  const pad = 8;
  const max = Math.max(1, ...points.map((p) => p.views));
  const len = points.length;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (len - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(len - 1).toFixed(1)},${(h - pad).toFixed(1)} L${x(0).toFixed(1)},${(h - pad).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Daily page views">
      <defs>
        <linearGradient id="anFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#anFill)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
