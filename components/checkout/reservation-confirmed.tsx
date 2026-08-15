import Link from "next/link";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { planLabel, type PaymentPlan } from "@/lib/payment-plan";
import { whatsappLink } from "@/lib/checkout-config";

/**
 * Success screen for both checkouts.
 *
 * Deliberately minimal: no "what happens next" step list. By this point the
 * client has committed, and a numbered list of things we are going to do is
 * where doubt creeps back in. One confirmation, one action, one summary.
 *
 * The action is WhatsApp, not "we'll email you". A message on a phone gets
 * answered in minutes; an email lands in a promotions tab. The link is
 * pre-filled with the whole order so the client sends it in one tap and we can
 * confirm without asking them to repeat anything.
 */
export function ReservationConfirmed({
  kind,
  orderNumber,
  itemName,
  eventDateLabel,
  dueCents,
  totalCents,
  plan,
  locale = "en",
}: {
  kind: "rent" | "buy";
  orderNumber: string;
  itemName: string;
  eventDateLabel?: string | null;
  dueCents: number;
  totalCents: number;
  plan: PaymentPlan;
  locale?: string;
}) {
  const isRent = kind === "rent";
  const noun = isRent ? "booking" : "order";
  const money = (c: number) => formatPrice(c, "en");

  const title = isRent
    ? eventDateLabel
      ? `You're booked for ${eventDateLabel}`
      : "You're booked"
    : "Your order is placed";

  const message = [
    `Hi! I'd like to confirm my ${noun}.`,
    `${isRent ? "Booking" : "Order"} #: ${orderNumber}`,
    `${isRent ? "Slide" : "Item"}: ${itemName}`,
    ...(isRent && eventDateLabel ? [`Event date: ${eventDateLabel}`] : []),
    `Payment: ${planLabel(plan)}`,
    `Due now: ${money(dueCents)}`,
    `Total: ${money(totalCents)}`,
    `Please confirm my ${noun}.`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-xl">
      <div className="border-border overflow-hidden rounded-3xl border bg-white shadow-[var(--shadow-soft)]">
        {/* Green hero */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-9 text-center text-white">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/20">
            <Check className="size-7" strokeWidth={3} />
          </span>
          <h1 className="font-display mt-4 text-2xl font-extrabold sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/90">
            We&apos;ll confirm your {noun} and contact you shortly.
          </p>
        </div>

        <div className="space-y-5 p-6">
          {/* Primary CTA — WhatsApp brand green, not the site primary, because
              people recognise the colour faster than they read the label. */}
          <div>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-5 shrink-0"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.884-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.688 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.8 11.8 0 0 0 20.465 3.49" />
              </svg>
              Confirm faster on WhatsApp
            </a>
            <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">
              We&apos;re confirming several {isRent ? "bookings" : "orders"}{" "}
              right now — send yours on WhatsApp and we&apos;ll put it{" "}
              <span className="text-foreground font-semibold">
                at the front of the line
              </span>
              . Fastest way to lock it in.
            </p>
          </div>

          {/* Summary */}
          <dl className="border-border bg-muted/40 space-y-2 rounded-2xl border p-4 text-sm">
            <Row label={isRent ? "Booking" : "Order"} value={itemName} />
            {isRent && eventDateLabel ? (
              <Row label="Event date" value={eventDateLabel} />
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Due now</dt>
              <dd className="text-primary text-lg font-extrabold">
                {money(dueCents)}
              </dd>
            </div>
            <Row label="Total" value={money(totalCents)} />
            <Row label="Confirmation #" value={orderNumber} mono />
          </dl>

          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={`/${locale}/order/${orderNumber}`}
              className="border-border text-foreground hover:border-primary hover:text-primary inline-flex h-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold transition-colors"
            >
              View {noun}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="border-border text-foreground hover:border-primary hover:text-primary inline-flex h-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold transition-colors"
            >
              My account
            </Link>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Saved to your account · nothing charged online.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd
        className={`text-foreground text-right font-semibold ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
