import { requirePermission } from "@/lib/admin-auth";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { QuoteBuilder } from "@/components/admin/quote-builder";

export default async function NewQuotePage() {
  await requirePermission("quote.update");
  return (
    <div>
      <AdminPageHeader
        title="Create a quote"
        description="Build a quote for a client, generate a branded PDF, and email it automatically."
      />
      <Card className="p-5 sm:p-6">
        <QuoteBuilder />
      </Card>
    </div>
  );
}
