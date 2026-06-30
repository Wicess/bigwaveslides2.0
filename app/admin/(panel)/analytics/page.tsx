import Link from "next/link";
import { Users, MousePointerClick, Eye, ShoppingCart } from "lucide-react";
import { getAnalyticsOverview } from "@/server/data/analytics";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatTile, Reveal } from "@/components/admin/admin-ui";
import { AnalyticsPanels } from "@/components/admin/analytics-panels";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("en-US");

export default async function AnalyticsPage() {
  const d = await getAnalyticsOverview(30);

  const kpis = [
    { label: "Visitors", value: n(d.visitors), today: d.visitorsToday, icon: Users },
    { label: "Sessions", value: n(d.visits), today: d.visitsToday, icon: MousePointerClick },
    { label: "Page views", value: n(d.pageViews), today: d.pageViewsToday, icon: Eye },
    { label: "Orders from cart", value: n(d.cart.orders), today: undefined, icon: ShoppingCart },
  ];

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
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
      <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Switchable detail panel — keeps everything on one screen */}
      <Reveal delay={0.12} className="min-h-0 flex-1">
        <div className="h-full">
          <AnalyticsPanels
            series={d.series}
            cart={d.cart}
            devices={d.devices}
            topPages={d.topPages}
            topRegions={d.topRegions}
            topCountries={d.topCountries}
          />
        </div>
      </Reveal>
    </div>
  );
}
