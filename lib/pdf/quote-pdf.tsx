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
import { ANTI_SCAM_HEADING, ANTI_SCAM_BODY } from "@/lib/anti-scam";
import { amountDueCents, balanceCents } from "@/lib/payment-plan";
import {
  TRANSPORT_LABEL,
  DEPOSIT_RATE,
  REFUND_NOTICE_DAYS,
} from "@/lib/pricing";
import {
  RENTAL_TERMS,
  orderTerms,
  quoteTerms,
  SETUP_REQUIREMENTS,
} from "@/lib/legal-terms";

const LOGO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/brand/logo-email.png";
const CONTACT_EMAIL = "contact@bigwaveslides.com";
const CONTACT_PHONE = "+1 (614) 302-5899";
const SITE = "bigwaveslides.com";

const C = {
  ink: "#0f172a",
  body: "#374151",
  muted: "#6b7280",
  line: "#e5e9f0",
  primary: "#0099FF",
  accent: "#003366",
  soft: "#f1f8ff",
  warnBg: "#fef2f2",
  warnBorder: "#fca5a5",
  warnInk: "#991b1b",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 70,
    paddingHorizontal: 44,
    fontSize: 9.5,
    color: C.body,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  logo: { height: 52, objectFit: "contain" },
  hero: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 14,
  },
  brandRight: { textAlign: "right", fontSize: 8.5, color: C.muted },
  brandName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginBottom: 2,
  },
  titleBar: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
  },
  titleMeta: { color: "#cfe8ff", fontSize: 8.5, textAlign: "right" },
  cols: { flexDirection: "row", gap: 14, marginBottom: 14 },
  col: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 11,
  },
  label: {
    fontSize: 7.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
  },
  kv: { flexDirection: "row", marginBottom: 2 },
  kvKey: { width: 70, color: C.muted },
  kvVal: { flex: 1, color: C.ink },
  value: { fontSize: 9.5, color: C.ink, marginBottom: 1 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.soft,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 7.5,
    color: C.accent,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  includes: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    marginTop: -4,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    fontSize: 8,
    color: C.muted,
  },
  cDesc: { flex: 3 },
  cQty: { flex: 1, textAlign: "center" },
  cRate: { flex: 1.3, textAlign: "right" },
  cAmt: { flex: 1.3, textAlign: "right" },
  totals: { marginTop: 10, marginLeft: "auto", width: "58%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: C.accent,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.accent },
  grandValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.primary },
  scheduleBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 11,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  scheduleKey: { color: C.ink },
  scheduleVal: { fontFamily: "Helvetica-Bold", color: C.ink },
  payBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 11,
  },
  payHint: { fontSize: 8.5, color: C.muted, marginTop: 2, marginBottom: 8 },
  payRow: { flexDirection: "row", gap: 10 },
  payOpt: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1.2,
    borderColor: C.accent,
    borderRadius: 2,
  },
  payLabel: { fontSize: 9.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  warnBox: {
    marginTop: 12,
    backgroundColor: C.warnBg,
    borderWidth: 1,
    borderColor: C.warnBorder,
    borderRadius: 8,
    padding: 11,
  },
  warnTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.warnInk,
    marginBottom: 3,
  },
  warnBody: { fontSize: 8.5, color: C.warnInk, lineHeight: 1.5 },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginTop: 18,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  clause: { marginBottom: 6, fontSize: 9, color: C.body, textAlign: "justify" },
  clauseLead: { fontFamily: "Helvetica-Bold", color: C.ink },
  bullet: { marginBottom: 3, fontSize: 9, color: C.body },
  ack: { marginTop: 10, fontSize: 9, color: C.body, fontStyle: "italic" },
  signRow: { flexDirection: "row", gap: 28, marginTop: 16 },
  signCol: { flex: 1 },
  signLineRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  signLineWide: {
    flex: 2,
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    height: 26,
  },
  signLineDate: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    height: 26,
  },
  signLabel: {
    fontSize: 7.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginBottom: 6,
  },
  returnNote: {
    marginTop: 16,
    backgroundColor: "#fff7ed",
    borderRadius: 8,
    padding: 10,
    fontSize: 9,
    color: "#9a3412",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.muted,
  },
});

