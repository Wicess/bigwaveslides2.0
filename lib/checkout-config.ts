// lib/checkout-config.ts
// The handful of numbers checkout is built around, in one obvious place.
//
// These were previously inlined at each call site, which is how a $30 transport
// fee ends up reading as $35 on one page. Anything a non-engineer might ask to
// change ("put the fee up", "new WhatsApp number") belongs here.
//
// Safe to import from client components — no server-only dependencies.

/**
 * Flat transport fee: delivery, setup and pickup, one charge per order.
 *
 * Not per item and not distance-based. Sites in this trade that quote per mile
 * lose the booking at the quote step, so this is deliberately a single number a
 * customer can see before they commit. Toggleable per-site via
 * `settings.fees.transportEnabled`.
 */
export const TRANSPORT_CENTS = 3000;

/**
 * WhatsApp number for the success screen's primary CTA, digits only — the
 * wa.me format takes no "+", spaces or dashes.
 *
 * WhatsApp is the fastest confirmation channel we have: a message lands on a
 * phone, an email lands in a promotions tab. The success page leads with it
 * rather than burying it under "we'll be in touch".
 */
/**
 * Strip a stored number down to the digits wa.me needs.
 *
 * There is deliberately NO hardcoded default. The number is read from
 * Settings -> Contact, so the success screen can only ever offer a channel the
 * owner has actually set up and is watching. A constant here would have shipped
 * the old brand's number and sent customers somewhere nobody answers — worse
 * than showing no button at all.
 */
export function whatsappDigits(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Shorter than this cannot be a dialable international number.
  return digits.length >= 8 ? digits : null;
}

/** Build a wa.me deep link with a pre-filled message, or null if unconfigured. */
export function whatsappLink(
  message: string,
  raw?: string | null,
): string | null {
  const digits = whatsappDigits(raw);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * The rails offered at checkout, in display order.
 *
 * Kept here rather than imported from lib/payment-methods.ts because that
 * module is `server-only` (it reads configured destinations from the DB) and
 * the picker is a client component. This list carries no destinations at all,
 * which is the point: what the client picks is a *preference*, and where money
 * actually goes is never rendered on the site.
 *
 * `payid` exists in the admin rail config but is deliberately absent here — the
 * checkout offers these five.
 */
export const CHECKOUT_METHODS: { key: string; label: string }[] = [
  { key: "zelle", label: "Zelle" },
  { key: "cash-app", label: "Cash App" },
  { key: "apple-pay", label: "Apple Pay" },
  { key: "chime", label: "Chime" },
  { key: "crypto", label: "Bitcoin" },
];

export const DEFAULT_METHOD = "zelle";
