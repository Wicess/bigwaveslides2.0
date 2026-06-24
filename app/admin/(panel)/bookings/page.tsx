import Link from "next/link";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminBookings } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminBookingsPage() {
  await requirePermission("booking.read");
  const bookings = await getAdminBookings();

  return (
    <div>
      <AdminPageHeader title="Bookings" description="Rental booking requests and holds." />
      <Card className="overflow-hidden">
        {bookings.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Hold</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="font-mono font-semibold text-primary">
                        {b.bookingNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{b.guestName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(b.eventStartDate, "en")} – {formatDate(b.eventEndDate, "en")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-muted-foreground">{b.holdType}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(b.totalCents, "en")}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} locale="en" /></td>
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
