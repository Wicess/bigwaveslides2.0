// Payment rail → logo asset map. Plain module (no server-only) so both the
// client-side invoice page and the admin editor can render the brand marks.
// Assets live in public/payments/.

export const PAYMENT_LOGOS: Record<string, string> = {
  zelle: "/payments/zelle.svg",
  "cash-app": "/payments/cashapp.svg",
  "apple-pay": "/payments/apple-pay.svg",
  chime: "/payments/chime.jpg",
  crypto: "/payments/crypto.svg",
  payid: "/payments/payid.svg",
};

export function paymentLogo(method: string): string | null {
  return PAYMENT_LOGOS[method] ?? null;
}
