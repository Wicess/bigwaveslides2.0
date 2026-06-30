import Link from "next/link";
import { CalendarCheck, Eye } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminBookings } from "@/server/data/admin";
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
  { value: "REQUESTED", label: "Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminBookingsPage({ searchParams }: Props) {
  await requirePermission("booking.read");
  const { status } = await searchParams;
  const all = await getAdminBookings();
  const bookings = all.filter((b) => !status || b.status === status);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Bookings"
        description="Rental booking requests and holds."
      />

      <Toolbar>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All bookings</h2>
          <CountPill>{bookings.length}</CountPill>
        </div>
        <FilterSelect
          name="status"
          options={STATUS_OPTIONS}
          placeholder="Any status"
          className="w-full sm:w-48"
        />
      </Toolbar>

      <Reveal delay={0.05}>
        <AdminCard className="overflow-hidden">
          {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No bookings found"
              hint="Rental booking requests from the storefront will appear here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <Th>Booking</Th>
                      <Th>Customer</Th>
                      <Th>Event dates</Th>
                      <Th>Hold</Th>
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {bookings.map((b) => (
                      <tr key={b.id} className="group transition-colors hover:bg-primary-50/40">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                          >
                            {b.bookingNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-3">
                            <Avatar name={b.guestName} className="size-9" />
                            <span className="font-semibold text-foreground">
                              {b.guestName ?? "—"}
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                          {formatDate(b.eventStartDate, "en")} – {formatDate(b.eventEndDate, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            {b.holdType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          {formatPrice(b.totalCents, "en")}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={b.status} locale="en" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownLink href={`/admin/bookings/${b.id}`}>
                                <Eye className="size-4" /> Open booking
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
                {bookings.map((b) => (
                  <li key={b.id}>
                    <Link href={`/admin/bookings/${b.id}`} className="block p-4 active:bg-primary-50/40">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-primary">
                          {b.bookingNumber}
                        </span>
                        <span className="font-bold text-foreground">
                          {formatPrice(b.totalCents, "en")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar name={b.guestName} className="size-9" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {b.guestName ?? "—"}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {formatDate(b.eventStartDate, "en")} – {formatDate(b.eventEndDate, "en")}
                          </span>
                        </span>
                        <StatusBadge status={b.status} locale="en" />
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
