import Link from "next/link";
import { ShoppingCart, Eye, Mail } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrders } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
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

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

type Props = { searchParams: Promise<{ status?: string; payment?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requirePermission("order.read");
  const { status, payment } = await searchParams;
  const all = await getAdminOrders();
  const orders = all.filter(
    (o) => (!status || o.status === status) && (!payment || o.paymentStatus === payment),
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Request-based product orders."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All orders</h2>
          <CountPill>{orders.length}</CountPill>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <FilterSelect name="status" options={STATUS_OPTIONS} placeholder="Any status" />
          <FilterSelect
            name="payment"
            placeholder="Any payment"
            options={[
              { value: "PENDING", label: "Unpaid" },
              { value: "INVOICE_SENT", label: "Invoice sent" },
              { value: "DEPOSIT_PAID", label: "Deposit paid" },
              { value: "PAID_IN_FULL", label: "Paid in full" },
            ]}
          />
        </div>
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders found"
              hint="When customers request products, their orders show up here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Date</Th>
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th>Payment</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {orders.map((o) => (
                      <tr key={o.id} className="group transition-colors hover:bg-primary-50/40">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar name={o.guestName ?? o.guestEmail} className="size-9" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">
                                {o.guestName ?? "—"}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {o.guestEmail}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {formatDate(o.createdAt, "en")}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {formatPrice(o.totalCents, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={o.status} locale="en" />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={o.paymentStatus} locale="en" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownLink href={`/admin/orders/${o.id}`}>
                                <Eye className="size-4" /> Open order
                              </DropdownLink>
                              {o.guestEmail ? (
                                <DropdownLink href={`mailto:${o.guestEmail}`}>
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
                {orders.map((o) => (
                  <li key={o.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary"
                      >
                        {o.orderNumber}
                      </Link>
                      <span className="font-bold text-foreground">
                        {formatPrice(o.totalCents, "en")}
                      </span>
                    </div>
                    <Link href={`/admin/orders/${o.id}`} className="mt-3 flex items-center gap-3">
                      <Avatar name={o.guestName ?? o.guestEmail} className="size-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {o.guestName ?? "—"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.guestEmail}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(o.createdAt, "en")}
                      </span>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={o.status} locale="en" />
                      <StatusBadge status={o.paymentStatus} locale="en" />
                    </div>
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
