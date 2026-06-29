import Link from "next/link";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminQuotes } from "@/server/data/admin";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";

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
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
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

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {quotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/quotes/${q.id}`} className="block p-4 active:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-semibold text-primary">{q.quoteNumber}</span>
                      <StatusBadge status={q.status} locale="en" />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{q.guestName ?? "—"}</span>
                        <span className="block truncate text-xs text-muted-foreground">{q.guestEmail}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-muted-foreground">
                        <span className="block">{q.context}</span>
                        <span className="block">{formatDate(q.createdAt, "en")}</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
