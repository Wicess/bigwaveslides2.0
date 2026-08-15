"use client";

import { formatPrice } from "@/lib/format";
import {
  amountDueCents,
  balanceCents,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { LOYALTY_SUBSCRIBE_RATE } from "@/lib/loyalty";

/**
 * The itemised total, shared by both checkouts.
 *
 * Every figure a client is asked to agree to is on screen at once. Rental sites
 * that reveal a delivery fee only after the details are filled in are the single
 * most common reason a checkout is abandoned at the last step, so transport is
 * a visible line from the start rather than a surprise at the end.
 *
 * All amounts are computed by the parent and passed in — this component does no
 * arithmetic beyond splitting the plan, so it cannot disagree with the picker
 * above it.
 */
export function OrderBreakdown({
  context,
  itemLabel,
  itemTotalCents,
  promoCode,
  promoDiscountCents,
  transportCents,
  methodDiscountLabel,
  methodDiscountCents,
  totalCents,
  plan,
  subtotalCents,
}: {
  context: "rent" | "buy";
  /** e.g. "Tropical Wave 18 · $299/day × 2" */
  itemLabel: string;
  itemTotalCents: number;
  promoCode?: string | null;
  promoDiscountCents: number;
  transportCents: number;
  /** e.g. "Bitcoin (−7.5%)" — omitted when the rail earns nothing. */
  methodDiscountLabel?: string | null;
  methodDiscountCents: number;
  /** Final payable, after every discount. */
  totalCents: number;
  plan: PaymentPlan;
  /** Product subtotal, for the "subscribers save" hint. */
  subtotalCents: number;
}) {
  const isRent = context === "rent";
  const money = (c: number) => formatPrice(c, "en");
  const due = amountDueCents(plan, totalCents);
  const rest = balanceCents(plan, totalCents);
  const loyaltyMax = Math.round(
    subtotalCents * (LOYALTY_SUBSCRIBE_RATE + 0.05),
  );

  return (
    <div className="border-border rounded-2xl border bg-white p-4">
      <h3 className="text-foreground text-sm font-bold">Order summary</h3>

      <dl className="mt-3 space-y-2 text-sm">
        <Line label={itemLabel} value={money(itemTotalCents)} />

        {promoDiscountCents > 0 ? (
          <Line
            label={`Promo (${promoCode})`}
            value={`− ${money(promoDiscountCents)}`}
            tone="good"
          />
        ) : null}

        {transportCents > 0 ? (
          <Line
            label={
              isRent
                ? "Transportation (delivery, setup & pickup)"
                : "Transportation (delivery)"
            }
            value={money(transportCents)}
          />
        ) : null}

        {methodDiscountCents > 0 && methodDiscountLabel ? (
          <Line
            label={methodDiscountLabel}
            value={`− ${money(methodDiscountCents)}`}
            tone="good"
          />
        ) : null}

        <div className="border-border flex items-baseline justify-between gap-3 border-t pt-2">
          <dt className="text-foreground font-bold">Total</dt>
          <dd className="text-foreground text-lg font-extrabold">
            {money(totalCents)}
          </dd>
        </div>

        <div className="bg-primary/5 border-primary/20 flex items-baseline justify-between gap-3 rounded-xl border px-3 py-2.5">
          <dt className="text-foreground text-sm font-bold">
            Due today ({plan === "HALF" ? "50% deposit" : "in full"})
          </dt>
          <dd className="text-primary text-xl font-extrabold">{money(due)}</dd>
        </div>

        {rest > 0 ? (
          <Line
            label={
              isRent
                ? "Balance — due 48 hours before your event"
                : "Balance — 50% due on delivery"
            }
            value={money(rest)}
            muted
          />
        ) : null}
      </dl>

      {loyaltyMax > 0 ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
          Newsletter subscribers save 15% (20% with our app) — up to{" "}
          <span className="font-bold">−{money(loyaltyMax)}</span> on this order.
        </p>
      ) : null}
    </div>
  );
}

function Line({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "good";
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={
          muted ? "text-muted-foreground text-xs" : "text-muted-foreground"
        }
      >
        {label}
      </dt>
      <dd
        className={
          tone === "good"
            ? "shrink-0 font-semibold text-emerald-600"
            : muted
              ? "text-muted-foreground shrink-0 text-xs font-medium"
              : "text-foreground shrink-0 font-semibold"
        }
      >
        {value}
      </dd>
    </div>
  );
}
