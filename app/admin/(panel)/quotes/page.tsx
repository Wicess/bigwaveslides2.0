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
          <h2 className="text-foreground text-sm font-semibold">All quotes</h2>
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
                  <thead className="border-border bg-muted/50 border-b">
                    <tr>
                      <Th>Quote</Th>
                      <Th>Customer</Th>
                      <Th>Context</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/70 divide-y">
                    {quotes.map((q) => (
                      <tr
                        key={q.id}
                        className="group hover:bg-primary-50/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/quotes/${q.id}`}
                            className="bg-muted text-primary group-hover:bg-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold transition-colors group-hover:text-white"
                          >
                            {q.quoteNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar
                              name={q.guestName ?? q.guestEmail}
                              className="size-9"
                            />
                            <span className="min-w-0">
                              <span className="text-foreground block truncate font-semibold">
                                {q.guestName ?? "—"}
                              </span>
                              <span className="text-muted-foreground block truncate text-xs">
                                {q.guestEmail}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-semibold">
                            {q.context}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                          {formatDate(q.createdAt, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={q.status} />
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
              <ul className="divide-border/70 divide-y md:hidden">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/admin/quotes/${q.id}`}
                      className="active:bg-primary-50/40 block p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="bg-muted text-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold">
                          {q.quoteNumber}
                        </span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar
                          name={q.guestName ?? q.guestEmail}
                          className="size-9"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-sm font-semibold">
                            {q.guestName ?? "—"}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {q.guestEmail}
                          </span>
                        </span>
                        <span className="text-muted-foreground shrink-0 text-right text-xs">
                          <span className="block">{q.context}</span>
                          <span className="block">
                            {formatDate(q.createdAt, "en")}
                          </span>
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
