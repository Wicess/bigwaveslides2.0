import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

// Unambiguous alphabet — no 0/O or 1/I, so a client reading the code off their
// phone can't misread it.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Deterministic per-order security code, shown identically on the secure
 * payment page and in the payment-details email. The client compares the two:
 * if they don't match, the message is an impostor and they must not pay.
 *
 * Derived from the order number + a server secret, so it's the SAME every time
 * (page and email always agree) but can't be reproduced by a scammer who
 * doesn't hold the secret. Returns e.g. "SAFE-7Q2K" → we prefix "SAFE-" in the
 * UI; this returns the raw 6-char body formatted as "XXX-XXX".
 */
export function orderSecurityCode(orderNumber: string): string {
  const secret = env.NEXTAUTH_SECRET ?? "big-wave-slides";
  const hex = createHash("sha256")
    .update(`bws:security:${orderNumber}:${secret}`)
    .digest("hex");
  let out = "";
  for (let i = 0; i < 6; i++) {
    out +=
      ALPHABET[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % ALPHABET.length];
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}
