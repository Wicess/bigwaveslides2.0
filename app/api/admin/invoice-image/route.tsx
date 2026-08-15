import { brandLogoUrl } from "@/lib/brand";
import { CANONICAL_ORIGIN } from "@/lib/site";
import { ImageResponse } from "next/og";
import { getAdminSession } from "@/lib/admin-auth";
import {
  decodeInvoice,
  invoiceTotals,
  type InvoiceModel,
} from "@/lib/invoice-image";

// Satori (the renderer behind ImageResponse) needs a real Node runtime here.
export const runtime = "nodejs";

const LOGO = brandLogoUrl(CANONICAL_ORIGIN);

/**
 * Invoice PNG the owner sends straight to a client — WhatsApp, SMS, email.
 *
 * Tesla-style on purpose: white ground, monochrome ink, hairline rules, small
 * uppercase section labels and a lot of whitespace. An invoice is the most
 * scrutinised thing this business sends, and a restrained one reads as an
 * established company. Colour, gradients and a busy footer read as a template.
 *
 * The height is computed from the content rather than fixed, because a fixed
 * canvas leaves a slab of empty white under a two-line invoice — which looks
 * broken when it lands in a chat thread as an image.
 */
const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const INK = "#111111";
const MUTED = "#8A8A8A";
const RULE = "#E4E4E4";

function Label({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 15,
        letterSpacing: 2.2,
        textTransform: "uppercase",
        color: MUTED,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong,
  top,
}: {
  label: string;
  value: string;
  strong?: boolean;
  top?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: 420,
        paddingTop: top ? 14 : 6,
        paddingBottom: 6,
        borderTop: top ? `1px solid ${RULE}` : "none",
      }}
    >
      <div style={{ fontSize: strong ? 24 : 19, color: strong ? INK : MUTED }}>
        {label}
      </div>
      <div
        style={{
          fontSize: strong ? 26 : 19,
          color: INK,
          fontWeight: strong ? 700 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  // Admin-only. The payload is in the URL for statelessness, not secrecy.
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get("d");
  if (!encoded) return new Response("Missing data", { status: 400 });

  const m: InvoiceModel | null = decodeInvoice(encoded);
  if (!m) return new Response("Bad data", { status: 400 });

  const { subtotalCents, totalCents, balanceCents } = invoiceTotals(m);

  // Grow with the content so the image ends where the invoice ends.
  const height =
    810 + m.items.length * 58 + (m.notes ? 44 : 0) + (m.eventDate ? 30 : 0);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        color: INK,
        padding: "64px 72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Masthead */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" height={54} style={{ objectFit: "contain" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 34,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Invoice
          </div>
          <div style={{ fontSize: 18, color: MUTED, marginTop: 8 }}>
            {m.invoiceNo ? `${m.invoiceNo} · ` : ""}Booking {m.bookingId}
          </div>
          <div style={{ fontSize: 18, color: MUTED, marginTop: 4 }}>
            {m.dateLabel}
          </div>
        </div>
      </div>

      <div
        style={{ height: 1, backgroundColor: RULE, margin: "44px 0 40px" }}
      />

      {/* Billed to */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Label>Billed to</Label>
        <div style={{ fontSize: 26, marginBottom: 6 }}>{m.clientName}</div>
        {m.clientEmail ? (
          <div style={{ fontSize: 19, color: MUTED }}>{m.clientEmail}</div>
        ) : null}
        {m.clientPhone ? (
          <div style={{ fontSize: 19, color: MUTED, marginTop: 3 }}>
            {m.clientPhone}
          </div>
        ) : null}
        {m.address ? (
          <div style={{ fontSize: 19, color: MUTED, marginTop: 3 }}>
            {m.address}
          </div>
        ) : null}
        {m.eventDate ? (
          <div style={{ fontSize: 19, color: INK, marginTop: 10 }}>
            Event date · {m.eventDate}
          </div>
        ) : null}
      </div>

      <div
        style={{ height: 1, backgroundColor: RULE, margin: "40px 0 30px" }}
      />

      {/* Items */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Label>Description</Label>
        <Label>Amount</Label>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {m.items.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: `1px solid ${RULE}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22 }}>{it.desc}</div>
              <div style={{ fontSize: 17, color: MUTED, marginTop: 4 }}>
                {it.qty} × {money(it.unitCents)}
              </div>
            </div>
            <div style={{ fontSize: 22 }}>
              {money(Math.round(it.unitCents * it.qty))}
            </div>
          </div>
        ))}
      </div>

      {/* Totals, right-aligned */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          marginTop: 30,
        }}
      >
        <TotalRow label="Subtotal" value={money(subtotalCents)} />
        {m.transportCents > 0 ? (
          <TotalRow label="Transportation" value={money(m.transportCents)} />
        ) : null}
        {m.discountCents > 0 ? (
          <TotalRow
            label={m.discountLabel ?? "Discount"}
            value={`− ${money(m.discountCents)}`}
          />
        ) : null}
        <TotalRow label="Total" value={money(totalCents)} strong top />
        <TotalRow
          label={m.dueLabel ?? "Amount due"}
          value={money(m.dueNowCents)}
        />
        {balanceCents > 0 ? (
          <TotalRow label="Balance" value={money(balanceCents)} />
        ) : null}
      </div>

      {/* Payment method + notes. The document ENDS here — no footer. */}
      {m.method || m.notes ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            paddingTop: 30,
            borderTop: `1px solid ${RULE}`,
          }}
        >
          {m.method ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Label>Payment method</Label>
              <div style={{ fontSize: 22 }}>{m.method}</div>
            </div>
          ) : null}
          {m.notes ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: m.method ? 24 : 0,
              }}
            >
              <Label>Notes</Label>
              <div style={{ fontSize: 19, color: MUTED }}>{m.notes}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>,
    { width: 1000, height },
  );
}
