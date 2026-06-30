import { requirePermission } from "@/lib/admin-auth";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, BackLink, Reveal } from "@/components/admin/admin-ui";
import { QuoteBuilder } from "@/components/admin/quote-builder";

export default async function NewQuotePage() {
  await requirePermission("quote.update");
  return (
    <div>
      <BackLink href="/admin/quotes">Quotes</BackLink>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Create a quote"
        description="Build a quote for a client, generate a branded PDF, and email it automatically."
      />
      <Reveal delay={0.05}>
        <AdminCard className="p-6 sm:p-8">
          <QuoteBuilder />
        </AdminCard>
      </Reveal>
    </div>
  );
}
