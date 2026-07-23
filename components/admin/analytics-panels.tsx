"use client";

import * as React from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSelect } from "@/components/admin/admin-select";

const n = (v: number) => v.toLocaleString("en-US");

const DEVICE_ICON: Record<string, LucideIcon> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
  BOT: Bot,
  UNKNOWN: HelpCircle,
};

type Data = {
  series: { date: string; views: number }[];
  cart: { views: number; adds: number; removes: number; checkouts: number; orders: number };
  devices: { device: string; count: number }[];
  topPages: { path: string; views: number }[];
  topRegions: { region: string; country: string; visitors: number }[];
  topCountries: { country: string; visitors: number }[];
};

const VIEWS = [
  { id: "traffic", label: "Traffic" },
  { id: "cart", label: "Cart activity" },
  { id: "devices", label: "Devices" },
  { id: "pages", label: "Top pages" },
  { id: "geography", label: "Geography" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function AnalyticsPanels(data: Data) {
  const [view, setView] = React.useState<ViewId>("traffic");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] border border-border/70 bg-[var(--admin-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold tracking-tight text-foreground">
          {VIEWS.find((v) => v.id === view)?.label}
        </h2>

        {/* Pill tabs on wide screens */}
        <div className="hidden items-center gap-1.5 lg:flex">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200",
                view === v.id
                  ? "text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]"
                  : "text-foreground/65 hover:bg-primary-50 hover:text-primary",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Site-styled dropdown on small screens */}
        <div className="w-40 shrink-0 lg:hidden">
          <AdminSelect
            ariaLabel="Choose analytics view"
            value={view}
            onChange={(v) => setView(v as ViewId)}
            options={VIEWS.map((v) => ({ value: v.id, label: v.label }))}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto admin-scroll -mr-2 pr-2">
        {view === "traffic" ? <Traffic series={data.series} /> : null}
        {view === "cart" ? <Cart cart={data.cart} /> : null}
        {view === "devices" ? <Devices devices={data.devices} /> : null}
        {view === "pages" ? <TopList rows={data.topPages.map((p) => ({ label: p.path, value: p.views, mono: true }))} /> : null}
        {view === "geography" ? <Geography regions={data.topRegions} countries={data.topCountries} /> : null}
      </div>
    </div>
  );
}

function Traffic({ series }: { series: Data["series"] }) {
  const points = series.slice(-90);
  if (points.length < 2) return <Empty />;
  const w = 800;
  const h = 240;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full max-h-[18rem] min-h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Daily page views">
      <defs>
        <linearGradient id="anpFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#anpFill)" />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cart({ cart }: { cart: Data["cart"] }) {
  const rows = [
    { label: "Cart views", value: cart.views },
    { label: "Add to cart", value: cart.adds },
    { label: "Removed", value: cart.removes },
    { label: "Checkout started", value: cart.checkouts },
    { label: "Order requested", value: cart.orders },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-bold text-foreground">{n(r.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full [background:var(--gradient-wave)]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Devices({ devices }: { devices: Data["devices"] }) {
  if (devices.length === 0) return <Empty />;
  const total = Math.max(1, devices.reduce((a, b) => a + b.count, 0));
  return (
    <ul className="space-y-4">
      {[...devices]
        .sort((a, b) => b.count - a.count)
        .map((dev) => {
          const Icon = DEVICE_ICON[dev.device] ?? HelpCircle;
          const pct = Math.round((dev.count / total) * 100);
          return (
            <li key={dev.device} className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="w-20 text-sm font-medium capitalize text-foreground">
                {dev.device.toLowerCase()}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full [background:var(--gradient-wave)]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-12 text-right text-sm font-bold text-foreground">{pct}%</span>
            </li>
          );
        })}
    </ul>
  );
}

function TopList({ rows }: { rows: { label: string; value: number; mono?: boolean }[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <ul className="divide-y divide-border/70 text-sm">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 py-2.5">
          <span className={cn("min-w-0 truncate text-foreground/80", r.mono && "font-mono text-xs")}>
            {r.label}
          </span>
          <span className="shrink-0 font-bold text-foreground">{n(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Geography({
  regions,
  countries,
}: {
  regions: Data["topRegions"];
  countries: Data["topCountries"];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Top states / regions
        </p>
        <TopList rows={regions.map((r) => ({ label: r.country ? `${r.region} · ${r.country}` : r.region, value: r.visitors }))} />
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Top countries
        </p>
        <TopList rows={countries.map((c) => ({ label: c.country, value: c.visitors }))} />
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">No data yet.</p>;
}
