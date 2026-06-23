import Link from "next/link";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminQuotes } from "@/server/data/admin";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/account/status-badge";

export default async function AdminQuotesPage() {
  await requirePermission("quote.read");
  const quotes = await getAdminQuotes();

  return (
    <div>
      <AdminPageHeader title="Quotes" description="General, product, and service quote requests." />
      <Card className="overflow-hidden">
        {quotes.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No quotes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/quotes/${q.id}`} className="font-mono font-semibold text-primary">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{q.guestName ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{q.guestEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{q.context}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(q.createdAt, "en")}</td>
                    <td className="px-4 py-3"><StatusBadge status={q.status} locale="en" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
