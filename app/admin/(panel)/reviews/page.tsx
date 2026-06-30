import { Star } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminReviews } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/ui/stars";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ReviewButtons } from "@/components/admin/moderation-buttons";
import { AdminCard, Avatar, CountPill, EmptyState, Reveal, Toolbar } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requirePermission("review.moderate");
  const reviews = await getAdminReviews();

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM & comms"
        title="Reviews"
        description="Approve or reject product reviews."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Pending &amp; recent</h2>
          <CountPill>{reviews.length}</CountPill>
        </div>
      </Toolbar>

      {reviews.length === 0 ? (
        <AdminCard>
          <EmptyState icon={Star} title="No reviews yet" hint="Customer reviews awaiting moderation will show here." />
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={Math.min(i * 0.04, 0.3)}>
              <AdminCard hover className="h-full p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={r.authorName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{r.authorName}</span>
                      <Stars rating={r.rating} size="size-3.5" />
                      <StatusBadge status={r.status} locale="en" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {getLocalized(r.product.name, "en")} · {formatDate(r.createdAt, "en")}
                    </p>
                    {r.title ? <p className="mt-2 font-semibold text-foreground">{r.title}</p> : null}
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">{r.body}</p>
                    <div className="mt-3.5">
                      <ReviewButtons id={r.id} status={r.status} />
                    </div>
                  </div>
                </div>
              </AdminCard>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
