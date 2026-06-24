import Link from "next/link";
import { ArrowLeft, MapPin, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getVisitorsList } from "@/server/data/analytics";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

const dt = (d: Date) =>
  formatDate(d, "en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

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
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Analytics
      </Link>
      <AdminPageHeader
        title="Visitors"
        description={`${total.toLocaleString("en-US")} tracked ${total === 1 ? "visitor" : "visitors"}. Each has a unique ID and a full movement timeline.`}
      />

      <form method="get" className="mb-4 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by location or visitor ID…"
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      <Card className="overflow-hidden p-0">
        {visitors.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No visitors yet. Traffic will appear here once the site is live.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Visitor</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 text-right font-semibold">Sessions</th>
                  <th className="px-4 py-3 text-right font-semibold">Views</th>
                  <th className="px-4 py-3 font-semibold">First seen</th>
                  <th className="px-4 py-3 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visitors.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/analytics/visitors/${v.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        #{v.visitorKey.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        {locationLabel(v)}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {v.device.toLowerCase()}
                      {v.browser ? ` · ${v.browser}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{v.visitCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">{v.pageViewCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(v.firstSeenAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dt(v.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={qs(page - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 hover:bg-muted"
              >
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={qs(page + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 hover:bg-muted"
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
