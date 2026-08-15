"use client";

import { useMemo, useState, useTransition } from "react";
import { ShieldCheck, Sparkles, CalendarCheck } from "lucide-react";
import { createSingleReservation } from "@/server/actions/reservations";
import {
  cryptoDiscountCents,
  discountLabelFor,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { formatPrice } from "@/lib/format";
import { rentalDays } from "@/lib/rental-pricing";
import { DEFAULT_METHOD, CHECKOUT_METHODS } from "@/lib/checkout-config";
import { AvailabilityCalendar } from "@/components/rent/availability-calendar";
import { ReserveOptions } from "@/components/checkout/reserve-options";
import {
  PromoField,
  type AppliedPromo,
} from "@/components/checkout/promo-field";
import { OrderBreakdown } from "@/components/checkout/order-breakdown";
import { ReservationConfirmed } from "@/components/checkout/reservation-confirmed";

type DateRange = { start: string | null; end: string | null };

/**
 * Rent Now — one page, availability first.
 *
 * The date gate is the point of the whole layout. Everything below step 1 stays
 * hidden until a valid range is picked, because a renter who fills in their name
 * and phone only to discover their date is taken has been made to work for a
 * rejection. Confirming the date is possible before asking for anything else
 * keeps the failure cheap.
 */
export function RentCheckoutForm({
  productId,
  productSlug,
  productName,
  dailyRateCents,
  transportCents,
  locale,
  contactEmail,
  contactPhone,
  whatsapp,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  dailyRateCents: number;
  transportCents: number;
  locale: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  /** Settings -> Contact WhatsApp number; omit to hide the success CTA. */
  whatsapp?: string | null;
}) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [plan, setPlan] = useState<PaymentPlan>("HALF");
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    orderNumber: string;
    dueCents: number;
    totalCents: number;
    plan: PaymentPlan;
    dateLabel: string | null;
  } | null>(null);
  const [pending, start] = useTransition();

  const money = (c: number) => formatPrice(c, "en");

  const days =
    range.start && range.end ? rentalDays(range.start, range.end) : 0;
  const hasDates = days >= 1;

  // Same order of operations as the server. See placeReservation.
  const totals = useMemo(() => {
    const subtotal = dailyRateCents * Math.max(0, days);
    const promoOff = promo ? Math.round(subtotal * promo.pct) : 0;
    const base = Math.max(0, subtotal + transportCents - promoOff);
    const methodOff = cryptoDiscountCents(base, method);
    return { subtotal, promoOff, methodOff, total: base - methodOff };
  }, [dailyRateCents, days, promo, transportCents, method]);

  const dateLabel = range.start
    ? new Date(`${range.start}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!hasDates || !range.start) {
      setError("Pick your event dates first.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createSingleReservation({
        productId,
        rentalDays: days,
        eventType: String(fd.get("eventType") ?? ""),
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        address: String(fd.get("address") ?? ""),
        city: String(fd.get("city") ?? ""),
        eventDate: range.start,
        notes: String(fd.get("notes") ?? ""),
        plan,
        method,
        promoCode: promo?.code ?? "",
        locale,
        website: String(fd.get("website") ?? ""),
      });
      if (res.ok) {
        setDone({
          orderNumber: res.orderNumber,
          dueCents: res.dueCents,
          totalCents: res.totalCents,
          plan: res.plan,
          dateLabel,
        });
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <ReservationConfirmed
        kind="rent"
        orderNumber={done.orderNumber}
        itemName={productName}
        eventDateLabel={done.dateLabel}
        dueCents={done.dueCents}
        totalCents={done.totalCents}
        plan={done.plan}
        whatsapp={whatsapp}
        locale={locale}
      />
    );
  }

  const methodLabel = CHECKOUT_METHODS.find((m) => m.key === method)?.label;
  const saveLabel = discountLabelFor(method);

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <Step n={1} title="Check availability">
        <AvailabilityCalendar
          productId={productId}
          value={range}
          onChange={setRange}
        />
        {hasDates ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            {days} day{days > 1 ? "s" : ""} · {money(totals.subtotal)}
          </p>
        ) : null}
      </Step>

      {/* Everything past the date gate. */}
      {hasDates ? (
        <>
          <Step n={2} title="Your details">
            <div className="space-y-3">
              <Field name="name" label="Full name" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="phone" label="Phone" type="tel" required />
                <Field name="email" label="Email" type="email" required />
              </div>
              <Field name="eventType" label="Event type" />
              <Field name="address" label="Event address" />
              <Field name="city" label="City" />
              <div>
                <label
                  htmlFor="notes"
                  className="text-foreground mb-1.5 block text-sm font-semibold"
                >
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="border-border focus:border-primary focus:ring-primary/25 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2"
                />
              </div>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
            </div>
          </Step>

          <Step n={3} title="Reserve your date">
            <div className="space-y-5">
              <ReserveOptions
                context="rent"
                plan={plan}
                method={method}
                totalCents={totals.total}
                onPlanChange={setPlan}
                onMethodChange={setMethod}
              />

              <PromoField
                productSlug={productSlug}
                mode="RENT"
                quantity={days}
                lineTotalCents={totals.subtotal}
                applied={promo}
                onApply={setPromo}
              />

              <OrderBreakdown
                context="rent"
                itemLabel={`${productName} · ${money(dailyRateCents)}/day × ${days}`}
                itemTotalCents={totals.subtotal}
                promoCode={promo?.code}
                promoDiscountCents={totals.promoOff}
                transportCents={transportCents}
                methodDiscountLabel={
                  saveLabel ? `${methodLabel} discount (−${saveLabel})` : null
                }
                methodDiscountCents={totals.methodOff}
                totalCents={totals.total}
                plan={plan}
                subtotalCents={totals.subtotal}
              />

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="bg-primary h-13 w-full rounded-2xl px-6 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Reserving your date…" : "Book Now"}
              </button>

              <ul className="text-muted-foreground flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs">
                <Badge icon={ShieldCheck}>Fully insured</Badge>
                <Badge icon={Sparkles}>Sanitized</Badge>
                <Badge icon={CalendarCheck}>Booking confirmed first</Badge>
              </ul>
            </div>
          </Step>
        </>
      ) : null}

      {contactEmail || contactPhone ? (
        <p className="text-muted-foreground text-center text-sm">
          Questions? Email{" "}
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary font-semibold"
            >
              {contactEmail}
            </a>
          ) : null}
          {contactEmail && contactPhone ? " or call " : null}
          {contactPhone ? (
            <a
              href={`tel:${contactPhone}`}
              className="text-primary font-semibold"
            >
              {contactPhone}
            </a>
          ) : null}
          .
        </p>
      ) : null}
    </form>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border rounded-3xl border bg-white p-5 sm:p-6">
      <h2 className="font-display mb-4 flex items-center gap-2.5 text-lg font-bold">
        <span className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-foreground mb-1.5 block text-sm font-semibold"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="border-border focus:border-primary focus:ring-primary/25 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2"
      />
    </div>
  );
}

function Badge({
  icon: Icon,
  children,
}: {
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="text-primary size-3.5" />
      {children}
    </li>
  );
}
