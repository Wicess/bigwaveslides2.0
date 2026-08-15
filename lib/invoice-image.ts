// lib/invoice-image.ts
// Model + URL-safe codec for the send-to-client invoice PNG.
//
// The invoice is rendered from data encoded in the URL rather than looked up by
// order id. That keeps the image route stateless: the admin can tweak a line,
// a discount or the amount due and watch the preview update without writing
// anything to the database, and nothing half-edited is ever persisted. The
// route is still admin-gated — the encoding is for convenience, not secrecy.
//
// Plain module (no server-only): the editor encodes in the browser, the route
// decodes in node.

export type InvoiceItem = {
  desc: string;
  qty: number;
  unitCents: number;
};

export type InvoiceModel = {
  bookingId: string;
  invoiceNo?: string;
  dateLabel: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  address?: string;
  eventDate?: string;
  items: InvoiceItem[];
  transportCents: number;
  discountCents: number;
  discountLabel?: string;
  dueNowCents: number;
  dueLabel?: string;
  method?: string;
  notes?: string;
};

export type InvoiceTotals = {
  subtotalCents: number;
  totalCents: number;
  balanceCents: number;
};

export function invoiceTotals(m: InvoiceModel): InvoiceTotals {
  const subtotalCents = m.items.reduce(
    (n, i) => n + Math.round(i.unitCents * i.qty),
    0,
  );
  const totalCents = Math.max(
    0,
    subtotalCents + (m.transportCents ?? 0) - (m.discountCents ?? 0),
  );
  return {
    subtotalCents,
    totalCents,
    balanceCents: Math.max(0, totalCents - (m.dueNowCents ?? 0)),
  };
}

/**
 * base64url so the payload survives a query string untouched.
 *
 * Plain base64 is not safe here: `+` becomes a space and `/` reads as a path
 * separator once the string is in a URL, which corrupts the JSON on the way
 * back. Encoded via UTF-8 first so a client name with an accent round-trips.
 */
export function encodeInvoice(model: InvoiceModel): string {
  const json = JSON.stringify(model);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeInvoice(encoded: string): InvoiceModel | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    let json: string;
    if (typeof atob === "function") {
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    } else {
      json = Buffer.from(padded, "base64").toString("utf8");
    }
    const parsed = JSON.parse(json) as InvoiceModel;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}
