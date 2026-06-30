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
import { AdminCard, CountPill, EmptyState, Reveal, Th, Toolbar } from "@/components/admin/admin-ui";
import { SearchBox } from "@/components/admin/list-controls";

export const dynamic = "force-dynamic";

const dt = (d: Date) =>
  formatDate(d, "en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const DEVICE_ICON: Record<string, LucideIcon> = {
  BOT: Bot,
  MOBILE: Smartphone,
  TABLET: Tablet,
  DESKTOP: Monitor,
  UNKNOWN: Monitor,
};

function locationLabel(v: { city: string | null; region: string | null; country: string | null }) {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown location";
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const q = sp.q ?? "";
  const { visitors, total, pages } = await getVisitorsList({ page, q });

  const qs = (p: number) =>
    `/admin/analytics/visitors?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <Link
        href="/admin/analytics"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
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
          <h2 className="text-sm font-semibold text-foreground">Tracked visitors</h2>
          <CountPill>{total.toLocaleString("en-US")}</CountPill>
        </div>
        <SearchBox placeholder="Search location or visitor ID…" className="w-full sm:w-80" />
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
                  <thead className="border-b border-border bg-muted/50">
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
                  <tbody className="divide-y divide-border/70">
                    {visitors.map((v) => {
                      const Icon = DEVICE_ICON[v.device] ?? Monitor;
                      return (
                        <tr key={v.id} className="group transition-colors hover:bg-primary-50/40">
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/admin/analytics/visitors/${v.id}`}
                              className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                            >
                              #{v.visitorKey.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-2 text-foreground/80">
                              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                              {locationLabel(v)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                              <Icon className="size-3.5" />
                              {v.device.toLowerCase()}
                              {v.browser ? ` · ${v.browser}` : ""}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-foreground">
                            {v.visitCount}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-foreground">
                            {v.pageViewCount}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                            {dt(v.firstSeenAt)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                            {dt(v.lastSeenAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-border/70 md:hidden">
                {visitors.map((v) => {
                  const Icon = DEVICE_ICON[v.device] ?? Monitor;
                  return (
                    <li key={v.id}>
                      <Link href={`/admin/analytics/visitors/${v.id}`} className="block p-4 active:bg-primary-50/40">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary">
                            #{v.visitorKey.slice(0, 8)}
                          </span>
                          <span className="text-xs text-muted-foreground">{dt(v.lastSeenAt)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                          {locationLabel(v)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold capitalize">
                            <Icon className="size-3" />
                            {v.device.toLowerCase()}
                            {v.browser ? ` · ${v.browser}` : ""}
                          </span>
                          <span>{v.visitCount} sessions · {v.pageViewCount} views</span>
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
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3.5 py-2 font-semibold transition-colors hover:border-primary/40 hover:text-primary"
              >
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={qs(page + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3.5 py-2 font-semibold transition-colors hover:border-primary/40 hover:text-primary"
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
