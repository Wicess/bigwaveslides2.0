"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, ShieldCheck, Truck, Award } from "lucide-react";
import { createSalePurchase } from "@/server/actions/reservations";
import {
  cryptoDiscountCents,
  discountLabelFor,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { formatPrice } from "@/lib/format";
import { DEFAULT_METHOD, CHECKOUT_METHODS } from "@/lib/checkout-config";
import { ReserveOptions } from "@/components/checkout/reserve-options";
import {
  PromoField,
  type AppliedPromo,
} from "@/components/checkout/promo-field";
import { OrderBreakdown } from "@/components/checkout/order-breakdown";
import { ReservationConfirmed } from "@/components/checkout/reservation-confirmed";

/**
 * Buy Now — one page, no calendar, no event date.
 *
 * A purchase has no date to hold, so nothing here asks for one. Keeping the
 * buy flow free of rental concepts is deliberate: the moment a buyer is asked
 * "when is your event?" the page stops making sense to them.
 */
export function BuyCheckoutForm({
  productId,
  productSlug,
  productName,
  unitPriceCents,
  transportCents,
  locale,
  contactEmail,
  contactPhone,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  unitPriceCents: number;
  transportCents: number;
  locale: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  const [qty, setQty] = useState(1);
  const [plan, setPlan] = useState<PaymentPlan>("HALF");
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    orderNumber: string;
    dueCents: number;
    totalCents: number;
    plan: PaymentPlan;
  } | null>(null);
  const [pending, start] = useTransition();

  const money = (c: number) => formatPrice(c, "en");

  // Mirrors placeReservation exactly: promo off the product subtotal, then the
  // method discount on what remains. Any drift here shows up as a client seeing
  // one total and being charged another.
  const totals = useMemo(() => {
    const subtotal = unitPriceCents * qty;
    const promoOff = promo ? Math.round(subtotal * promo.pct) : 0;
    const base = Math.max(0, subtotal + transportCents - promoOff);
    const methodOff = cryptoDiscountCents(base, method);
    return { subtotal, promoOff, base, methodOff, total: base - methodOff };
  }, [unitPriceCents, qty, promo, transportCents, method]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createSalePurchase({
        productId,
        quantity: qty,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        address: String(fd.get("address") ?? ""),
        city: String(fd.get("city") ?? ""),
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
        });
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <ReservationConfirmed
        kind="buy"
        orderNumber={done.orderNumber}
        itemName={`${productName} × ${qty}`}
        dueCents={done.dueCents}
        totalCents={done.totalCents}
        plan={done.plan}
        locale={locale}
      />
    );
  }

  const methodLabel = CHECKOUT_METHODS.find((m) => m.key === method)?.label;
  const saveLabel = discountLabelFor(method);

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <Step n={1} title="Your details">
        <div className="space-y-3">
          <div>
            <label className="text-foreground mb-1.5 block text-sm font-semibold">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="border-border hover:border-primary flex size-10 items-center justify-center rounded-xl border bg-white transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-lg font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(50, q + 1))}
                aria-label="Increase quantity"
                className="border-border hover:border-primary flex size-10 items-center justify-center rounded-xl border bg-white transition-colors"
              >
                <Plus className="size-4" />
              </button>
              <span className="text-muted-foreground ml-1 text-sm">
                {money(unitPriceCents)} each
              </span>
            </div>
          </div>

          <Field name="name" label="Full name" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="phone" label="Phone" type="tel" required />
            <Field name="email" label="Email" type="email" required />
          </div>
          <Field name="address" label="Delivery address" />
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
          {/* Honeypot */}
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

      <Step n={2} title="Payment">
        <div className="space-y-5">
          <ReserveOptions
            context="buy"
            plan={plan}
            method={method}
            totalCents={totals.total}
            onPlanChange={setPlan}
            onMethodChange={setMethod}
          />

          <PromoField
            productSlug={productSlug}
            mode="BUY"
            quantity={qty}
            lineTotalCents={totals.subtotal}
            applied={promo}
            onApply={setPromo}
          />

          <OrderBreakdown
            context="buy"
            itemLabel={`${productName} · ${money(unitPriceCents)} × ${qty}`}
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
            {pending ? "Placing your order…" : "Order Now"}
          </button>

          <ul className="text-muted-foreground flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs">
            <Badge icon={Award}>Commercial-grade</Badge>
            <Badge icon={ShieldCheck}>Warrantied</Badge>
            <Badge icon={Truck}>Nationwide delivery</Badge>
          </ul>
        </div>
      </Step>

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
