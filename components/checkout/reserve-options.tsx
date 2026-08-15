"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import {
  amountDueCents,
  balanceCents,
  discountLabelFor,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { CHECKOUT_METHODS } from "@/lib/checkout-config";
import { paymentLogo } from "@/lib/payment-logos";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Plan + method picker, shared by the rent and buy checkouts.
 *
 * `context` is not cosmetic. Renting and buying are different transactions and
 * the copy must never blur them: a renter is reserving a date and gets a
 * booking, a buyer is purchasing goods and gets an order. Every string below
 * forks on it rather than reaching for a word that covers both.
 *
 * `totalCents` must arrive ALREADY reduced by promo and method discount. The
 * parent owns that arithmetic because it also renders the itemised breakdown,
 * and two places computing the same total is how the card and the summary end
 * up disagreeing by a cent.
 */
export function ReserveOptions({
  context,
  plan,
  method,
  totalCents,
  onPlanChange,
  onMethodChange,
}: {
  context: "rent" | "buy";
  plan: PaymentPlan;
  method: string;
  totalCents: number;
  onPlanChange: (plan: PaymentPlan) => void;
  onMethodChange: (method: string) => void;
}) {
  const isRent = context === "rent";

  const PLANS: {
    key: PaymentPlan;
    title: string;
    sub: string;
    popular?: boolean;
  }[] = [
    {
      key: "HALF",
      title: "50% now",
      sub: isRent
        ? "Lock your date now — complete the balance 48 hours before your event."
        : "Pay 50% now — the remaining 50% is due on delivery.",
      popular: true,
    },
    {
      key: "FULL",
      title: "Pay in full",
      sub: isRent
        ? "One and done — nothing left to pay before your event."
        : "Pay the full amount now — nothing due on delivery.",
    },
  ];

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-foreground text-sm font-semibold">
          {isRent
            ? "How would you like to reserve?"
            : "How would you like to pay?"}
        </legend>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => {
            const selected = plan === p.key;
            const due = amountDueCents(p.key, totalCents);
            const rest = balanceCents(p.key, totalCents);
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onPlanChange(p.key)}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition-all",
                  selected
                    ? "border-primary ring-primary/30 bg-primary/5 ring-2"
                    : "border-border hover:border-primary/40 bg-white",
                )}
              >
                {p.popular ? (
                  <span className="bg-primary absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                    Most popular
                  </span>
                ) : null}
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold">
                    {p.title}
                  </span>
                  {selected ? (
                    <Check className="text-primary size-4 shrink-0" />
                  ) : null}
                </span>
                <span className="text-primary mt-1 block text-xl font-extrabold">
                  {formatPrice(due, "en")}
                </span>
                {rest > 0 ? (
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    then {formatPrice(rest, "en")}
                  </span>
                ) : null}
                <span className="text-muted-foreground mt-2 block text-xs leading-relaxed">
                  {p.sub}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-foreground text-sm font-semibold">
          Preferred method
        </legend>

        {/* Square tiles, logo above the name. The name is never truncated —
            a clipped "Apple Pa…" reads as a broken site at the exact moment
            we are asking someone to commit money. */}
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {CHECKOUT_METHODS.map((m) => {
            const selected = method === m.key;
            const logo = paymentLogo(m.key);
            const save = discountLabelFor(m.key);
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onMethodChange(m.key)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 transition-all",
                  selected
                    ? "border-primary ring-primary/30 bg-primary/5 ring-2"
                    : "border-border hover:border-primary/40 bg-white",
                )}
              >
                {selected ? (
                  <Check className="text-primary absolute top-1.5 right-1.5 size-3.5" />
                ) : null}
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-7 w-auto object-contain"
                  />
                ) : null}
                <span className="text-foreground text-center text-[11px] leading-tight font-bold">
                  {m.label}
                </span>
                {save ? (
                  <span className="text-[10px] leading-none font-semibold text-emerald-600">
                    Save {save}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* One trust line. Note there is no "payment" verb — the promise is that
          we confirm the {booking|order} first, which is what actually reassures
          someone handing over their details. */}
      <p className="text-muted-foreground text-xs leading-relaxed">
        {isRent
          ? "Fully insured & sanitized. We verify availability and confirm your booking first — nothing is charged online."
          : "Commercial-grade & warrantied. We confirm your order and delivery first — nothing is charged online."}
      </p>
    </div>
  );
}
