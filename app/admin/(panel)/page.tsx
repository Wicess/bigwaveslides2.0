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
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminCard, CardHead, Reveal } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [d, a] = await Promise.all([getAdminDashboard(), getAnalyticsOverview(30)]);

  const kpis = [
    { label: "Pending orders", value: d.ordersPending, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Booking requests", value: d.bookingsRequested, icon: CalendarCheck, href: "/admin/bookings" },
    { label: "New quotes", value: d.quotesNew, icon: FileText, href: "/admin/quotes" },
    { label: "Revenue (paid)", value: formatPrice(d.revenueCents, "en"), icon: DollarSign, href: undefined },
    { label: "Active products", value: d.productsActive, icon: Package, href: "/admin/products" },
    { label: "Upcoming events", value: d.upcoming, icon: CalendarClock, href: "/admin/bookings" },
  ];

  const conversion =
    a.cart.checkouts > 0 ? Math.round((a.cart.orders / a.cart.checkouts) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      {/* Header */}
      <div className="admin-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-px w-6 bg-primary/40" /> Overview
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)]">
          <CalendarClock className="size-4 text-primary" />
          {formatDate(new Date(), "en")}
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const inner = (
            <div className="group flex h-full items-center gap-3 rounded-2xl border border-border/70 bg-[var(--admin-card)] p-3.5 shadow-[var(--shadow-soft)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-bold leading-tight text-foreground">
                  {k.value}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{k.label}</span>
              </span>
            </div>
          );
          return (
            <Reveal key={k.label} delay={0.04 * i} className="h-full">
              {k.href ? (
                <Link href={k.href} className="admin-lift block h-full">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </Reveal>
          );
        })}
      </div>

      {/* Middle row — banner + chart + conversion */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <Reveal delay={0.14} className="lg:col-span-1">
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-5 text-white shadow-[var(--shadow-soft)] [background:var(--gradient-deep)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-primary/25 blur-2xl"
            />
            <div className="relative">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                <Sparkles className="size-4" /> Big Wave Slides
              </p>
              <h2 className="mt-2 font-display text-xl font-bold leading-tight">
                Run your rentals with confidence
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                Orders, bookings and traffic — one calm place, always live.
              </p>
            </div>
            <Link
              href="/admin/analytics"
              className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-accent)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              View analytics <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-1">
          <AdminCard className="flex h-full flex-col p-5">
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
            <div className="mt-3 flex-1">
              <AreaChart data={a.series} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/70 pt-3">
              <MiniStat label="Visitors" value={a.visitors} icon={Users} />
              <MiniStat label="Sessions" value={a.visits} icon={MousePointerClick} />
            </div>
          </AdminCard>
        </Reveal>

        <Reveal delay={0.16} className="lg:col-span-1">
          <div className="flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-5 text-white shadow-[var(--shadow-soft)] [background:var(--gradient-deep)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Revenue
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {formatPrice(d.revenueCents, "en")}
                </p>
                <p className="mt-0.5 text-xs text-white/70">Paid orders · all time</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                <TrendingUp className="size-4" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Conversion
                </p>
                <p className="font-display text-xl font-bold">{conversion}%</p>
                <p className="text-[11px] text-white/60">
                  {a.cart.orders}/{a.cart.checkouts} checkouts
                </p>
              </div>
              <Donut percent={conversion} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bottom row — recent orders / bookings / activity (internal scroll) */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <Reveal delay={0.05} className="lg:min-h-0">
          <AdminCard className="flex h-full flex-col p-5">
            <CardHead title="Recent orders" href="/admin/orders" />
            <div className="admin-scroll -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
              {d.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border/70 text-sm">
                  {d.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-primary"
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
            </div>
          </AdminCard>
        </Reveal>

        <Reveal delay={0.1} className="lg:min-h-0">
          <AdminCard className="flex h-full flex-col p-5">
            <CardHead title="Recent bookings" href="/admin/bookings" />
            <div className="admin-scroll -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
              {d.recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-border/70 text-sm">
                  {d.recentBookings.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-primary"
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
            </div>
          </AdminCard>
        </Reveal>

        <Reveal delay={0.15} className="lg:min-h-0">
          <AdminCard className="flex h-full flex-col p-5">
            <CardHead title="Recent activity" href="/admin/activity" linkLabel="Full log" />
            <div className="admin-scroll -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
              {d.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-2.5 text-sm">
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
            </div>
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-display text-base font-bold leading-none text-foreground">
          {value.toLocaleString("en-US")}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function AreaChart({ data }: { data: { date: string; views: number }[] }) {
  const points = data.slice(-90);
  if (points.length < 2) {
    return (
      <div className="grid h-full min-h-20 place-items-center rounded-xl bg-muted/50 text-xs text-muted-foreground">
        Not enough data yet
      </div>
    );
  }
  const w = 300;
  const h = 100;
  const pad = 6;
  const max = Math.max(1, ...points.map((p) => p.views));
  const len = points.length;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (len - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.views).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(len - 1).toFixed(1)},${(h - pad).toFixed(1)} L${x(0).toFixed(1)},${(h - pad).toFixed(1)} Z`;
  const peak = points.reduce((b, p, i) => (p.views > points[b]!.views ? i : b), 0);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full max-h-28 min-h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Daily page views">
      <defs>
        <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dashFill)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(peak)} cy={y(points[peak]!.views)} r="3.5" fill="var(--color-primary)" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const dash = (pct / 100) * c;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${pct}%`}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 34 34)"
      />
      <text x="34" y="39" textAnchor="middle" className="fill-white font-display text-[14px] font-bold">
        {pct}%
      </text>
    </svg>
  );
}
