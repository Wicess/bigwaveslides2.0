"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Building2,
  MessageSquare,
} from "lucide-react";
import { createCartReservation } from "@/server/actions/reservations";
import {
  cryptoDiscountCents,
  discountLabelFor,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { LOYALTY_SUBSCRIBE_RATE } from "@/lib/loyalty";
import { formatPrice } from "@/lib/format";
import { DEFAULT_METHOD } from "@/lib/checkout-config";
import { ReserveOptions } from "@/components/checkout/reserve-options";
import {
  PromoField,
  type AppliedPromo,
} from "@/components/checkout/promo-field";
import { OrderBreakdown } from "@/components/checkout/order-breakdown";
import { ReservationConfirmed } from "@/components/checkout/reservation-confirmed";

export type CartCheckoutLine = {
  productId: string;
  slug: string;
  name: string;
  mode: "BUY" | "RENT";
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

/**
 * Cart checkout — the same one-page flow as Rent Now and Buy Now.
 *
 * This page was the last one still running the old route: it collected details,
 * said "we'll reply with a quote and payment details", and submitted a quote
 * request. Everything else had moved to booking immediately, so a visitor who
 * reached checkout through the cart got a different — and worse — promise than
 * one who came through a product page.
 *
 * There is deliberately NO summary sidebar. The totals belong in the reading
 * order directly above the button, because the plan and method pickers change
 * them: a figure that moves when you click something must be visible from where
 * you clicked, not parked in a sticky panel beside it.
 */

/**
 * One labelled input.
 *
 * The icon does real work here: on a form of eight near-identical rows it is
 * the fastest way to tell them apart at a glance, and it gives the focus ring
 * something to key off. Deliberately NOT a floating label — those hide the
 * field name the moment you type, which is exactly when someone re-checking a
 * phone number needs it.
 *
 * Border and shadow are never both decorative on the same element: the resting
 * state is a hairline border on a tinted surface, and focus swaps to the brand
 * border plus a soft ring. That keeps the focus state unmistakable without the
 * 1px-border-plus-wide-drop-shadow look that reads as a template.
 */
function Field({
  name,
  label,
  icon: Icon,
  type = "text",
  required,
  placeholder,
  className = "",
  textarea,
}: {
  name: string;
  label: string;
  icon: typeof User;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
}) {
  const shared =
    "peer w-full rounded-[var(--radius)] border border-border/80 bg-muted/40 py-3 pl-11 pr-3.5 text-[15px] text-foreground " +
    "placeholder:text-muted-foreground/70 outline-none transition-[border-color,box-shadow,background-color] duration-200 " +
    "hover:border-border focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/12";

  return (
    <label className={`block ${className}`}>
      <span className="text-foreground/80 mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
        {label}
        {required ? (
          <span className="text-primary" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <span className="relative block">
        <Icon
          aria-hidden="true"
          className={`text-muted-foreground/70 peer-focus:text-primary pointer-events-none absolute left-3.5 size-[18px] transition-colors ${
            textarea ? "top-3.5" : "top-1/2 -translate-y-1/2"
          }`}
        />
        {textarea ? (
          <textarea
            name={name}
            rows={3}
            required={required}
            placeholder={placeholder}
            className={`${shared} resize-y`}
          />
        ) : (
          <input
            name={name}
            type={type}
            required={required}
            placeholder={placeholder}
            className={shared}
          />
        )}
      </span>
    </label>
  );
}

export function CartCheckoutForm({
  cartId,
  lines,
  subtotalCents,
  transportCents,
  locale,
  contactEmail,
  contactPhone,
  whatsapp,
}: {
  cartId: string;
  lines: CartCheckoutLine[];
  subtotalCents: number;
  transportCents: number;
  locale: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  /** Settings -> Contact WhatsApp number; omit to hide the success CTA. */
  whatsapp?: string | null;
}) {
  // The cart is single-mode, so one line decides the copy for the whole page.
  const isBuy = lines.length > 0 && lines.every((l) => l.mode === "BUY");
  const context: "rent" | "buy" = isBuy ? "buy" : "rent";

  const [plan, setPlan] = useState<PaymentPlan>("HALF");
  const [method, setMethod] = useState<string>(DEFAULT_METHOD);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    orderNumber: string;
    dueCents: number;
    balanceCents: number;
    totalCents: number;
    plan: PaymentPlan;
  }>(null);
  const [pending, startTransition] = useTransition();

  // Promo applies to the product subtotal only, never to transport, and is
  // taken BEFORE the method discount so the percentages do not compound.
  const promoDiscountCents = useMemo(
    () => (promo ? Math.round(subtotalCents * promo.pct) : 0),
    [promo, subtotalCents],
  );

  const baseTotal = Math.max(
    0,
    subtotalCents + transportCents - promoDiscountCents,
  );
  const methodDiscountCents = cryptoDiscountCents(baseTotal, method);
  const totalCents = Math.max(0, baseTotal - methodDiscountCents);

  const itemLabel =
    lines.length === 1
      ? `${lines[0]!.name} · ${formatPrice(lines[0]!.unitPriceCents, locale)} × ${lines[0]!.quantity}`
      : `${lines.length} items`;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCartReservation({
        cartId,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        address: String(fd.get("address") ?? ""),
        city: String(fd.get("city") ?? ""),
        eventDate: String(fd.get("eventDate") ?? "") || undefined,
        notes: String(fd.get("notes") ?? ""),
        plan,
        method,
        promoCode: promo?.code,
        locale,
        website: String(fd.get("website") ?? ""),
      });
      if (res.ok) {
        setDone({
          orderNumber: res.orderNumber,
          dueCents: res.dueCents,
          balanceCents: res.balanceCents,
          totalCents: res.totalCents,
          plan: res.plan,
        });
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <ReservationConfirmed
        kind={context}
        orderNumber={done.orderNumber}
        itemName={lines.map((l) => l.name).join(", ")}
        dueCents={done.dueCents}
        totalCents={done.totalCents}
        plan={done.plan}
        whatsapp={whatsapp}
        locale={locale}
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Details */}
      <section className="border-border/70 bg-background rounded-[var(--radius-lg)] border p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Your details
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          {context === "rent"
            ? "Tell us your date, address and how you'd like to reserve — we'll confirm your booking and be in touch."
            : "Tell us where this is going and how you'd like to pay — we'll confirm your order and be in touch."}
        </p>

        <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field
            name="name"
            label="Name"
            icon={User}
            required
            placeholder="Jordan Ellis"
          />
          <Field
            name="email"
            label="Email"
            icon={Mail}
            type="email"
            required
            placeholder="you@example.com"
          />
          <Field
            name="phone"
            label="Phone"
            icon={Phone}
            type="tel"
            required
            placeholder="(555) 012-3456"
          />
          {context === "rent" ? (
            <Field
              name="eventDate"
              label="Event date"
              icon={CalendarDays}
              type="date"
            />
          ) : null}
          <Field
            name="address"
            label={context === "rent" ? "Event address" : "Delivery address"}
            icon={MapPin}
            placeholder="Where should we set up?"
            className="sm:col-span-2"
          />
          <Field
            name="city"
            label="City"
            icon={Building2}
            placeholder="Houston"
          />
          <Field
            name="notes"
            label="Notes"
            icon={MessageSquare}
            placeholder="Gate code, surface type, anything we should know"
            className="sm:col-span-2"
            textarea
          />
        </div>

        {/* Honeypot — hidden from people, tempting to bots. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
      </section>

      <PromoField
        mode={context === "buy" ? "BUY" : "RENT"}
        productSlug={lines[0]?.slug ?? ""}
        quantity={lines[0]?.quantity ?? 1}
        lineTotalCents={subtotalCents}
        applied={promo}
        onApply={setPromo}
      />

      <ReserveOptions
        context={context}
        totalCents={totalCents}
        plan={plan}
        onPlanChange={setPlan}
        method={method}
        onMethodChange={setMethod}
      />

      <OrderBreakdown
        context={context}
        itemLabel={itemLabel}
        itemTotalCents={subtotalCents}
        subtotalCents={subtotalCents}
        promoCode={promo?.code ?? null}
        promoDiscountCents={promoDiscountCents}
        transportCents={transportCents}
        methodDiscountLabel={discountLabelFor(method)}
        methodDiscountCents={methodDiscountCents}
        totalCents={totalCents}
        plan={plan}
      />

      {/* Subscriber saving — shown as a ceiling, not a promise, because it is
          applied server-side only if the email really is a subscriber. */}
      <p className="flex flex-wrap items-baseline gap-x-1.5 rounded-[var(--radius)] bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">
          Subscribers save {Math.round(LOYALTY_SUBSCRIBE_RATE * 100)}%
        </span>
        <span className="text-emerald-800/80">
          (20% with our app) — up to −
          {formatPrice(Math.round(subtotalCents * 0.2), locale)} on this order.
        </span>
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || lines.length === 0}
        className="focus-visible:ring-primary/30 h-14 w-full rounded-full px-6 text-base font-bold tracking-wide text-white shadow-[var(--shadow-glow)] transition-[transform,filter] duration-200 ease-out [background:var(--gradient-wave)] hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-4 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {pending
          ? "Confirming…"
          : context === "rent"
            ? "Book Now"
            : "Order Now"}
      </button>

      <ul className="text-muted-foreground flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {(context === "rent"
          ? [
              { icon: ShieldCheck, label: "Fully insured" },
              { icon: Sparkles, label: "Sanitized before delivery" },
              { icon: Truck, label: "Booking confirmed first" },
            ]
          : [
              { icon: ShieldCheck, label: "Commercial-grade" },
              { icon: Sparkles, label: "Warrantied" },
              { icon: Truck, label: "Nationwide delivery" },
            ]
        ).map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.label} className="flex items-center gap-2">
              <Icon className="text-primary size-4" />
              {it.label}
            </li>
          );
        })}
      </ul>

      {contactEmail || contactPhone ? (
        <p className="text-muted-foreground text-center text-sm">
          Questions? Email{" "}
          <a
            className="text-primary font-medium"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
          {contactPhone ? (
            <>
              {" "}
              or call{" "}
              <a
                className="text-primary font-medium"
                href={`tel:${contactPhone}`}
              >
                {contactPhone}
              </a>
            </>
          ) : null}
          .
        </p>
      ) : null}
    </form>
  );
}
