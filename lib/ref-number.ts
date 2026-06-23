/** Human-friendly reference numbers for orders and quotes (request-based flow). */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomSuffix(len = 5): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function datePart(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
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
