import Link from "next/link";
import { Users, Eye, Mail } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminCustomers } from "@/server/data/admin-cms";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminCard,
  Avatar,
  CountPill,
  EmptyState,
  Reveal,
  Th,
  Toolbar,
} from "@/components/admin/admin-ui";
import { DropdownMenu, DropdownLink } from "@/components/admin/dropdown-menu";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requirePermission("customer.read");
  const customers = await getAdminCustomers();

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Customers"
        description="Profiles, tags, and lifetime history."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All customers</h2>
          <CountPill>{customers.length}</CountPill>
        </div>
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              hint="Customers are created automatically from orders, bookings and quotes."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>Customer</Th>
                      <Th>Tags</Th>
                      <Th>Activity</Th>
                      <Th>Lifetime value</Th>
                      <Th>Joined</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {customers.map((c) => (
                      <tr key={c.id} className="group transition-colors hover:bg-primary-50/40">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/customers/${c.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar name={c.name} className="size-9" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground group-hover:text-primary">
                                {c.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {c.email}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex flex-wrap gap-1">
                            {c.crmTags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline">
                                {t}
                              </Badge>
                            ))}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-muted-foreground">
                          {c._count.orders}o · {c._count.bookings}b · {c._count.quotes}q
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {formatPrice(c.lifetimeValueCents, "en")}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {formatDate(c.createdAt, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownLink href={`/admin/customers/${c.id}`}>
                                <Eye className="size-4" /> Open profile
                              </DropdownLink>
                              <DropdownLink href={`mailto:${c.email}`}>
                                <Mail className="size-4" /> Email
                              </DropdownLink>
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
                {customers.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/customers/${c.id}`} className="block p-4 active:bg-primary-50/40">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} className="size-10" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-foreground">
                            {c.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {c.email}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-bold text-foreground">
                            {formatPrice(c.lifetimeValueCents, "en")}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {formatDate(c.createdAt, "en")}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {c.crmTags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {c._count.orders}o · {c._count.bookings}b · {c._count.quotes}q
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
