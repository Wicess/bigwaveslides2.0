import Link from "next/link";
import { ShoppingCart, Eye, Mail, Trash2 } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminOrders } from "@/server/data/admin";
import { deleteOrder } from "@/server/actions/admin-orders";
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
import {
  DropdownMenu,
  DropdownLink,
  DropdownSeparator,
  DeleteMenuItem,
} from "@/components/admin/dropdown-menu";

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
    (o) =>
      (!status || o.status === status) &&
      (!payment || o.paymentStatus === payment),
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
          <h2 className="text-foreground text-sm font-semibold">All orders</h2>
          <CountPill>{orders.length}</CountPill>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <FilterSelect
            name="status"
            options={STATUS_OPTIONS}
            placeholder="Any status"
          />
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
                  <thead className="border-border bg-muted/50 border-b">
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
                  <tbody className="divide-border/70 divide-y">
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="group hover:bg-primary-50/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="bg-muted text-primary group-hover:bg-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold transition-colors group-hover:text-white"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar
                              name={o.guestName ?? o.guestEmail}
                              className="size-9"
                            />
                            <span className="min-w-0">
                              <span className="text-foreground block truncate font-semibold">
                                {o.guestName ?? "—"}
                              </span>
                              <span className="text-muted-foreground block truncate text-xs">
                                {o.guestEmail}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="text-muted-foreground px-5 py-3.5 whitespace-nowrap">
                          {formatDate(o.createdAt, "en")}
                        </td>
                        <td className="text-foreground px-5 py-3.5 font-bold">
                          {formatPrice(o.totalCents, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={o.paymentStatus} />
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
                              <DropdownSeparator />
                              <DeleteMenuItem
                                action={deleteOrder.bind(null, o.id)}
                                confirm={`Delete order ${o.orderNumber}? This permanently removes it and cannot be undone.`}
                              >
                                <Trash2 className="size-4" /> Delete order
                              </DeleteMenuItem>
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
                {orders.map((o) => (
                  <li key={o.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="bg-muted text-primary inline-flex rounded-lg px-2 py-1 font-mono text-xs font-bold"
                      >
                        {o.orderNumber}
                      </Link>
                      <span className="text-foreground font-bold">
                        {formatPrice(o.totalCents, "en")}
                      </span>
                    </div>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="mt-3 flex items-center gap-3"
                    >
                      <Avatar
                        name={o.guestName ?? o.guestEmail}
                        className="size-9"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block truncate text-sm font-semibold">
                          {o.guestName ?? "—"}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {o.guestEmail}
                        </span>
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {formatDate(o.createdAt, "en")}
                      </span>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={o.status} />
                      <StatusBadge status={o.paymentStatus} />
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
