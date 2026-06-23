import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSignature } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminBooking } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/account/status-badge";
import { BookingControls } from "@/components/admin/booking-controls";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBookingDetail({ params }: Props) {
  await requirePermission("booking.read");
  const { id } = await params;
  const booking = await getAdminBooking(id);
  if (!booking) notFound();

  const address = (booking.eventAddress as { address?: string; city?: string } | null) ?? {};

  return (
    <div>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" /> Bookings
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{booking.bookingNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.eventStartDate, "en")} – {formatDate(booking.eventEndDate, "en")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{booking.holdType} hold</span>
          <StatusBadge status={booking.status} locale="en" />
          <StatusBadge status={booking.paymentStatus} locale="en" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Equipment</h2>
            <ul className="divide-y divide-border text-sm">
              {booking.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2.5">
                  <span>{item.name} · {item.days} day(s)</span>
                  <span className="font-medium">{formatPrice(item.lineTotalCents, "en")}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{formatPrice(booking.deliveryFeeCents, "en")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Pickup</dt><dd>{formatPrice(booking.pickupFeeCents, "en")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Deposit</dt><dd>{formatPrice(booking.depositCents, "en")}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Total</dt><dd className="text-primary">{formatPrice(booking.totalCents, "en")}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Event & customer</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Name</dt><dd>{booking.guestName ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd>{booking.guestEmail ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{booking.guestPhone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Event type</dt><dd>{booking.eventType ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Headcount</dt><dd>{booking.headcount ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Surface</dt><dd>{booking.surfaceType ?? "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{[address.address, address.city].filter(Boolean).join(", ") || "—"}</dd></div>
            </dl>
            {booking.notes ? (
              <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm text-muted-foreground">{booking.notes}</p>
            ) : null}
            {booking.contract ? (
              <Link
                href={`/contract/${booking.contract.contractNumber}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <FileSignature className="size-4" />
                Contract {booking.contract.contractNumber} ({booking.contract.status})
              </Link>
            ) : null}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">Manage</h2>
          <BookingControls
            id={booking.id}
            status={booking.status}
            paymentStatus={booking.paymentStatus}
            invoiceNote={booking.invoiceNote}
          />
        </Card>
      </div>
    </div>
  );
}
