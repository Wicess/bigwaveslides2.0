import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatPrice } from "@/lib/format";

const LOGO = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/brand/logo-email.png";
const CONTACT_EMAIL = "contact@bigwaveslides.com";
const CONTACT_PHONE = "+1 (614) 302-5899";
const SITE = "bigwaveslides.com";

const C = {
  ink: "#0f172a",
  body: "#334155",
  muted: "#6b7280",
  line: "#e5e9f0",
  primary: "#0099FF",
  accent: "#003366",
  soft: "#f1f8ff",
};

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 64, paddingHorizontal: 44, fontSize: 10, color: C.body, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  logo: { height: 54, objectFit: "contain" },
  brandRight: { textAlign: "right", fontSize: 9, color: C.muted },
  brandName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent, marginBottom: 2 },
  titleBar: { backgroundColor: C.accent, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  titleMeta: { color: "#cfe8ff", fontSize: 9, textAlign: "right" },
  cols: { flexDirection: "row", gap: 16, marginBottom: 16 },
  col: { flex: 1 },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  value: { fontSize: 10, color: C.ink, marginBottom: 2 },
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12 },
  tableHead: { flexDirection: "row", backgroundColor: C.soft, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  th: { fontSize: 8, color: C.accent, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  cDesc: { flex: 3 },
  cQty: { flex: 1, textAlign: "center" },
  cRate: { flex: 1.2, textAlign: "right" },
  cAmt: { flex: 1.2, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: "55%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: C.accent },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.accent },
  grandValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.primary },
  note: { marginTop: 12, backgroundColor: C.soft, borderRadius: 8, padding: 10, fontSize: 9, color: C.body },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent, marginTop: 20, marginBottom: 8 },
  term: { flexDirection: "row", marginBottom: 5 },
  termNum: { width: 16, fontFamily: "Helvetica-Bold", color: C.primary, fontSize: 9 },
  termText: { flex: 1, fontSize: 9, color: C.body, lineHeight: 1.5 },
  signRow: { flexDirection: "row", gap: 24, marginTop: 18 },
  signBox: { flex: 1 },
  signLine: { borderBottomWidth: 1, borderBottomColor: C.ink, height: 30, marginBottom: 4 },
  signLabel: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  returnNote: { marginTop: 16, fontSize: 9, color: C.body, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted },
});

export type QuoteLineItem = {
  name: string;
  qtyLabel: string;
  rateLabel: string;
  amountCents: number;
};

export type QuotePdfInput = {
  kind: "order" | "booking";
  number: string;
  dateLabel: string;
  customer: { name: string; email: string; phone?: string; address?: string };
  event?: { dates?: string; type?: string; headcount?: string; surface?: string; location?: string };
  items: QuoteLineItem[];
  totals: {
    subtotalCents: number;
    deliveryCents?: number;
    pickupCents?: number;
    depositCents?: number;
    totalCents: number;
  };
  locale?: string;
};

const RENTAL_TERMS = [
  "This document is a quote and rental agreement. Dates are held tentatively and are only confirmed once Big Wave Slides accepts the booking and payment details are arranged. No payment is taken online.",
  "The renter agrees to provide a safe, level setup area with access to power within 50 ft and to keep the equipment clear of hazards at all times.",
  "Adult supervision is required during all use. The renter enforces the capacity, age, and safety guidelines provided by Big Wave Slides.",
  "Equipment must not be moved after setup. The renter is responsible for damage beyond normal wear, loss, or theft while the equipment is in their care.",
  "A refundable security deposit may be required and is returned after inspection; cleaning or repair costs may be deducted.",
  "Bookings may be rescheduled for safety due to severe weather at the discretion of Big Wave Slides. Final pricing, delivery, and cancellation terms are confirmed on your invoice.",
];

const ORDER_TERMS = [
  "This document is a quote for the items listed above. It is not a charge — no payment is taken online. Big Wave Slides will email an invoice with payment details to confirm your order.",
  "Pricing is valid for 14 days from the date of this quote and is subject to availability at the time of confirmation.",
  "Delivery, setup, and applicable fees (if any) are confirmed on your final invoice based on your location.",
  "Title and risk pass to the buyer on delivery. Warranty terms, where applicable, are provided with the product documentation.",
  "Returns and exchanges are handled per our standard policy; contact us within the stated window for assistance.",
];

