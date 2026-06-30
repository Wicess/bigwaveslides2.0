import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSignature, Package, CalendarCheck, Settings } from "lucide-react";
import { requirePermission } from "@/lib/admin-auth";
import { getAdminBooking } from "@/server/data/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import { BookingControls } from "@/components/admin/booking-controls";
import { AdminCard, BackLink, Reveal, SectionTitle } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBookingDetail({ params }: Props) {
  await requirePermission("booking.read");
  const { id } = await params;
  const booking = await getAdminBooking(id);
  if (!booking) notFound();

  const address = (booking.eventAddress as { address?: string; city?: string } | null) ?? {};

  return (
    <div>
      <BackLink href="/admin/bookings">Bookings</BackLink>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground">{booking.bookingNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(booking.eventStartDate, "en")} – {formatDate(booking.eventEndDate, "en")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {booking.holdType} hold
            </span>
            <StatusBadge status={booking.status} locale="en" />
            <StatusBadge status={booking.paymentStatus} locale="en" />
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Reveal delay={0.05}>
            <AdminCard className="p-6">
              <SectionTitle icon={Package}>Equipment</SectionTitle>
              <ul className="divide-y divide-border/70 text-sm">
                {booking.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-2.5">
                    <span className="text-foreground/80">
                      {item.name} <span className="text-muted-foreground">· {item.days} day(s)</span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(item.lineTotalCents, "en")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                <FeeRow label="Delivery" value={formatPrice(booking.deliveryFeeCents, "en")} />
                <FeeRow label="Pickup" value={formatPrice(booking.pickupFeeCents, "en")} />
                <FeeRow label="Deposit" value={formatPrice(booking.depositCents, "en")} />
                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {formatPrice(booking.totalCents, "en")}
                  </span>
                </div>
              </div>
            </AdminCard>
          </Reveal>

          <Reveal delay={0.1}>
            <AdminCard className="p-6">
              <SectionTitle icon={CalendarCheck}>Event &amp; customer</SectionTitle>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Name" value={booking.guestName ?? "—"} />
                <Field label="Email" value={booking.guestEmail ?? "—"} />
                <Field label="Phone" value={booking.guestPhone ?? "—"} />
                <Field label="Event type" value={booking.eventType ?? "—"} />
                <Field label="Headcount" value={booking.headcount != null ? String(booking.headcount) : "—"} />
                <Field label="Surface" value={booking.surfaceType ?? "—"} />
                <div className="sm:col-span-2">
                  <Field
                    label="Address"
                    value={[address.address, address.city].filter(Boolean).join(", ") || "—"}
                  />
                </div>
              </div>
              {booking.notes ? (
                <p className="mt-4 whitespace-pre-line rounded-2xl bg-muted/50 p-3.5 text-sm text-foreground/80">
                  {booking.notes}
                </p>
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
            </AdminCard>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <AdminCard className="h-fit p-6 lg:sticky lg:top-2">
            <SectionTitle icon={Settings}>Manage</SectionTitle>
            <BookingControls
              id={booking.id}
              status={booking.status}
              paymentStatus={booking.paymentStatus}
              invoiceNote={booking.invoiceNote}
            />
          </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground/80">{value}</p>
    </div>
  );
}
