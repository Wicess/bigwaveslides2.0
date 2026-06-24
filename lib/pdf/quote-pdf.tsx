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
const GOVERNING_STATE = "Ohio";

const C = {
  ink: "#0f172a",
  body: "#374151",
  muted: "#6b7280",
  line: "#e5e9f0",
  primary: "#0099FF",
  accent: "#003366",
  soft: "#f1f8ff",
};

const s = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 70, paddingHorizontal: 44, fontSize: 9.5, color: C.body, fontFamily: "Helvetica", lineHeight: 1.5 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  logo: { height: 52, objectFit: "contain" },
  hero: { width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 14 },
  brandRight: { textAlign: "right", fontSize: 8.5, color: C.muted },
  brandName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent, marginBottom: 2 },
  titleBar: { backgroundColor: C.accent, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#ffffff", fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  titleMeta: { color: "#cfe8ff", fontSize: 8.5, textAlign: "right" },
  cols: { flexDirection: "row", gap: 14, marginBottom: 14 },
  col: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 11 },
  label: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, fontFamily: "Helvetica-Bold" },
  kv: { flexDirection: "row", marginBottom: 2 },
  kvKey: { width: 62, color: C.muted },
  kvVal: { flex: 1, color: C.ink },
  value: { fontSize: 9.5, color: C.ink, marginBottom: 1 },
  tableHead: { flexDirection: "row", backgroundColor: C.soft, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  th: { fontSize: 7.5, color: C.accent, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  cDesc: { flex: 3 },
  cQty: { flex: 1, textAlign: "center" },
  cRate: { flex: 1.3, textAlign: "right" },
  cAmt: { flex: 1.3, textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: "58%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, marginTop: 4, borderTopWidth: 2, borderTopColor: C.accent },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent },
  grandValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.primary },
  note: { marginTop: 12, backgroundColor: C.soft, borderRadius: 8, padding: 10, fontSize: 9, color: C.body },
  sectionTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.accent, marginTop: 18, marginBottom: 7, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  clause: { marginBottom: 6, fontSize: 9, color: C.body, textAlign: "justify" },
  clauseLead: { fontFamily: "Helvetica-Bold", color: C.ink },
  ack: { marginTop: 10, fontSize: 9, color: C.body, fontStyle: "italic" },
  signRow: { flexDirection: "row", gap: 28, marginTop: 16 },
  signCol: { flex: 1 },
  signLineRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  signLineWide: { flex: 2, borderBottomWidth: 1, borderBottomColor: C.ink, height: 26 },
  signLineDate: { flex: 1, borderBottomWidth: 1, borderBottomColor: C.ink, height: 26 },
  signLabel: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  returnNote: { marginTop: 16, backgroundColor: "#fff7ed", borderRadius: 8, padding: 10, fontSize: 9, color: "#9a3412", fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 26, left: 44, right: 44, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 7, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
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
  heroImageUrl?: string;
  customer: { name: string; email: string; phone?: string; address?: string };
  rental?: {
    arrival?: string;
    ret?: string;
    duration?: string;
    type?: string;
    headcount?: string;
    surface?: string;
    location?: string;
  };
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

type Clause = { t: string; b: string };

const RENTAL_TERMS: Clause[] = [
  { t: "Agreement & validity.", b: "This Rental Quote & Agreement becomes binding once signed by the Renter and accepted by Big Wave Slides (the \"Company\"). This quote is valid for 14 days; an invoice with payment instructions follows acceptance. Equipment is supplied for the stated rental period only and may not be extended without written approval." },
  { t: "Fees & refundable deposit.", b: "Charges are as itemized (rental, delivery/transport, pickup). Any refundable deposit shown covers damage, excessive cleaning, loss, theft, or late return, and is refunded after inspection less any deductions." },
  { t: "Site, setup & supervision.", b: "The Renter must provide a safe, level, clear area with a grounded power outlet within 50 ft and clear access; unsuitable or hazardous sites may be refused without refund. Competent adult supervision is required at all times, enforcing all capacity, height, age, and safety rules; no flips, rough play, food, drink, shoes, or use under the influence." },
  { t: "Weather.", b: "For safety, inflatables must not be used in sustained winds above 20 mph, storms, or lightning, and must be evacuated and unplugged. The Company may reschedule or cancel for severe weather at its discretion." },
  { t: "Renter responsibility, damage & spillage.", b: "The Renter is responsible for the equipment from delivery to pickup and is liable for damage beyond normal wear, loss, or theft. Cleaning fees apply for excessive soiling or spillage (food, drink, paint, silly string, mud, or bodily fluids). Equipment must not be moved after setup." },
  { t: "Assumption of risk & indemnification.", b: "Use of water slides and inflatables involves inherent risks of injury. To the fullest extent permitted by law, the Renter assumes these risks and agrees to indemnify and hold harmless the Company, its owners, and staff from any claims, injuries, damages, or losses arising from use during the rental period, except those caused by the Company's gross negligence. The Company carries liability insurance for its equipment." },
  { t: "Cancellation, liability & governing law.", b: `Cancellation and rescheduling terms are confirmed on the invoice. To the maximum extent permitted by law, the Company's total liability shall not exceed the amount paid, and it is not liable for indirect or consequential damages. This Agreement is governed by the laws of the State of ${GOVERNING_STATE}.` },
];

const ORDER_TERMS: Clause[] = [
  { t: "Agreement & validity.", b: "This Order Quote becomes a binding order once accepted by Big Wave Slides and an invoice is issued. It is valid for 14 days; prices are subject to availability at confirmation, and applicable taxes/delivery are confirmed on the invoice." },
  { t: "Payment.", b: "No charge is processed from this quote. Upon acceptance, the Company issues an invoice with payment instructions; the order is confirmed once payment is arranged." },
  { t: "Delivery, inspection & warranty.", b: "Title and risk of loss pass to the Buyer on delivery or collection; timelines are estimates. The Buyer must inspect goods on receipt and report defects within the stated window. Any manufacturer's warranty accompanies the product; returns follow the Company's standard policy." },
  { t: "Safe use, liability & governing law.", b: `Commercial-grade equipment must be installed and operated per the provided guidelines and applicable safety standards. To the maximum extent permitted by law, the Company's liability is limited to the purchase price, and the Buyer assumes responsibility for safe installation, supervision, and use after delivery. Governed by the laws of the State of ${GOVERNING_STATE}.` },
];

function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvVal}>{v}</Text>
    </View>
  );
}