function QuoteDoc({ input }: { input: QuotePdfInput }) {
  const locale = input.locale ?? "en";
  const money = (c: number) => formatPrice(c, locale);
  const isBooking = input.kind === "booking";
  const terms = isBooking ? RENTAL_TERMS : ORDER_TERMS;
  const t = input.totals;

  return (
    <Document
      title={`Big Wave Slides Quote ${input.number}`}
      author="Big Wave Slides"
      subject={isBooking ? "Rental Quote & Agreement" : "Order Quote"}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <Image src={LOGO} style={s.logo} />
          <View style={s.brandRight}>
            <Text style={s.brandName}>Big Wave Slides</Text>
            <Text>Big waves, bigger smiles.</Text>
            <Text>{CONTACT_EMAIL}</Text>
            <Text>{CONTACT_PHONE}</Text>
            <Text>{SITE}</Text>
          </View>
        </View>

        {/* Title bar */}
        <View style={s.titleBar}>
          <Text style={s.title}>{isBooking ? "RENTAL QUOTE & AGREEMENT" : "ORDER QUOTE"}</Text>
          <View>
            <Text style={s.titleMeta}>Reference: {input.number}</Text>
            <Text style={s.titleMeta}>Date: {input.dateLabel}</Text>
          </View>
        </View>

        {/* Prepared for + event */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.label}>Prepared for</Text>
            <Text style={s.value}>{input.customer.name}</Text>
            <Text style={s.value}>{input.customer.email}</Text>
            {input.customer.phone ? <Text style={s.value}>{input.customer.phone}</Text> : null}
            {input.customer.address ? <Text style={s.value}>{input.customer.address}</Text> : null}
          </View>
          {isBooking && input.event ? (
            <View style={s.col}>
              <Text style={s.label}>Event details</Text>
              {input.event.dates ? <Text style={s.value}>Dates: {input.event.dates}</Text> : null}
              {input.event.type ? <Text style={s.value}>Type: {input.event.type}</Text> : null}
              {input.event.headcount ? <Text style={s.value}>Guests: {input.event.headcount}</Text> : null}
              {input.event.surface ? <Text style={s.value}>Surface: {input.event.surface}</Text> : null}
              {input.event.location ? <Text style={s.value}>Location: {input.event.location}</Text> : null}
            </View>
          ) : null}
        </View>

        {/* Items table */}
        <View>
          <View style={s.tableHead}>
            <Text style={[s.th, s.cDesc]}>Description</Text>
            <Text style={[s.th, s.cQty]}>{isBooking ? "Days" : "Qty"}</Text>
            <Text style={[s.th, s.cRate]}>Rate</Text>
            <Text style={[s.th, s.cAmt]}>Amount</Text>
          </View>
          {input.items.map((it, i) => (
            <View style={s.row} key={i}>
              <Text style={s.cDesc}>{it.name}</Text>
              <Text style={s.cQty}>{it.qtyLabel}</Text>
              <Text style={s.cRate}>{it.rateLabel}</Text>
              <Text style={s.cAmt}>{money(it.amountCents)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(t.subtotalCents)}</Text>
          </View>
          {t.deliveryCents ? (
            <View style={s.totalRow}>
              <Text>Delivery &amp; setup</Text>
              <Text>{money(t.deliveryCents)}</Text>
            </View>
          ) : null}
          {t.pickupCents ? (
            <View style={s.totalRow}>
              <Text>Pickup</Text>
              <Text>{money(t.pickupCents)}</Text>
            </View>
          ) : null}
          {t.depositCents ? (
            <View style={s.totalRow}>
              <Text>Refundable deposit</Text>
              <Text>{money(t.depositCents)}</Text>
            </View>
          ) : null}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Estimated total</Text>
            <Text style={s.grandValue}>{money(t.totalCents)}</Text>
          </View>
        </View>

        <View style={s.note}>
          <Text>
            This is a quote, not an invoice — no payment is required now. We&apos;ll review your
            request and email payment details to confirm. Final pricing (including delivery) is
            confirmed on your invoice.
          </Text>
        </View>

        {/* Terms */}
        <Text style={s.sectionTitle}>Terms &amp; Conditions</Text>
        {terms.map((term, i) => (
          <View style={s.term} key={i}>
            <Text style={s.termNum}>{i + 1}.</Text>
            <Text style={s.termText}>{term}</Text>
          </View>
        ))}

        {/* Signature */}
        <Text style={s.sectionTitle}>Acceptance &amp; Signature</Text>
        <Text style={{ fontSize: 9, color: C.body }}>
          By signing below, I confirm I have read and accept the quote and the terms above.
        </Text>
        <View style={s.signRow}>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Client signature</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Printed name</Text>
          </View>
          <View style={s.signBox}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>Date</Text>
          </View>
        </View>
        <Text style={s.returnNote}>
          Please sign and return this document to {CONTACT_EMAIL} to confirm your{" "}
          {isBooking ? "booking" : "order"}.
        </Text>

        <View style={s.footer} fixed>
          <Text>Big Wave Slides · {CONTACT_EMAIL} · {CONTACT_PHONE}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render a branded quote/agreement PDF to a Buffer for emailing/storage. */
export async function generateQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return renderToBuffer(<QuoteDoc input={input} />);
}
