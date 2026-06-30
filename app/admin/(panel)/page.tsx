import Link from "next/link";
import {
  ShoppingCart,
  CalendarCheck,
  FileText,
  DollarSign,
  ArrowRight,
  Package,
  CalendarClock,
  Users,
  MousePointerClick,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { getAdminDashboard } from "@/server/data/admin";
import { getAnalyticsOverview } from "@/server/data/analytics";
import { formatPrice, formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminCard, CardHead, StatTile, Reveal } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [d, a] = await Promise.all([getAdminDashboard(), getAnalyticsOverview(30)]);

  const primaryKpis = [
    { label: "Pending orders", value: d.ordersPending, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Booking requests", value: d.bookingsRequested, icon: CalendarCheck, href: "/admin/bookings" },
    { label: "New quotes", value: d.quotesNew, icon: FileText, href: "/admin/quotes" },
  ];
  const secondaryKpis = [
    { label: "Revenue (paid)", value: formatPrice(d.revenueCents, "en"), icon: DollarSign },
    { label: "Active products", value: d.productsActive, icon: Package, href: "/admin/products" },
    { label: "Upcoming events", value: d.upcoming, icon: CalendarClock, href: "/admin/bookings" },
  ];

  const conversion =
    a.cart.checkouts > 0 ? Math.round((a.cart.orders / a.cart.checkouts) * 100) : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Commerce operations at a glance."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)]">
            <CalendarClock className="size-4 text-primary" />
            {formatDate(new Date(), "en")}
          </span>
        }
      />

      {/* Top: action KPIs + traffic chart */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-3">
            {primaryKpis.map((k, i) => (
              <StatTile key={k.label} {...k} delay={0.05 * i} />
            ))}
          </div>

          {/* Welcome / operations banner */}
          <Reveal delay={0.18}>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] p-6 text-white shadow-[var(--shadow-soft)] [background:var(--gradient-deep)] sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-primary/25 blur-2xl"
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-sm">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                    <Sparkles className="size-4" /> Big Wave Slides
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold leading-tight">
                    Run your rentals with confidence
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Track orders, bookings and traffic in one calm place. Everything updates live.
                  </p>
                  <Link
                    href="/admin/analytics"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--color-accent)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    View analytics <ArrowRight className="size-4" />
                  </Link>
                </div>

                {/* decorative brand "card" */}
                <div className="w-full max-w-[15rem] rounded-2xl p-5 shadow-xl [background:var(--gradient-wave)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Revenue
                    </span>
                    <TrendingUp className="size-4 text-white/80" />
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold">
                    {formatPrice(d.revenueCents, "en")}
                  </p>
                  <p className="mt-4 text-xs text-white/80">Paid orders · all time</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Traffic chart card */}
        <Reveal delay={0.12} className="h-full">
          <AdminCard className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page views</p>
                <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {a.pageViews.toLocaleString("en-US")}
                </p>
              </div>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary">
                +{a.pageViewsToday.toLocaleString("en-US")} today
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Last {a.days} days</p>

            <div className="mt-4 flex-1">
              <AreaChart data={a.series} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-4">
              <MiniStat label="Visitors" value={a.visitors} icon={Users} />
              <MiniStat label="Sessions" value={a.visits} icon={MousePointerClick} />
            </div>
          </AdminCard>
        </Reveal>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-5 sm:grid-cols-3">
        {secondaryKpis.map((k, i) => (
          <StatTile key={k.label} {...k} delay={0.05 * i} />
        ))}
      </div>

      {/* Recent activity columns + conversion goal */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent orders */}
        <Reveal delay={0.05}>
          <AdminCard className="h-full p-6">
            <CardHead title="Recent orders" href="/admin/orders" />
            {d.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border/70 text-sm">
                {d.recentOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-foreground">
                          {o.guestName ?? o.orderNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">{o.orderNumber}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={o.paymentStatus} locale="en" />
                        <span className="font-bold">{formatPrice(o.totalCents, "en")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </Reveal>

        {/* Recent bookings */}
        <Reveal delay={0.1}>
          <AdminCard className="h-full p-6">
            <CardHead title="Recent bookings" href="/admin/bookings" />
            {d.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border/70 text-sm">
                {d.recentBookings.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-foreground">
                          {b.guestName ?? b.bookingNumber}
                        </span>
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
          </AdminCard>
        </Reveal>

        {/* Conversion goal donut */}
        <Reveal delay={0.15}>
          <div className="flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-6 text-white shadow-[var(--shadow-soft)] [background:var(--gradient-deep)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Checkout conversion
              </p>
              <p className="mt-1 text-sm text-white/75">Orders from started checkouts</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-display text-3xl font-bold">{conversion}%</p>
                <p className="mt-1 text-xs text-white/70">
                  {a.cart.orders} / {a.cart.checkouts} checkouts
                </p>
              </div>
              <Donut percent={conversion} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Activity feed */}
      <Reveal delay={0.05}>
        <AdminCard className="p-6">
          <CardHead title="Recent activity" href="/admin/activity" linkLabel="Full log" />
          {d.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {d.recentActivity.map((act) => (
                <li key={act.id} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate">
                      <span className="font-semibold text-foreground">
                        {act.actor?.name ?? "System"}
                      </span>{" "}
                      <span className="text-muted-foreground">{act.summary ?? act.action}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(act.createdAt, "en")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </Reveal>
    </div>
  );
}

/** Small labelled metric used under the chart. */
function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-display text-lg font-bold leading-none text-foreground">
          {value.toLocaleString("en-US")}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

/** Pure-SVG area chart of daily page views — no client JS. */
function AreaChart({ data }: { data: { date: string; views: number }[] }) {
  const points = data.filter((_, i) => i < 90);
  if (points.length < 2) {
    return (
      <div className="grid h-28 place-items-center rounded-xl bg-muted/50 text-xs text-muted-foreground">
        Not enough data yet
      </div>
    );
  }
  const w = 300;
  const h = 110;
  const pad = 6;
  const max = Math.max(1, ...points.map((p) => p.views));
  const n = points.length;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (n - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${(h - pad).toFixed(1)} L${x(0).toFixed(1)},${(h - pad).toFixed(1)} Z`;
  const peakIdx = points.reduce((best, p, i) => (p.views > points[best]!.views ? i : best), 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none" role="img" aria-label="Daily page views">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(peakIdx)} cy={y(points[peakIdx]!.views)} r="3.5" fill="var(--color-primary)" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/** Pure-SVG donut for a single percentage. */
function Donut({ percent }: { percent: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const dash = (pct / 100) * c;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={`${pct}%`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-white font-display text-[15px] font-bold">
        {pct}%
      </text>
    </svg>
  );
}
