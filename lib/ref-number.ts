// lib/ref-number.ts
// -----------------------------------------------------------------------------
// Generates short, human-friendly reference codes (e.g. "BW-260623-K7P2Q") for
// orders, quotes, bookings, and contracts. These are easy to read aloud over
// the phone and to quote in emails. Each code is: a type prefix + today's date
// + a short random suffix. Used wherever a new order/quote/etc. is created.
// -----------------------------------------------------------------------------

/** Human-friendly reference numbers for orders and quotes (request-based flow). */

// The characters allowed in the random part. We deliberately leave out letters
// and digits that look alike (0/O, 1/I) so a human reading or typing the code
// can't confuse them — e.g. no "0", "O", "1", or "I".
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomSuffix(len = 5): string {
  // Pick `len` random characters from ALPHABET to make the code unique.
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function datePart(): string {
  // Build a compact YYMMDD date stamp, e.g. June 23, 2026 -> "260623".
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2); // last two digits of the year
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-based, so +1
  const dd = String(d.getDate()).padStart(2, "0"); // pad single digits, e.g. 3 -> "03"
  return `${yy}${mm}${dd}`;
}

/** e.g. BW-260623-K7P2Q */
export function orderNumber(): string {
  return `BW-${datePart()}-${randomSuffix()}`;
}

/** e.g. Q-260623-K7P2Q */
export function quoteNumber(): string {
  return `Q-${datePart()}-${randomSuffix()}`;
}

/** e.g. BK-260623-K7P2Q */
export function bookingNumber(): string {
  return `BK-${datePart()}-${randomSuffix()}`;
}

/** e.g. CT-260623-K7P2Q (also used as the public contract URL token). */
export function contractNumber(): string {
  return `CT-${datePart()}-${randomSuffix(7)}`;
}
