"use client";

import { useMemo, useState, useTransition } from "react";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
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
export function CartCheckoutForm({
  cartId,
  lines,
  subtotalCents,
  transportCents,
  locale,
  contactEmail,
  contactPhone,
}: {
  cartId: string;
  lines: CartCheckoutLine[];
  subtotalCents: number;
  transportCents: number;
  locale: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
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
        locale={locale}
      />
    );
  }

  const field =
    "border-border bg-background focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors";

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Details */}
      <section>
        <h2 className="font-display text-lg font-semibold">Your details</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {context === "rent"
            ? "Tell us your date, address and how you'd like to reserve — we'll confirm your booking and be in touch."
            : "Tell us where this is going and how you'd like to pay — we'll confirm your order and be in touch."}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Name*</span>
            <input name="name" required className={`mt-1 ${field}`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email*</span>
            <input
              name="email"
              type="email"
              required
              className={`mt-1 ${field}`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Phone*</span>
            <input name="phone" required className={`mt-1 ${field}`} />
          </label>
          {context === "rent" ? (
            <label className="block">
              <span className="text-sm font-medium">Event date</span>
              <input name="eventDate" type="date" className={`mt-1 ${field}`} />
            </label>
          ) : null}
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">
              {context === "rent" ? "Event address" : "Delivery address"}
            </span>
            <input name="address" className={`mt-1 ${field}`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">City</span>
            <input name="city" className={`mt-1 ${field}`} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea name="notes" rows={3} className={`mt-1 ${field}`} />
          </label>
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
      <p className="text-sm font-medium text-emerald-700">
        Newsletter subscribers save {Math.round(LOYALTY_SUBSCRIBE_RATE * 100)}%
        (20% with our app) — up to −
        {formatPrice(Math.round(subtotalCents * 0.2), locale)}
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || lines.length === 0}
        className="bg-primary w-full rounded-full px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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
