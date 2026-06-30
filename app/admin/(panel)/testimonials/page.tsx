import { MessageSquareQuote } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminTestimonials } from "@/server/data/admin-cms";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/ui/stars";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TestimonialButtons } from "@/components/admin/moderation-buttons";
import { AdminCard, Avatar, CountPill, EmptyState, Reveal, Toolbar } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  await requirePermission("testimonial.moderate");
  const items = await getAdminTestimonials();

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM & comms"
        title="Testimonials"
        description="Approve, reject, and feature customer testimonials."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All testimonials</h2>
          <CountPill>{items.length}</CountPill>
        </div>
      </Toolbar>

      {items.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={MessageSquareQuote}
            title="No testimonials yet"
            hint="Submitted testimonials will appear here for moderation."
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={Math.min(i * 0.04, 0.3)}>
              <AdminCard hover className="h-full p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={t.authorName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{t.authorName}</span>
                      <Stars rating={t.rating} size="size-3.5" />
                      <StatusBadge status={t.status} locale="en" />
                      {t.featured ? (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary">
                          ★ Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[t.authorRole, t.organization].filter(Boolean).join(" · ")}
                      {t.authorRole || t.organization ? " · " : ""}
                      {formatDate(t.createdAt, "en")}
                    </p>
                    <p className="mt-2 text-sm italic leading-relaxed text-foreground/80">
                      “{getLocalized(t.quote, "en")}”
                    </p>
                    <div className="mt-3.5">
                      <TestimonialButtons id={t.id} status={t.status} featured={t.featured} />
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
