import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  Bot,
  Smartphone,
  Tablet,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { getVisitorsList } from "@/server/data/analytics";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  CountPill,
  EmptyState,
  Reveal,
  Th,
  Toolbar,
} from "@/components/admin/admin-ui";
import { SearchBox } from "@/components/admin/list-controls";

export const dynamic = "force-dynamic";

const dt = (d: Date) =>
  formatDate(d, "en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const DEVICE_ICON: Record<string, LucideIcon> = {
  BOT: Bot,
  MOBILE: Smartphone,
  TABLET: Tablet,
  DESKTOP: Monitor,
  UNKNOWN: Monitor,
};

function locationLabel(v: {
  city: string | null;
  region: string | null;
  country: string | null;
}) {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown location";
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; bots?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const q = sp.q ?? "";
  const includeBots = sp.bots === "1";
  const { visitors, total, pages } = await getVisitorsList({
    page,
    q,
    includeBots,
  });

  const botParam = includeBots ? "&bots=1" : "";
  const qs = (p: number) =>
    `/admin/analytics/visitors?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}${botParam}`;

  return (
    <div>
      <Link
        href="/admin/analytics"
        className="text-primary mb-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" /> Analytics
      </Link>
      <AdminPageHeader
        eyebrow="Insights"
        title="Visitors"
        description="Every tracked visitor with a unique ID and full movement timeline."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            {includeBots ? "All visitors" : "Human visitors"}
          </h2>
          <CountPill>{total.toLocaleString("en-US")}</CountPill>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/analytics/visitors${includeBots ? "" : "?bots=1"}`}
            className="border-border text-foreground/70 hover:border-primary/40 hover:text-primary inline-flex h-10 items-center gap-1.5 rounded-full border bg-white px-3.5 text-sm font-semibold transition-colors"
          >
            <Bot className="size-4" /> {includeBots ? "Hide bots" : "Show bots"}
          </Link>
          <SearchBox
            placeholder="Search location or visitor ID…"
            className="w-full sm:w-72"
          />
        </div>
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {visitors.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No visitors yet"
              hint="Traffic appears here once the site is live and people browse."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-border bg-muted/50 border-b">
                    <tr>
                      <Th>Visitor</Th>
                      <Th>Location</Th>
                      <Th>Device</Th>
                      <Th className="text-right">Sessions</Th>
                      <Th className="text-right">Views</Th>
                      <Th>First seen</Th>
                      <Th>Last seen</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/70 divide-y">
                    {visitors.map((v) => {
                      const Icon = DEVICE_ICON[v.device] ?? Monitor;
                      return (
                        <tr
                          key={v.id}
                          className="group hover:bg-primary-50/40 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/analytics/visitors/${v.id}`}
                              className="bg-muted text-primary group-hover:bg-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold transition-colors group-hover:text-white"
                            >
                              #{v.visitorKey.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-foreground/80 flex items-center gap-2">
                              <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                              {locationLabel(v)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize">
                              <Icon className="size-3.5" />
                              {v.device.toLowerCase()}
                              {v.browser ? ` · ${v.browser}` : ""}
                            </span>
                          </td>
                          <td className="text-foreground px-5 py-3.5 text-right font-bold">
                            {v.visitCount}
                          </td>
                          <td className="text-foreground px-5 py-3.5 text-right font-bold">
                            {v.pageViewCount}
                          </td>
                          <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                            {dt(v.firstSeenAt)}
                          </td>
                          <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                            {dt(v.lastSeenAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-border/70 divide-y md:hidden">
                {visitors.map((v) => {
                  const Icon = DEVICE_ICON[v.device] ?? Monitor;
                  return (
                    <li key={v.id}>
                      <Link
                        href={`/admin/analytics/visitors/${v.id}`}
                        className="active:bg-primary-50/40 block p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="bg-muted text-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold">
                            #{v.visitorKey.slice(0, 8)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {dt(v.lastSeenAt)}
                          </span>
                        </div>
                        <div className="text-foreground/80 mt-2 flex items-center gap-2 text-sm">
                          <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                          {locationLabel(v)}
                        </div>
                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold capitalize">
                            <Icon className="size-3" />
                            {v.device.toLowerCase()}
                            {v.browser ? ` · ${v.browser}` : ""}
                          </span>
                          <span>
                            {v.visitCount} sessions · {v.pageViewCount} views
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </AdminCard>
      </Reveal>

      {pages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={qs(page - 1)}
                className="border-border hover:border-primary/40 hover:text-primary inline-flex items-center gap-1 rounded-full border bg-white px-3.5 py-2 font-semibold transition-colors"
              >
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={qs(page + 1)}
                className="border-border hover:border-primary/40 hover:text-primary inline-flex items-center gap-1 rounded-full border bg-white px-3.5 py-2 font-semibold transition-colors"
              >
                Next <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
