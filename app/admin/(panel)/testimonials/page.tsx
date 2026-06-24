import { requirePermission } from "@/lib/admin-auth";
import { getAdminTestimonials } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TestimonialButtons } from "@/components/admin/moderation-buttons";

export default async function AdminTestimonialsPage() {
  await requirePermission("testimonial.moderate");
  const items = await getAdminTestimonials();

  return (
    <div>
      <AdminPageHeader title="Testimonials" description="Approve, reject, and feature customer testimonials." />
      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No testimonials yet.</Card>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.authorName}</span>
                      <Stars rating={t.rating} size="size-3.5" />
                      <StatusBadge status={t.status} locale="en" />
                      {t.featured ? <span className="text-xs font-semibold text-primary">★ Featured</span> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[t.authorRole, t.organization].filter(Boolean).join(" · ")} · {formatDate(t.createdAt, "en")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">“{getLocalized(t.quote, "en")}”</p>
                  </div>
                  <TestimonialButtons id={t.id} status={t.status} featured={t.featured} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