function QuoteDoc({ input }: { input: QuotePdfInput }) {
  const locale = input.locale ?? "en";
  const money = (c: number) => formatPrice(c, locale);
  const isBooking = input.kind === "booking";
  const terms = isBooking ? RENTAL_TERMS : ORDER_TERMS;
  const t = input.totals;
  const r = input.rental ?? {};
  const partyWord = isBooking ? "Renter" : "Buyer";

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

        <View style={s.titleBar}>
          <Text style={s.title}>{isBooking ? "RENTAL QUOTE & AGREEMENT" : "ORDER QUOTE"}</Text>
          <View>
            <Text style={s.titleMeta}>Reference: {input.number}</Text>
            <Text style={s.titleMeta}>Date: {input.dateLabel}</Text>
            <Text style={s.titleMeta}>Valid for 14 days</Text>
          </View>
        </View>

        {input.heroImageUrl ? <Image src={input.heroImageUrl} style={s.hero} /> : null}

        {/* Parties / logistics */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.label}>{isBooking ? "Renter" : "Buyer"}</Text>
            <Text style={[s.value, { fontFamily: "Helvetica-Bold" }]}>{input.customer.name}</Text>
            <Text style={s.value}>{input.customer.email}</Text>
            {input.customer.phone ? <Text style={s.value}>{input.customer.phone}</Text> : null}
            {input.customer.address ? <Text style={s.value}>{input.customer.address}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.label}>{isBooking ? "Rental details" : "Order details"}</Text>
            {isBooking ? (
              <>
                <KV k="Arrival" v={r.arrival} />
                <KV k="Return" v={r.ret} />
                <KV k="Duration" v={r.duration} />
                <KV k="Event" v={r.type} />
                <KV k="Guests" v={r.headcount} />
                <KV k="Surface" v={r.surface} />
                <KV k="Location" v={r.location} />
              </>
            ) : (
              <>
                <KV k="Reference" v={input.number} />
                <KV k="Items" v={String(input.items.length)} />
                <KV k="Issued" v={input.dateLabel} />
              </>
            )}
          </View>
        </View>

        {/* Items */}
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
          <View style={s.totalRow}><Text>Subtotal</Text><Text>{money(t.subtotalCents)}</Text></View>
          {t.deliveryCents ? (
            <View style={s.totalRow}><Text>Delivery &amp; transport</Text><Text>{money(t.deliveryCents)}</Text></View>
          ) : null}
          {t.pickupCents ? (
            <View style={s.totalRow}><Text>Pickup</Text><Text>{money(t.pickupCents)}</Text></View>
          ) : null}
          {t.depositCents ? (
            <View style={s.totalRow}><Text>Refundable deposit</Text><Text>{money(t.depositCents)}</Text></View>
          ) : null}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Estimated total</Text>
            <Text style={s.grandValue}>{money(t.totalCents)}</Text>
          </View>
        </View>

        <View style={s.note}>
          <Text>
            This quote is valid for 14 days. Upon acceptance, we will issue an invoice with payment
            instructions and {isBooking ? "confirm your dates" : "process your order"}. Final pricing,
            including delivery, is confirmed on your invoice.
          </Text>
        </View>

        {/* Terms */}
        <Text style={s.sectionTitle}>
          {isBooking ? "Rental Terms, Conditions & Company Policies" : "Order Terms & Conditions"}
        </Text>
        {terms.map((c, i) => (
          <Text style={s.clause} key={i}>
            <Text style={s.clauseLead}>{i + 1}. {c.t} </Text>
            {c.b}
          </Text>
        ))}

        {/* Acceptance & signatures */}
        <Text style={s.sectionTitle} wrap={false}>Acceptance &amp; Signatures</Text>
        <Text style={s.ack}>
          By signing below, the {partyWord} confirms they have read, understood, and agree to this
          Agreement in full, including the Terms &amp; Conditions{isBooking ? ", Company Policies, assumption of risk, and indemnification" : ""} set out above.
        </Text>
        <View style={s.signRow} wrap={false}>
          <View style={s.signCol}>
            <Text style={[s.label, { marginBottom: 8 }]}>{partyWord}</Text>
            <View style={s.signLineRow}>
              <View style={s.signLineWide} />
              <View style={s.signLineDate} />
            </View>
            <View style={s.signLineRow}>
              <Text style={[s.signLabel, { flex: 2 }]}>Signature</Text>
              <Text style={[s.signLabel, { flex: 1 }]}>Date</Text>
            </View>
            <View style={[s.signLineWide, { marginTop: 12, height: 22 }]} />
            <Text style={s.signLabel}>Printed name</Text>
          </View>
          <View style={s.signCol}>
            <Text style={[s.label, { marginBottom: 8 }]}>For Big Wave Slides</Text>
            <View style={s.signLineRow}>
              <View style={s.signLineWide} />
              <View style={s.signLineDate} />
            </View>
            <View style={s.signLineRow}>
              <Text style={[s.signLabel, { flex: 2 }]}>Authorized signature</Text>
              <Text style={[s.signLabel, { flex: 1 }]}>Date</Text>
            </View>
            <View style={[s.signLineWide, { marginTop: 12, height: 22 }]} />
            <Text style={s.signLabel}>Printed name</Text>
          </View>
        </View>

        <Text style={s.returnNote}>
          To confirm your {isBooking ? "booking" : "order"}, you must sign this agreement and return it
          to {CONTACT_EMAIL}. {isBooking ? "You may also sign online using the link in your email." : ""}
        </Text>

        <View style={s.footer} fixed>
          <Text>Big Wave Slides · {CONTACT_EMAIL} · {CONTACT_PHONE}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render a branded, multi-page quote/agreement PDF to a Buffer. */
export async function generateQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return renderToBuffer(<QuoteDoc input={input} />);
}
