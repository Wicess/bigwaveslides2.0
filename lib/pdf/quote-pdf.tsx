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
  { t: "Agreement & parties.", b: `This Rental Quote & Agreement (the "Agreement") is made between Big Wave Slides (the "Company", "we", "us") and the renter named above (the "Renter", "you"). It becomes a binding contract once signed by the Renter and accepted by the Company.` },
  { t: "Equipment & rental period.", b: "The Company will supply the equipment itemized above for the rental period stated (from the delivery/arrival date through the scheduled pickup/return). The rental period may not be extended without the Company's prior written approval, which may incur additional charges." },
  { t: "Quote validity & confirmation.", b: "This quote is valid for 14 days from the date shown. The booking is confirmed only once the Company accepts it and any required deposit is arranged; an invoice with payment instructions will be issued upon acceptance." },
  { t: "Fees & refundable deposit.", b: "Charges include the rental, delivery/transport, and pickup fees as itemized. Any refundable security deposit shown is held against damage, excessive cleaning, loss, theft, or late return and is returned after a post-event inspection, less any applicable deductions." },
  { t: "Delivery, setup & site requirements.", b: "The Renter must provide a safe, level, and clear setup area, a grounded power outlet within 50 ft (or an adequate generator), sufficient overhead and side clearance, and a clear access path for delivery. The Renter must disclose underground utilities, sprinklers, and cables. Setup on unsuitable, sloped, or hazardous surfaces may be refused without refund." },
  { t: "Supervision & safe operation.", b: "Competent adult supervision is required at all times during use. The Renter must enforce all posted capacity, height, and age limits; prohibit flips, rough play, climbing on walls/nets, food, drink, shoes, sharp objects, and use by anyone under the influence; and immediately stop use in unsafe conditions." },
  { t: "Weather.", b: "For safety, inflatable equipment must not be used in sustained winds above 20 mph, rain storms, or lightning, and must be evacuated and unplugged in such conditions. The Company may reschedule or cancel for severe weather at its sole discretion." },
  { t: "Renter responsibilities, damage & spillage.", b: "The Renter is responsible for the equipment from delivery until pickup and is liable for any damage beyond normal wear, loss, or theft while in their care. Additional cleaning fees apply for excessive soiling or spillage, including food, drinks, gum, paint, silly string, mud, sand, or bodily fluids. Equipment must not be moved, cut, written on, or have anything attached once set up." },
  { t: "Assumption of risk & indemnification.", b: `The Renter acknowledges that the use of water slides and inflatable equipment involves inherent risks, including the risk of personal injury. To the fullest extent permitted by law, the Renter voluntarily assumes all such risks and agrees to indemnify, defend, and hold harmless the Company, its owners, employees, and agents from and against any and all claims, demands, injuries, damages, losses, or expenses arising out of or related to the use of the equipment during the rental period, except to the extent caused by the Company's gross negligence or willful misconduct.` },
  { t: "Insurance & compliance.", b: "The Company maintains liability insurance covering its equipment. The Renter is responsible for compliance with all venue, park, HOA, or municipal rules and for obtaining any permits required for the event location." },
  { t: "Cancellation & rescheduling.", b: "Cancellation and rescheduling terms are confirmed on your invoice. Deposits may be non-refundable within a stated window prior to the event. Weather-related rescheduling is handled per clause 7." },
  { t: "Limitation of liability.", b: "To the maximum extent permitted by law, the Company's total liability under this Agreement shall not exceed the total amount paid by the Renter for the rental, and the Company shall not be liable for any indirect, incidental, or consequential damages." },
  { t: "Entire agreement & governing law.", b: `This Agreement, together with the issued invoice, constitutes the entire agreement between the parties and supersedes any prior understandings. It is governed by the laws of the State of ${GOVERNING_STATE}.` },
];

const ORDER_TERMS: Clause[] = [
  { t: "Agreement & parties.", b: `This Order Quote (the "Quote") is made between Big Wave Slides (the "Company") and the purchaser named above (the "Buyer"). It becomes a binding order once accepted by the Company and an invoice is issued.` },
  { t: "Quote validity & pricing.", b: "This quote is valid for 14 days from the date shown. Prices are subject to availability at the time of confirmation. Applicable taxes and any delivery charges are confirmed on the invoice." },
  { t: "Payment.", b: "No charge is processed from this quote. Upon acceptance, the Company issues an invoice with payment instructions; the order is confirmed once payment arrangements are in place." },
  { t: "Delivery & risk of loss.", b: "Title and risk of loss pass to the Buyer upon delivery or collection. Quoted delivery timelines are estimates and are confirmed on the invoice." },
  { t: "Inspection, returns & warranty.", b: "The Buyer must inspect goods upon receipt and report any defects or shortages within the stated window. Where applicable, the manufacturer's warranty accompanies the product. Returns and exchanges are handled in accordance with the Company's standard policy." },
  { t: "Safe use & liability.", b: `Commercial-grade equipment must be installed, anchored, operated, and maintained in accordance with the provided guidelines and applicable safety standards. To the maximum extent permitted by law, the Company's liability is limited to the purchase price, and the Buyer assumes responsibility for safe installation, supervision, and use after delivery. This agreement is governed by the laws of the State of ${GOVERNING_STATE}.` },
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
