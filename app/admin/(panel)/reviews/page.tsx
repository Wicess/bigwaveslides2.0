import { requirePermission } from "@/lib/admin-auth";
import { getAdminReviews } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/account/status-badge";
import { ReviewButtons } from "@/components/admin/moderation-buttons";

export default async function AdminReviewsPage() {
  await requirePermission("review.moderate");
  const reviews = await getAdminReviews();

  return (
    <div>
      <AdminPageHeader title="Reviews" description="Approve or reject product reviews." />
      {reviews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.authorName}</span>
                      <Stars rating={r.rating} size="size-3.5" />
                      <StatusBadge status={r.status} locale="en" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getLocalized(r.product.name, "en")} · {formatDate(r.createdAt, "en")}
                    </p>
                    {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
                    <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  </div>
                  <ReviewButtons id={r.id} status={r.status} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
