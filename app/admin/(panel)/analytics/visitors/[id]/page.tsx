import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  LogOut,
  ShoppingCart,
  Trash2,
  CreditCard,
  PackageCheck,
  CalendarCheck,
  FileText,
  Mail,
  Activity,
  Clock,
} from "lucide-react";
import type { AnalyticsEventType } from "@prisma/client";
import { getVisitorDetail } from "@/server/data/analytics";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

const time = (d: Date) =>
  formatDate(d, "en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTime = (d: Date) =>
  formatDate(d, "en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const EVENT_META: Record<
  AnalyticsEventType,
  { icon: typeof Eye; label: string; color: string }
> = {
  PAGE_VIEW: { icon: Eye, label: "Viewed page", color: "text-sky-600 bg-sky-50" },
  PAGE_LEAVE: { icon: LogOut, label: "Left page", color: "text-slate-500 bg-slate-100" },
  SESSION_START: { icon: Activity, label: "Session start", color: "text-slate-500 bg-slate-100" },
  ADD_TO_CART: { icon: ShoppingCart, label: "Added to cart", color: "text-emerald-600 bg-emerald-50" },
  REMOVE_FROM_CART: { icon: Trash2, label: "Removed from cart", color: "text-red-600 bg-red-50" },
  CART_VIEW: { icon: ShoppingCart, label: "Viewed cart", color: "text-amber-600 bg-amber-50" },
  CHECKOUT_START: { icon: CreditCard, label: "Started checkout", color: "text-violet-600 bg-violet-50" },
  ORDER_REQUEST: { icon: PackageCheck, label: "Requested an order", color: "text-emerald-700 bg-emerald-50" },
  BOOKING_REQUEST: { icon: CalendarCheck, label: "Requested a booking", color: "text-emerald-700 bg-emerald-50" },
  QUOTE_REQUEST: { icon: FileText, label: "Requested a quote", color: "text-blue-600 bg-blue-50" },
  CONTACT: { icon: Mail, label: "Sent a message", color: "text-blue-600 bg-blue-50" },
};

function metaSummary(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const bits: string[] = [];
  if (typeof m.productName === "string") bits.push(m.productName);
  if (typeof m.quantity === "number") bits.push(`×${m.quantity}`);
  if (typeof m.orderNumber === "string") bits.push(m.orderNumber);
  if (typeof m.itemCount === "number" && !m.productName) bits.push(`${m.itemCount} item(s)`);
  return bits.length ? bits.join(" ") : null;
}

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visitor = await getVisitorDetail(id);
  if (!visitor) notFound();

  const location =
    [visitor.city, visitor.region, visitor.country].filter(Boolean).join(", ") ||
    "Unknown location";

  const info = [
    { label: "Country", value: visitor.country ?? "—" },
    { label: "State / region", value: visitor.region ?? "—" },
    { label: "City", value: visitor.city ?? "—" },
    { label: "Device", value: `${visitor.device.toLowerCase()}${visitor.os ? ` · ${visitor.os}` : ""}` },
    { label: "Browser", value: visitor.browser ?? "—" },
    { label: "Landing page", value: visitor.landingPath ?? "—" },
    { label: "First referrer", value: visitor.firstReferrer ?? "Direct / none" },
    { label: "Sessions", value: String(visitor.visitCount) },
    { label: "Page views", value: String(visitor.pageViewCount) },
  ];

  return (
    <div>
      <Link
        href="/admin/analytics/visitors"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Visitors
      </Link>
      <AdminPageHeader
        title={`Visitor #${visitor.visitorKey.slice(0, 8)}`}
        description={`📍 ${location}`}
      />

      {/* Profile */}
      <Card className="p-5">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((i) => (
            <div key={i.label}>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{i.label}</dt>
              <dd className="mt-0.5 truncate font-medium">{i.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Unique ID: <span className="font-mono">{visitor.visitorKey}</span></span>
          <span>First seen: {dateTime(visitor.firstSeenAt)}</span>
          <span>Last seen: {dateTime(visitor.lastSeenAt)}</span>
        </div>
      </Card>

      {/* Movement timeline, grouped by session */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Movement timeline</h2>
      {visitor.visits.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No sessions recorded for this visitor.
        </Card>
      ) : (
        <div className="space-y-5">
          {visitor.visits.map((visit, idx) => {
            const arrived = visit.startedAt;
            const left = visit.endedAt ?? visit.lastSeenAt;
            return (
              <Card key={visit.id} className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    Session {visitor.visits.length - idx}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> Arrived {time(arrived)}
                    </span>
                    <span className="flex items-center gap-1">
                      <LogOut className="size-3.5" /> Left {time(left)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                      {formatDuration(visit.durationMs)} on site
                    </span>
                    <span>{dateTime(arrived)}</span>
                  </div>
                </div>

                <ol className="relative space-y-0 border-l border-border pl-6">
                  {visit.events.map((ev) => {
                    const m = EVENT_META[ev.type];
                    const Icon = m.icon;
                    const summary = metaSummary(ev.meta);
                    return (
                      <li key={ev.id} className="relative pb-4 last:pb-0">
                        <span
                          className={`absolute -left-[31px] grid size-6 place-items-center rounded-full ${m.color}`}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm">
                            <span className="font-medium">{m.label}</span>
                            {ev.path ? (
                              <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                                {ev.path}
                              </span>
                            ) : null}
                            {summary ? (
                              <span className="ml-1.5 text-xs text-primary">{summary}</span>
                            ) : null}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {time(ev.createdAt)}
                            {ev.type === "PAGE_LEAVE" && ev.durationMs
                              ? ` · ${formatDuration(ev.durationMs)} on page`
                              : ""}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
