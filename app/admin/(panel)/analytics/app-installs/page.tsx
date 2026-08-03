import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Bot,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { getAppInstalls } from "@/server/data/analytics";
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

export const dynamic = "force-dynamic";

const dt = (d: Date) =>
  formatDate(d, "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

export default async function AppInstallsPage() {
  const { installs, total } = await getAppInstalls(300);

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
        title="App installs"
        description="Everyone who installed the Big Wave Slides app (PWA), with the location and IP address they installed from. Installers earn the extra 5% app discount at checkout."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">
            Total installs
          </h2>
          <CountPill>{total.toLocaleString("en-US")}</CountPill>
        </div>
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {installs.length === 0 ? (
            <EmptyState
              icon={Download}
              title="No app installs yet"
              hint="Installs appear here the moment someone adds the app to their home screen."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-border bg-muted/50 border-b">
                    <tr>
                      <Th>Installed</Th>
                      <Th>Location</Th>
                      <Th>IP address</Th>
                      <Th>Device</Th>
                      <Th>Visitor</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/70 divide-y">
                    {installs.map((i) => {
                      const Icon =
                        DEVICE_ICON[i.device ?? "UNKNOWN"] ?? Monitor;
                      return (
                        <tr key={i.id} className="hover:bg-primary-50/40">
                          <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                            {dt(i.createdAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-foreground/80 flex items-center gap-2">
                              <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                              {locationLabel(i)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="bg-muted text-foreground/80 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs">
                              <Globe className="text-muted-foreground size-3.5" />
                              {i.ip ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize">
                              <Icon className="size-3.5" />
                              {(i.device ?? "unknown").toLowerCase()}
                              {i.os ? ` · ${i.os}` : ""}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {i.visitorId ? (
                              <Link
                                href={`/admin/analytics/visitors/${i.visitorId}`}
                                className="text-primary text-xs font-semibold hover:underline"
                              >
                                View journey
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-border/70 divide-y md:hidden">
                {installs.map((i) => {
                  const Icon = DEVICE_ICON[i.device ?? "UNKNOWN"] ?? Monitor;
                  return (
                    <li key={i.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-foreground/80 flex items-center gap-2 text-sm">
                          <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                          {locationLabel(i)}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {dt(i.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-muted inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono">
                          <Globe className="size-3" />
                          {i.ip ?? "—"}
                        </span>
                        <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold capitalize">
                          <Icon className="size-3" />
                          {(i.device ?? "unknown").toLowerCase()}
                          {i.os ? ` · ${i.os}` : ""}
                        </span>
                        {i.visitorId ? (
                          <Link
                            href={`/admin/analytics/visitors/${i.visitorId}`}
                            className="text-primary font-semibold hover:underline"
                          >
                            View journey
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </AdminCard>
      </Reveal>
    </div>
  );
}
