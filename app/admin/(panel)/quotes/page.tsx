import Link from "next/link";
import { Plus, FileText, Eye, Mail } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminQuotes } from "@/server/data/admin";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  AdminCard,
  Avatar,
  CountPill,
  EmptyState,
  Reveal,
  Th,
  Toolbar,
} from "@/components/admin/admin-ui";
import { FilterSelect } from "@/components/admin/list-controls";
import { DropdownMenu, DropdownLink } from "@/components/admin/dropdown-menu";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminQuotesPage({ searchParams }: Props) {
  await requirePermission("quote.read");
  const { status } = await searchParams;
  const all = await getAdminQuotes();
  const quotes = all.filter((q) => !status || q.status === status);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Quotes"
        description="General, product, and service quote requests."
        action={
          <Button asChild size="sm" variant="gradient">
            <Link href="/admin/quotes/new">
              <Plus className="size-4" /> New quote
            </Link>
          </Button>
        }
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All quotes</h2>
          <CountPill>{quotes.length}</CountPill>
        </div>
        <FilterSelect
          name="status"
          placeholder="Any status"
          className="w-full sm:w-48"
          options={[
            { value: "NEW", label: "New" },
            { value: "REVIEWED", label: "Reviewed" },
            { value: "QUOTED", label: "Quoted" },
            { value: "WON", label: "Won" },
            { value: "LOST", label: "Lost" },
          ]}
        />
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quotes found"
              hint="Quote requests from the storefront will appear here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>Quote</Th>
                      <Th>Customer</Th>
                      <Th>Context</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {quotes.map((q) => (
                      <tr key={q.id} className="group transition-colors hover:bg-primary-50/40">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/quotes/${q.id}`}
                            className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                          >
                            {q.quoteNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar name={q.guestName ?? q.guestEmail} className="size-9" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">
                                {q.guestName ?? "—"}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {q.guestEmail}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            {q.context}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {formatDate(q.createdAt, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={q.status} locale="en" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownLink href={`/admin/quotes/${q.id}`}>
                                <Eye className="size-4" /> Open quote
                              </DropdownLink>
                              {q.guestEmail ? (
                                <DropdownLink href={`mailto:${q.guestEmail}`}>
                                  <Mail className="size-4" /> Email customer
                                </DropdownLink>
                              ) : null}
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-border/70 md:hidden">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/quotes/${q.id}`} className="block p-4 active:bg-primary-50/40">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary">
                          {q.quoteNumber}
                        </span>
                        <StatusBadge status={q.status} locale="en" />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar name={q.guestName ?? q.guestEmail} className="size-9" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {q.guestName ?? "—"}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {q.guestEmail}
                          </span>
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
        </AdminCard>
      </Reveal>
    </div>
  );
}