export type QuoteLineItem = {
  name: string;
  qtyLabel: string;
  rateLabel: string;
  amountCents: number;
  /** Optional "Includes: …" sub-line under the description. */
  includes?: string;
};

export type QuotePdfInput = {
  kind: "order" | "booking";
  /** "quote" = pre-acceptance document · "invoice" = payable document.
      Defaults to "invoice" for backwards compatibility. */
  docType?: "quote" | "invoice";
  number: string;
  /** On invoices: the originating quote/order reference. */
  quoteRef?: string;
  dateLabel: string;
  /** Quote docs: how long the quote stays valid. */
  validUntilLabel?: string;
  /** Invoice docs: when the balance is due. */
  dueLabel?: string;
  /** Date of the event, printed prominently. */
  eventDateLabel?: string;
  /** Event/delivery address. */
  eventLocation?: string;
  /** "Renter" for rental orders, "Buyer" for purchases. Bookings are always Renter. */
  party?: "Renter" | "Buyer";
  /** Chosen payment plan (invoice docs, once picked). */
  paymentPlan?: "HALF" | "FULL";
  /** Public page where the client can accept/pay online. */
  onlineUrl?: string;
  /** Manual invoice mode — details are sent by the owner (email/phone/WhatsApp),
      not shown on-site; swaps the "only pay on-site/official email" wording. */
  manualMode?: boolean;
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
    /** Loyalty discount (subscriber / +app) deducted from the subtotal. */
    loyaltyDiscountCents?: number;
    loyaltyDiscountPct?: number;
    /** Promo code discount (entered at checkout). */
    promoDiscountCents?: number;
    promoCode?: string;
    totalCents: number;
  };
  locale?: string;
};

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
  const docType = input.docType ?? "invoice";
  const isQuote = docType === "quote";
  // The live order invoice is kept short: important details + calculations
  // only. Quotes and booking agreements stay full (that's where the terms are
  // reviewed, agreed, and signed).
  const slimInvoice = !isQuote && !isBooking;
  const t = input.totals;
  const r = input.rental ?? {};
  const partyWord = input.party ?? (isBooking ? "Renter" : "Buyer");
  const terms = isQuote
    ? quoteTerms(partyWord, input.validUntilLabel)
    : isBooking
      ? RENTAL_TERMS
      : orderTerms(partyWord);

  const half = amountDueCents("HALF", t.totalCents);
  const halfBalance = balanceCents("HALF", t.totalCents);

  const docTitle = isQuote
    ? isBooking || partyWord === "Renter"
      ? "RENTAL QUOTE"
      : "QUOTE"
    : isBooking
      ? "RENTAL INVOICE & AGREEMENT"
      : partyWord === "Renter"
        ? "RENTAL INVOICE"
        : "INVOICE";

  return (
    <Document
      title={`Big Wave Slides ${isQuote ? "Quote" : "Invoice"} ${input.number}`}
      author="Big Wave Slides"
      subject={docTitle}
    >
      <Page size="A4" style={s.page}>
        {/* Header — the logo here is part of the anti-impersonation promise:
            clients are told to verify it before paying. */}
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
          <Text style={s.title}>{docTitle}</Text>
          <View>
            <Text style={s.titleMeta}>
              {isQuote ? "Quote no" : "Invoice no"}: {input.number}
            </Text>
            <Text style={s.titleMeta}>Issued: {input.dateLabel}</Text>
            {isQuote && input.validUntilLabel ? (
              <Text style={s.titleMeta}>
                Valid until: {input.validUntilLabel}
              </Text>
            ) : null}
            {!isQuote && input.dueLabel ? (
              <Text style={s.titleMeta}>Balance due: {input.dueLabel}</Text>
            ) : null}
            {input.eventDateLabel ? (
              <Text style={s.titleMeta}>
                Event date: {input.eventDateLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Hero image lives on the quote (the sales document). The order
            invoice stays lean — no hero. */}
        {!slimInvoice && input.heroImageUrl ? (
          <Image src={input.heroImageUrl} style={s.hero} />
        ) : null}

        {/* Parties / logistics */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.label}>{isQuote ? "Prepared for" : partyWord}</Text>
            <Text style={[s.value, { fontFamily: "Helvetica-Bold" }]}>
              {input.customer.name}
            </Text>
            <Text style={s.value}>{input.customer.email}</Text>
            {input.customer.phone ? (
              <Text style={s.value}>{input.customer.phone}</Text>
            ) : null}
            {input.customer.address ? (
              <Text style={s.value}>{input.customer.address}</Text>
            ) : null}
          </View>
          <View style={s.col}>
            <Text style={s.label}>
              {isBooking ? "Rental details" : "Event details"}
            </Text>
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
                {!isQuote && input.quoteRef ? (
                  <KV k="Quote ref" v={input.quoteRef} />
                ) : null}
                <KV k="Event date" v={input.eventDateLabel} />
                <KV k="Location" v={input.eventLocation} />
                <KV k="Items" v={String(input.items.length)} />
                <KV k="Issued" v={input.dateLabel} />
                {!isQuote ? <KV k="Due" v={input.dueLabel} /> : null}
                {isQuote ? (
                  <KV k="Valid until" v={input.validUntilLabel} />
                ) : null}
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
            <View key={i}>
              <View
                style={[s.row, it.includes ? { borderBottomWidth: 0 } : {}]}
              >
                <Text style={s.cDesc}>{it.name}</Text>
                <Text style={s.cQty}>{it.qtyLabel}</Text>
                <Text style={s.cRate}>{it.rateLabel}</Text>
                <Text style={s.cAmt}>{money(it.amountCents)}</Text>
              </View>
              {it.includes ? (
                <Text style={s.includes}>Includes: {it.includes}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(t.subtotalCents)}</Text>
          </View>
          {t.loyaltyDiscountCents ? (
            <View style={s.totalRow}>
              <Text>
                Subscriber discount
                {t.loyaltyDiscountPct ? ` (${t.loyaltyDiscountPct}%)` : ""}
              </Text>
              <Text>−{money(t.loyaltyDiscountCents)}</Text>
            </View>
          ) : null}
          {t.promoDiscountCents ? (
            <View style={s.totalRow}>
              <Text>Promo{t.promoCode ? ` (${t.promoCode})` : ""}</Text>
              <Text>−{money(t.promoDiscountCents)}</Text>
            </View>
          ) : null}
          {t.deliveryCents ? (
            <View style={s.totalRow}>
              <Text>{TRANSPORT_LABEL}</Text>
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
            <Text style={s.grandLabel}>
              {isQuote ? "Quote total" : "Total due"}
            </Text>
            <Text style={s.grandValue}>{money(t.totalCents)}</Text>
          </View>
        </View>

        {/* Payment schedule — 50% to reserve, balance before setup. */}
        <View style={s.scheduleBox} wrap={false}>
          <Text style={s.label}>Payment schedule</Text>
          {input.paymentPlan === "FULL" ? (
            <View style={s.scheduleRow}>
              <Text style={s.scheduleKey}>
                Full payment (chosen) — confirms your booking
              </Text>
              <Text style={s.scheduleVal}>{money(t.totalCents)}</Text>
            </View>
          ) : input.paymentPlan === "HALF" ? (
            <>
              <View style={s.scheduleRow}>
                <Text style={s.scheduleKey}>
                  50% deposit (chosen) — reserves your date
                </Text>
                <Text style={s.scheduleVal}>{money(half)}</Text>
              </View>
              <View style={s.scheduleRow}>
                <Text style={s.scheduleKey}>
                  Balance due 48 hours before your event
                  {input.dueLabel ? ` — ${input.dueLabel}` : ""}
                </Text>
                <Text style={s.scheduleVal}>{money(halfBalance)}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={s.scheduleRow}>
                <Text style={s.scheduleKey}>
                  Option A — 50% deposit to reserve your date
                </Text>
                <Text style={s.scheduleVal}>{money(half)}</Text>
              </View>
              <View style={s.scheduleRow}>
                <Text style={s.scheduleKey}>
                  {"     "}Balance due 48 hours before your event
                </Text>
                <Text style={s.scheduleVal}>{money(halfBalance)}</Text>
              </View>
              <View style={s.scheduleRow}>
                <Text style={s.scheduleKey}>
                  Option B — pay in full upfront
                </Text>
                <Text style={s.scheduleVal}>{money(t.totalCents)}</Text>
              </View>
            </>
          )}
          <Text style={s.payHint}>
            {Math.round(DEPOSIT_RATE * 100)}% of your total acts as a refundable
            deposit — fully refunded if you cancel at least {REFUND_NOTICE_DAYS}{" "}
            days before your event. Each rental day is one complete 24-hour
            period.
          </Text>
        </View>

        {/* Payment methods — invoice only (payment happens after acceptance). */}
        {!isQuote ? (
          <View style={s.payBox} wrap={false}>
            <Text style={s.label}>Preferred payment method</Text>
            {input.manualMode ? (
              <Text style={s.payHint}>
                Pick your plan and method on your secure invoice page
                {input.onlineUrl ? ` (${input.onlineUrl})` : ""}. We'll then
                send your payment details by email, phone, or WhatsApp — always
                check the Invoice ID we give you matches this one before you
                pay.
              </Text>
            ) : (
              <Text style={s.payHint}>
                Pick your plan and method on your secure invoice page
                {input.onlineUrl ? ` (${input.onlineUrl})` : ""} — the exact
                payment details appear there and are emailed to you instantly.
              </Text>
            )}
            <View style={s.payRow}>
              {["Zelle", "Apple Pay", "Chime", "Cash App"].map((m) => (
                <View style={s.payOpt} key={m}>
                  <View style={s.checkbox} />
                  <Text style={s.payLabel}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Anti-impersonation warning — the trust anchor on payable docs. In
            manual mode we verify by Invoice ID (payment details arrive by
            email/phone/WhatsApp), so the "on-site/official-email only" wording
            is swapped out. */}
        {!isQuote ? (
          <View style={s.warnBox} wrap={false}>
            <Text style={s.warnTitle}>⚠ {ANTI_SCAM_HEADING}</Text>
            <Text style={s.warnBody}>
              {input.manualMode
                ? "We'll send your payment details privately by email, phone, or WhatsApp. Before paying, always check that the Invoice ID we give you matches the one on this invoice — do not pay if they don't match. Unsure? Call us first."
                : ANTI_SCAM_BODY}
            </Text>
          </View>
        ) : null}

        {/* Setup requirements — quote docs, so clients can prep the site. */}
        {isQuote ? (
          <>
            <Text style={s.sectionTitle}>Setup Requirements</Text>
            {SETUP_REQUIREMENTS.map((req, i) => (
              <Text style={s.bullet} key={i}>
                {i + 1}. {req}
              </Text>
            ))}
          </>
        ) : null}

        {slimInvoice ? (
          <>
            {/* Order invoice: a short key-terms summary instead of the full
                clause list — the complete terms were shown and agreed when the
                client accepted the quote. */}
            <View style={s.scheduleBox} wrap={false}>
              <Text style={s.label}>Key terms</Text>
              <Text style={s.bullet}>
                • Each rental day is one complete 24-hour period.
              </Text>
              <Text style={s.bullet}>
                • {Math.round(DEPOSIT_RATE * 100)}% of your total is a
                refundable deposit — fully refunded if you cancel at least{" "}
                {REFUND_NOTICE_DAYS} days before your event.
              </Text>
              <Text style={s.bullet}>
                • Any balance is due 48 hours before your event.
              </Text>
              <Text style={[s.payHint, { marginTop: 6, marginBottom: 0 }]}>
                Full terms &amp; conditions: {SITE}/terms-of-service — agreed
                when you accepted your quote.
              </Text>
            </View>
            <Text style={[s.ack, { marginTop: 12 }]}>
              Choosing your payment plan and paying on your secure invoice page
              {input.onlineUrl ? ` (${input.onlineUrl})` : ""} confirms your
              acceptance of this invoice and its terms. Prefer paper? Sign and
              return it to {CONTACT_EMAIL}.
            </Text>
          </>
        ) : (
          <>
            {/* Terms — full clause list on quotes & booking agreements. */}
            <Text style={s.sectionTitle}>
              {isQuote
                ? "Quote Terms & Conditions"
                : isBooking
                  ? "Rental Terms, Conditions & Company Policies"
                  : "Order Terms & Conditions"}
            </Text>
            {terms.map((c, i) => (
              <Text style={s.clause} key={i}>
                <Text style={s.clauseLead}>
                  {i + 1}. {c.t}{" "}
                </Text>
                {c.b}
              </Text>
            ))}

            {/* Acceptance & signatures */}
            <Text style={s.sectionTitle} wrap={false}>
              Acceptance &amp; Signatures
            </Text>
            <Text style={s.ack}>
              By {isQuote ? "accepting this Quote" : "signing below"}, the{" "}
              {partyWord} confirms they have read, understood, and agree to this{" "}
              {isQuote
                ? "Quote"
                : isBooking
                  ? "Invoice & Agreement"
                  : "Invoice"}{" "}
              in full, including the Terms &amp; Conditions
              {isBooking
                ? ", Company Policies, assumption of risk, and indemnification"
                : ""}{" "}
              set out above.
            </Text>
            <View style={s.signRow} wrap={false}>
              <View style={s.signCol}>
                <Text style={[s.label, { marginBottom: 4 }]}>{partyWord}</Text>
                <Text style={s.signName}>{input.customer.name}</Text>
                <View style={s.signLineRow}>
                  <View style={s.signLineWide} />
                  <View style={s.signLineDate} />
                </View>
                <View style={s.signLineRow}>
                  <Text style={[s.signLabel, { flex: 2 }]}>Signature</Text>
                  <Text style={[s.signLabel, { flex: 1 }]}>Date</Text>
                </View>
              </View>
              <View style={s.signCol}>
                <Text style={[s.label, { marginBottom: 4 }]}>
                  For Big Wave Slides
                </Text>
                <Text style={s.signName}>Big Wave Slides</Text>
                <View style={s.signLineRow}>
                  <View style={s.signLineWide} />
                  <View style={s.signLineDate} />
                </View>
                <View style={s.signLineRow}>
                  <Text style={[s.signLabel, { flex: 2 }]}>
                    Authorized signature
                  </Text>
                  <Text style={[s.signLabel, { flex: 1 }]}>Date</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <Text style={s.returnNote}>
          {isQuote
            ? `The fastest way to book: review and accept this quote online${
                input.onlineUrl ? ` at ${input.onlineUrl}` : ""
              } — your invoice is issued instantly. Prefer email? Sign this quote and send it back to ${CONTACT_EMAIL}. Questions? We're always happy to help.`
            : `Whenever you're ready to go ahead, choose your payment plan on your invoice page${
                input.onlineUrl ? ` at ${input.onlineUrl}` : ""
              } — or sign this invoice and send it back to us at ${CONTACT_EMAIL}, and we'll take care of the rest.${
                isBooking
                  ? " You can also sign online using the link in your email."
                  : ""
              } Any questions? We're always happy to help.`}
        </Text>

        <View style={s.footer} fixed>
          <Text>
            Big Wave Slides · {CONTACT_EMAIL} · {CONTACT_PHONE}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/** Render a branded quote or invoice PDF to a Buffer. */
export async function generateQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return renderToBuffer(<QuoteDoc input={input} />);
}
