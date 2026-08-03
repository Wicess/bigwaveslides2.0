import "server-only";
import {
  sendEmail,
  renderEmail,
  siteUrl,
  type EmailRow,
  type EmailAttachment,
} from "@/lib/email";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { notifyAdminWhatsApp } from "@/lib/whatsapp";
import { notifyAdminNtfy } from "@/lib/ntfy";
import { generateQuotePdf, type QuotePdfInput } from "@/lib/pdf/quote-pdf";
import { orderSecurityCode } from "@/lib/security-code";
import { env } from "@/lib/env";

const CONTACT_EMAIL = "contact@bigwaveslides.com";

// Always-on admin recipients (in addition to the settings email + env extras).
// These monitored inboxes guarantee delivery even if the contact@ self-send
// is filtered to spam.
const DEFAULT_ADMIN_NOTIFY = ["kenjones086@gmail.com"];

/** All inboxes that should receive admin notifications (settings + defaults + env). */
async function adminRecipients(): Promise<string[]> {
  const settings = await getSettings().catch((): SiteSettings => ({}));
  const primary = settings.contact?.email ?? env.SMTP_USER ?? null;
  const extras = (env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const all = [primary, ...DEFAULT_ADMIN_NOTIFY, ...extras].filter(
    (e): e is string => Boolean(e),
  );
  return Array.from(new Set(all.map((e) => e.toLowerCase())));
}

/** Best-effort PDF generation — never blocks the email if it fails.
 *  Filename matches the document type (no docType = invoice, the PDF default). */
async function buildQuoteAttachment(
  input: QuotePdfInput,
): Promise<EmailAttachment[]> {
  try {
    const content = await generateQuotePdf(input);
    const doc = input.docType === "quote" ? "Quote" : "Invoice";
    return [
      { filename: `Big-Wave-Slides-${doc}-${input.number}.pdf`, content },
    ];
  } catch (error) {
    console.error("[pdf error]", error);
    return [];
  }
}

/* ───────────────── Orders ───────────────── */

export type OrderEmailInput = {
  orderNumber: string;
  /** DB id — used to deep-link the admin push notification to this order. */
  orderId?: string;
  /** Geo the order was placed from (IP-resolved at checkout). */
  geo?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  };
  name: string;
  email: string;
  phone?: string;
  address?: string;
  heroImageUrl?: string;
  items: {
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    /** RENT lines price per day: quantity is the number of rental days. */
    mode?: "BUY" | "RENT";
  }[];
  subtotalCents: number;
  deliveryFeeCents?: number;
  totalCents: number;
  /** Event date entered at checkout (yyyy-mm-dd) — printed on the invoice. */
  eventDate?: string;
  locale: string;
};

const RENTAL_INCLUDES =
  "slide, commercial blower, anchoring, setup safety & professional workmanship, basic insurance, sanitizing before delivery, pickup. Each rental day is one complete 24-hour period";

export async function notifyOrderRequest(o: OrderEmailInput): Promise<void> {
  const isRentalOrder = o.items.some((i) => i.mode === "RENT");
  const eventDay = o.eventDate ? new Date(`${o.eventDate}T12:00:00`) : null;
  const eventDateLabel =
    eventDay && !Number.isNaN(eventDay.getTime())
      ? formatDate(eventDay, o.locale)
      : undefined;
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const onlineUrl = siteUrl(
    `${o.locale === "fr" ? "/fr" : ""}/order/${o.orderNumber}`,
  );
  const attachments = await buildQuoteAttachment({
    kind: "order",
    docType: "quote",
    number: o.orderNumber,
    dateLabel: formatDate(new Date(), o.locale),
    validUntilLabel: formatDate(validUntil, o.locale),
    eventDateLabel,
    eventLocation: o.address,
    party: isRentalOrder ? "Renter" : "Buyer",
    onlineUrl,
    heroImageUrl: o.heroImageUrl,
    customer: {
      name: o.name,
      email: o.email,
      phone: o.phone,
      address: o.address,
    },
    items: o.items.map((i) => {
      const rent = i.mode === "RENT";
      return {
        name: i.name,
        // For rentals, quantity = number of days, priced per day.
        qtyLabel: rent
          ? `${i.quantity} ${i.quantity === 1 ? "day" : "days"}`
          : String(i.quantity),
        rateLabel: rent
          ? `${formatPrice(i.unitPriceCents, o.locale)}/day`
          : formatPrice(i.unitPriceCents, o.locale),
        amountCents: i.lineTotalCents,
        includes: rent ? RENTAL_INCLUDES : undefined,
      };
    }),
    totals: {
      subtotalCents: o.subtotalCents,
      deliveryCents: o.deliveryFeeCents || undefined,
      totalCents: o.totalCents,
    },
    locale: o.locale,
  });

  const rows: EmailRow[] = [
    { label: "Quote no", value: o.orderNumber },
    ...(eventDateLabel ? [{ label: "Event date", value: eventDateLabel }] : []),
    { label: "Items", value: String(o.items.length) },
    { label: "Quote total", value: formatPrice(o.totalCents, o.locale) },
  ];

  await sendEmail({
    to: o.email,
    replyTo: CONTACT_EMAIL,
    subject: `Your Big Wave Slides quote — ${o.orderNumber}`,
    attachments,
    html: renderEmail({
      heading: `Thanks, ${o.name.split(" ")[0] || o.name}! Your quote is ready`,
      preheader:
        "Review your quote online, then accept it to receive your invoice — or reach out with any questions.",
      intro:
        "Thanks for your request with Big Wave Slides! Your personalized quote is attached as a PDF and also available on your secure quote page, together with our terms & conditions. When you're ready, accept the quote online — your official invoice is issued instantly and you can reserve your date with a 50% deposit or full payment. Not sure about something? Contact us first, no obligation.",
      rows,
      cta: { label: "View & accept your quote", url: onlineUrl },
      outro:
        "Have a question first? Just reply to this email or call +1 (614) 302-5899 — a real person will help.",
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: o.email,
      subject: `New quote request — ${o.orderNumber}`,
      attachments,
      html: renderEmail({
        heading: "New quote request",
        intro: `${o.name} (${o.email}${o.phone ? `, ${o.phone}` : ""}) requested a quote. The quote PDF is attached; they've been sent their quote page to accept online.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin/orders") },
      }),
    });
  }
  await notifyAdminWhatsApp(
    `🛒 New quote request ${o.orderNumber} from ${o.name} — ${formatPrice(o.totalCents, o.locale)}`,
  );
  // Push to the owner's phone; tapping opens this order in the admin panel.
  const placedFrom = [o.geo?.city, o.geo?.region, o.geo?.country]
    .filter(Boolean)
    .join(", ");
  await notifyAdminNtfy({
    title: `🌊 Quote requested ${o.orderNumber} — ${formatPrice(o.totalCents, o.locale)}`,
    message: [
      o.name,
      `📞 ${o.phone || "no phone"} · ✉️ ${o.email}`,
      // Delivery/shipping address the customer entered at checkout. Always
      // shown — "no address given" tells the owner to ask for it on follow-up.
      `🚚 Delivery: ${o.address || "no address given"}`,
      ...(placedFrom ? [`📍 Placed from ${placedFrom}`] : []),
      ...o.items.map((i) => {
        const line =
          i.mode === "RENT"
            ? `${i.name} — ${i.quantity} ${i.quantity === 1 ? "day" : "days"}`
            : `${i.quantity}× ${i.name}`;
        return `${line} · ${formatPrice(i.lineTotalCents, o.locale)}`;
      }),
      `💰 Total: ${formatPrice(o.totalCents, o.locale)}`,
      "Tap to open the order in admin.",
    ].join("\n"),
    clickUrl: siteUrl(
      o.orderId ? `/admin/orders/${o.orderId}` : "/admin/orders",
    ),
    tags: ["shopping_cart", "ocean"],
    priority: 4,
  });
}

/* ───────────────── Bookings ───────────────── */

export type BookingEmailInput = {
  bookingNumber: string;
  /** DB id — used to deep-link the admin push notification to this booking. */
  bookingId?: string;
  contractNumber?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  heroImageUrl?: string;
  startAt: Date;
  endAt: Date;
  eventType?: string;
  headcount?: string;
  surfaceType?: string;
  items: {
    name: string;
    days: number;
    dailyRateCents: number;
    lineTotalCents: number;
  }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  pickupFeeCents: number;
  depositCents: number;
  totalCents: number;
  locale: string;
};

export async function notifyBookingRequest(
  b: BookingEmailInput,
): Promise<void> {
  const datesLabel = `${formatDate(b.startAt, b.locale)} – ${formatDate(b.endAt, b.locale)}`;

  const durationDays = b.items[0]?.days ?? 0;
  const attachments = await buildQuoteAttachment({
    kind: "booking",
    number: b.bookingNumber,
    dateLabel: formatDate(new Date(), b.locale),
    eventDateLabel: formatDate(b.startAt, b.locale),
    heroImageUrl: b.heroImageUrl,
    customer: {
      name: b.name,
      email: b.email,
      phone: b.phone,
      address: b.address,
    },
    rental: {
      arrival: formatDate(b.startAt, b.locale),
      ret: formatDate(b.endAt, b.locale),
      duration: durationDays
        ? `${durationDays} day${durationDays === 1 ? "" : "s"}`
        : undefined,
      type: b.eventType,
      headcount: b.headcount,
      surface: b.surfaceType,
      location: b.address,
    },
    items: b.items.map((i) => ({
      name: i.name,
      qtyLabel: String(i.days),
      rateLabel: `${formatPrice(i.dailyRateCents, b.locale)}/day`,
      amountCents: i.lineTotalCents,
    })),
    totals: {
      subtotalCents: b.subtotalCents,
      deliveryCents: b.deliveryFeeCents,
      pickupCents: b.pickupFeeCents,
      depositCents: b.depositCents,
      totalCents: b.totalCents,
    },
    locale: b.locale,
  });

  const rows: EmailRow[] = [
    { label: "Invoice no", value: b.bookingNumber },
    { label: "Event dates", value: datesLabel },
    { label: "Total due", value: formatPrice(b.totalCents, b.locale) },
  ];

  await sendEmail({
    to: b.email,
    replyTo: CONTACT_EMAIL,
    subject: `Your Big Wave Slides rental invoice — ${b.bookingNumber}`,
    attachments,
    html: renderEmail({
      heading: `Thanks, ${b.name.split(" ")[0] || b.name}! Your rental invoice is attached`,
      preheader:
        "Your rental invoice & agreement is attached. Sign and return it to confirm your dates — no further invoice will follow.",
      intro:
        "Thanks for your booking request — we've tentatively held your dates. Your rental invoice & agreement is attached as a PDF — this is the only invoice you'll receive. To confirm your booking, sign it, tick your preferred payment method, and return it to us (reply to this email, or sign online). We'll reply with the payment details and lock in your dates.",
      rows,
      cta: b.contractNumber
        ? {
            label: "Review & sign online",
            url: siteUrl(`/contract/${b.contractNumber}`),
          }
        : {
            label: "Reply to confirm",
            url: `mailto:${CONTACT_EMAIL}?subject=Accept%20invoice%20${b.bookingNumber}`,
          },
      outro: `Please sign the attached invoice & agreement and return it to ${CONTACT_EMAIL}. Questions? Just reply and we'll help.`,
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: b.email,
      subject: `New booking request — ${b.bookingNumber}`,
      attachments,
      html: renderEmail({
        heading: "New booking request",
        intro: `${b.name} (${b.email}${b.phone ? `, ${b.phone}` : ""}) requested a booking for ${datesLabel}. Confirm it in admin to lock the dates. The invoice PDF is attached.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin") },
      }),
    });
  }
  await notifyAdminWhatsApp(
    `📅 New booking ${b.bookingNumber} from ${b.name} — ${datesLabel}`,
  );
  // Push to the owner's phone; tapping opens this booking in the admin panel.
  await notifyAdminNtfy({
    title: `New booking ${b.bookingNumber} — ${formatPrice(b.totalCents, b.locale)}`,
    message: [
      b.name,
      `📞 ${b.phone || "no phone"} · ✉️ ${b.email}`,
      `🚚 Event address: ${b.address || "no address given"}`,
      datesLabel,
      ...b.items.map(
        (i) =>
          `${i.name} — ${i.days} ${i.days === 1 ? "day" : "days"} · ${formatPrice(i.lineTotalCents, b.locale)}`,
      ),
      `💰 Total: ${formatPrice(b.totalCents, b.locale)}`,
      "Tap to open the booking in admin.",
    ].join("\n"),
    clickUrl: siteUrl("/admin"),
    tags: ["calendar", "ocean"],
    priority: 4,
  });
}

/* ───────────────── Quotes ───────────────── */

export async function notifyQuoteRequest(q: {
  quoteNumber: string;
  name: string;
  email: string;
}): Promise<void> {
  await sendEmail({
    to: q.email,
    subject: `We got your quote request (${q.quoteNumber})`,
    html: renderEmail({
      heading: "Quote requested! 🎉",
      intro: `Hi ${q.name}, thanks for reaching out. We'll review your request and email a personalized quote shortly.`,
      rows: [{ label: "Reference", value: q.quoteNumber }],
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: q.email,
      subject: `New quote request — ${q.quoteNumber}`,
      html: renderEmail({
        heading: "New quote request",
        intro: `${q.name} (${q.email}) requested a quote.`,
        cta: { label: "Open in admin", url: siteUrl("/admin/quotes") },
      }),
    });
  }
  // Push to the owner's phone; tapping opens the quotes list in admin.
  await notifyAdminNtfy({
    title: `New quote request ${q.quoteNumber}`,
    message: [q.name, `✉️ ${q.email}`, "Tap to open quotes in admin."].join(
      "\n",
    ),
    clickUrl: siteUrl("/admin/quotes"),
    tags: ["memo", "ocean"],
    priority: 4,
  });
}

/* ───────────────── Contact ───────────────── */

export async function notifyContact(c: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<void> {
  const supportEmail = "contact@bigwaveslides.com";

  await sendEmail({
    to: c.email,
    replyTo: supportEmail,
    subject: "We received your message — Big Wave Slides",
    html: renderEmail({
      heading: `Thanks, ${c.name.split(" ")[0] || c.name}!`,
      preheader:
        "We've received your message and a team member will reach out shortly.",
      intro:
        "Thanks for reaching out to Big Wave Slides. A member of our team will get back to you very shortly. Here's a copy of what you sent us:",
      quote: c.message,
      cta: { label: "Email us directly", url: `mailto:${supportEmail}` },
      outro: `If you haven't heard from us within a few minutes, please email us directly at ${supportEmail} and we'll respond right away.`,
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    const replySubject = encodeURIComponent(
      `Re: your Big Wave Slides enquiry${c.subject ? ` (${c.subject})` : ""}`,
    );
    await sendEmail({
      to: admins,
      replyTo: c.email,
      subject: `New inquiry${c.subject ? `: ${c.subject}` : ""} — ${c.name}`,
      html: renderEmail({
        heading: "New contact inquiry",
        preheader: `${c.name} sent a message via the contact form.`,
        intro: `${c.name} (${c.email}) sent a message via the website contact form:`,
        quote: c.message,
        rows: [
          { label: "Name", value: c.name },
          { label: "Email", value: c.email },
          ...(c.subject ? [{ label: "Subject", value: c.subject }] : []),
        ],
        cta: {
          label: `Reply to ${c.name.split(" ")[0] || c.name}`,
          url: `mailto:${c.email}?subject=${replySubject}`,
        },
      }),
    });
  }
  // Push to the owner's phone; tapping opens the inquiries list in admin.
  await notifyAdminNtfy({
    title: `New message — ${c.name}${c.subject ? `: ${c.subject}` : ""}`,
    message: [
      `📞 ${c.phone || "no phone"} · ✉️ ${c.email}`,
      c.message.length > 300 ? `${c.message.slice(0, 300)}…` : c.message,
      "Tap to open messages in admin.",
    ].join("\n"),
    clickUrl: siteUrl("/admin/contacts"),
    tags: ["envelope", "ocean"],
    priority: 4,
  });
}

/* ───────────────── Status updates (admin-triggered) ───────────────── */

export async function notifyStatusUpdate(s: {
  email: string;
  name: string;
  reference: string;
  kind: "order" | "booking";
  statusLabel: string;
  note?: string;
}): Promise<void> {
  await sendEmail({
    to: s.email,
    subject: `Update on your ${s.kind} ${s.reference}`,
    html: renderEmail({
      heading: `Your ${s.kind} was updated`,
      intro: `Hi ${s.name}, the status of your ${s.kind} ${s.reference} is now: ${s.statusLabel}.`,
      outro: s.note,
      cta: {
        label: "View in your account",
        url: siteUrl(
          s.kind === "order" ? "/account/orders" : "/account/bookings",
        ),
      },
    }),
  });
}

/* ───────────────── Newsletter ───────────────── */

export async function notifyNewsletterSignup(s: {
  email: string;
  locale?: string;
}): Promise<void> {
  // Welcome the subscriber.
  await sendEmail({
    to: s.email,
    replyTo: CONTACT_EMAIL,
    subject: "You're on the list! 🌊 Big Wave Slides",
    html: renderEmail({
      heading: "Welcome to the Big Wave family!",
      preheader:
        "Thanks for subscribing — splashy tips, offers, and new slides are headed your way.",
      intro:
        "Thanks for subscribing to Big Wave Slides. You'll be the first to hear about new slides, seasonal offers, and party-planning tips. Ready to make a splash?",
      cta: { label: "Browse our slides", url: siteUrl("/rent") },
      outro:
        "Not you, or changed your mind? Just reply to this email and we'll remove you right away.",
    }),
  });

  // Alert the team.
  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: s.email,
      subject: `New newsletter subscriber — ${s.email}`,
      html: renderEmail({
        heading: "New newsletter subscriber",
        intro: `${s.email} just subscribed to the newsletter.`,
        rows: [{ label: "Email", value: s.email }],
        cta: { label: "View subscribers", url: siteUrl("/admin/newsletter") },
      }),
    });
  }
  // Push to the owner's phone; tapping opens the subscriber list in admin.
  await notifyAdminNtfy({
    title: "New newsletter subscriber",
    message: [
      `✉️ ${s.email}`,
      ...(s.locale
        ? [`Language: ${s.locale === "fr" ? "French" : "English"}`]
        : []),
      "Tap to open subscribers in admin.",
    ].join("\n"),
    clickUrl: siteUrl("/admin/newsletter"),
    tags: ["mailbox_with_mail", "ocean"],
    // Lower priority than orders — a subscribe is nice, not urgent.
    priority: 3,
  });
}

/* ───────────────── Abandoned cart ───────────────── */

export async function sendAbandonedCartReminder(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "You left something in your cart 🌊",
    html: renderEmail({
      heading: "Still thinking it over?",
      intro:
        "Your cart is waiting! Finish your request in a couple of clicks — no payment needed, we'll send you a personalized quote.",
      cta: { label: "Return to your cart", url: siteUrl("/cart") },
    }),
  });
}

/* ───────────── Quote → invoice → payment journey emails ───────────── */

import type { Prisma } from "@prisma/client";
import { ANTI_SCAM_HEADING, ANTI_SCAM_BODY } from "@/lib/anti-scam";
import {
  amountDueCents,
  balanceCents,
  cryptoDiscountCents,
  discountLabelFor,
  effectiveTotalCents,
  type PaymentPlan,
} from "@/lib/payment-plan";

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

const SCAM_OUTRO = `⚠️ ${ANTI_SCAM_HEADING}: ${ANTI_SCAM_BODY}`;

function orderPagePath(o: OrderWithItems): string {
  return `/${o.locale}/order/${o.orderNumber}`;
}

/** Build the PDF input for an order at its current stage. */
export function orderToPdfInput(
  o: OrderWithItems,
  docType: "quote" | "invoice",
): QuotePdfInput {
  const addr = (o.deliveryAddress ?? {}) as { address?: string; city?: string };
  const eventLocation =
    [addr.address, addr.city].filter(Boolean).join(", ") || undefined;
  return {
    kind: "order",
    docType,
    number:
      docType === "invoice"
        ? (o.invoiceNumber ?? o.orderNumber)
        : o.orderNumber,
    quoteRef: docType === "invoice" ? o.orderNumber : undefined,
    dateLabel: formatDate(
      docType === "invoice" ? (o.invoiceIssuedAt ?? o.createdAt) : o.createdAt,
      o.locale,
    ),
    validUntilLabel:
      docType === "quote" && o.quoteValidUntil
        ? formatDate(o.quoteValidUntil, o.locale)
        : undefined,
    dueLabel:
      docType === "invoice" && o.invoiceDueAt
        ? formatDate(o.invoiceDueAt, o.locale)
        : undefined,
    eventDateLabel: o.eventDate ? formatDate(o.eventDate, o.locale) : undefined,
    eventLocation,
    party: "Renter",
    paymentPlan: (o.paymentPlan as PaymentPlan | null) ?? undefined,
    onlineUrl: siteUrl(orderPagePath(o)),
    customer: {
      name: o.guestName ?? "Customer",
      email: o.guestEmail ?? "",
      phone: o.guestPhone ?? undefined,
      address: eventLocation,
    },
    items: o.items.map((i) => {
      // Rental lines carry a "(Rental)" suffix from checkout; qty = days.
      const rent = /\(rental\)/i.test(i.name);
      return {
        name: i.name,
        qtyLabel: rent
          ? `${i.quantity} ${i.quantity === 1 ? "day" : "days"}`
          : String(i.quantity),
        rateLabel: rent
          ? `${formatPrice(i.unitPriceCents, o.locale)}/day`
          : formatPrice(i.unitPriceCents, o.locale),
        amountCents: i.lineTotalCents,
        includes: rent ? RENTAL_INCLUDES : undefined,
      };
    }),
    totals: {
      subtotalCents: o.subtotalCents,
      deliveryCents: o.deliveryFeeCents || undefined,
      loyaltyDiscountCents: o.loyaltyDiscountCents || undefined,
      loyaltyDiscountPct: o.loyaltyDiscountPct || undefined,
      totalCents: o.totalCents,
    },
    locale: o.locale,
  };
}

/** Quote accepted → email the invoice (PDF + on-site link) to the client. */
export async function sendInvoiceIssuedEmails(
  o: OrderWithItems,
): Promise<void> {
  if (!o.guestEmail) return;
  const inv = o.invoiceNumber ?? o.orderNumber;
  let attachments: EmailAttachment[] = [];
  try {
    const pdf = await generateQuotePdf(orderToPdfInput(o, "invoice"));
    attachments = [
      { filename: `Big-Wave-Slides-Invoice-${inv}.pdf`, content: pdf },
    ];
  } catch (e) {
    console.error("[pdf error] invoice", e);
  }
  const half = amountDueCents("HALF", o.totalCents);
  await sendEmail({
    to: o.guestEmail,
    replyTo: CONTACT_EMAIL,
    subject: `Your invoice ${inv} — Big Wave Slides`,
    attachments,
    html: renderEmail({
      heading: "Quote confirmed — your invoice is ready 🎉",
      preheader:
        "Choose 50% deposit or full payment on your secure invoice page to lock in your date.",
      intro:
        `Thanks for confirming your quote! Your official invoice ${inv} is attached and also available on your secure invoice page. ` +
        `To reserve your date, open the invoice page and choose how you'd like to pay: a 50% deposit (${formatPrice(half, o.locale)}) with the balance due 48 hours before your event, or the full amount (${formatPrice(o.totalCents, o.locale)}) now.`,
      rows: [
        { label: "Invoice no", value: inv },
        ...(o.eventDate
          ? [{ label: "Event date", value: formatDate(o.eventDate, o.locale) }]
          : []),
        ...(o.invoiceDueAt
          ? [{ label: "Due date", value: formatDate(o.invoiceDueAt, o.locale) }]
          : []),
        { label: "Total", value: formatPrice(o.totalCents, o.locale) },
      ],
      cta: { label: "Open your invoice & pay", url: siteUrl(orderPagePath(o)) },
      outro: SCAM_OUTRO,
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: o.guestEmail,
      subject: `Quote accepted → invoice ${inv} — ${o.orderNumber}`,
      attachments,
      html: renderEmail({
        heading: "Quote accepted 🎉",
        intro: `${o.guestName ?? "A client"} accepted quote ${o.orderNumber}. Invoice ${inv} was issued and emailed. They're now choosing a payment plan.`,
        rows: [
          { label: "Total", value: formatPrice(o.totalCents, o.locale) },
          { label: "Client", value: `${o.guestName ?? "?"} · ${o.guestEmail}` },
        ],
        cta: { label: "Open in admin", url: siteUrl(`/admin/orders/${o.id}`) },
      }),
    });
  }
}

/** Payment details resolved (auto or admin-posted) → the ONE payment email. */
export async function sendPaymentDetailsEmail(
  o: OrderWithItems,
  dueCentsOverride?: number,
): Promise<void> {
  if (!o.guestEmail || !o.paymentDestination) return;
  const plan = (o.paymentPlan as PaymentPlan | null) ?? "FULL";
  const payable = effectiveTotalCents(o.totalCents, o.paymentMethodKey);
  const discount = cryptoDiscountCents(o.totalCents, o.paymentMethodKey);
  const due = dueCentsOverride ?? amountDueCents(plan, payable);
  const balance = balanceCents(plan, payable);
  const inv = o.invoiceNumber ?? o.orderNumber;
  await sendEmail({
    to: o.guestEmail,
    replyTo: CONTACT_EMAIL,
    subject: `Payment details for invoice ${inv} — Big Wave Slides`,
    html: renderEmail({
      heading: "Your payment details are ready 💳",
      preheader: `Send ${formatPrice(due, o.locale)} via ${o.paymentMethodLabel ?? "your chosen method"} to lock in your booking.`,
      intro:
        plan === "HALF"
          ? `You've chosen the 50% deposit plan. Send ${formatPrice(due, o.locale)} now to reserve your date — the remaining ${formatPrice(balance, o.locale)} is due 48 hours before your event.`
          : `You've chosen to pay in full. Send ${formatPrice(due, o.locale)} to complete your booking.`,
      securityCode: {
        label: "Your security code",
        value: orderSecurityCode(o.orderNumber),
        note: "This must match the code shown on your secure payment page. If it doesn't, do not pay — contact us.",
      },
      copyable: { label: "Send payment to", value: o.paymentDestination },
      quote: o.paymentInstructions ?? undefined,
      rows: [
        ...(discount
          ? [
              {
                label: `Instant-pay discount (${discountLabelFor(o.paymentMethodKey) ?? ""})`,
                value: `−${formatPrice(discount, o.locale)}`,
              },
            ]
          : []),
        { label: "Amount due now", value: formatPrice(due, o.locale) },
        {
          label: "Method",
          value: o.paymentMethodLabel ?? o.paymentMethodKey ?? "—",
        },
        ...(o.paymentNetwork
          ? [{ label: "Network", value: o.paymentNetwork }]
          : []),
        { label: "Reference", value: inv },
      ],
      cta: {
        label: "Open your invoice page",
        url: siteUrl(orderPagePath(o)),
      },
      outro: `Once you've sent it, submit your transaction ID or a payment screenshot on your invoice page so we can confirm right away. ${SCAM_OUTRO}`,
    }),
  });
}

/** Client submitted payment proof → alert every admin inbox. */
export async function notifyProofSubmitted(o: OrderWithItems): Promise<void> {
  const admins = await adminRecipients();
  if (!admins.length) return;
  const plan = (o.paymentPlan as PaymentPlan | null) ?? "FULL";
  const due = amountDueCents(
    plan,
    effectiveTotalCents(o.totalCents, o.paymentMethodKey),
  );
  await sendEmail({
    to: admins,
    replyTo: o.guestEmail ?? undefined,
    subject: `Payment proof submitted — ${o.orderNumber}`,
    html: renderEmail({
      heading: "Client says they've paid 💵",
      intro: `${o.guestName ?? "A client"} submitted payment proof for invoice ${o.invoiceNumber ?? o.orderNumber}. Verify the money arrived, then mark it paid in admin.`,
      rows: [
        { label: "Expected", value: formatPrice(due, o.locale) },
        {
          label: "Plan",
          value: plan === "HALF" ? "50% deposit" : "Full payment",
        },
        {
          label: "Method",
          value: o.paymentMethodLabel ?? o.paymentMethodKey ?? "—",
        },
        ...(o.proofTxId
          ? [{ label: "Their reference", value: o.proofTxId }]
          : []),
        ...(o.proofImageUrl
          ? [{ label: "Screenshot", value: o.proofImageUrl }]
          : []),
      ],
      quote: o.proofNote ?? undefined,
      cta: { label: "Open in admin", url: siteUrl(`/admin/orders/${o.id}`) },
    }),
  });
}

/** Owner verified the money arrived → a clean, summarised receipt email:
    big amount paid, then Total / Amount paid / Amount remaining (or Paid in
    full). Doubles as the client's "you're booked" confirmation. */
export async function sendPaymentConfirmedEmail(
  o: OrderWithItems,
): Promise<void> {
  if (!o.guestEmail) return;
  const money = (c: number) => formatPrice(c, o.locale);
  const payableTotal = effectiveTotalCents(o.totalCents, o.paymentMethodKey);
  // Cumulative amount received (markOrderPaid has already added this payment).
  const paid = o.amountPaidCents;
  const remaining = Math.max(0, payableTotal - paid);
  const paidInFull = remaining <= 0;
  const paidOn = formatDate(o.paidAt ?? new Date(), o.locale);
  const inv = o.invoiceNumber ?? o.orderNumber;

  await sendEmail({
    to: o.guestEmail,
    replyTo: CONTACT_EMAIL,
    subject: `Receipt — ${money(paid)} paid (${inv})`,
    html: renderEmail({
      heading: "Payment received — you're booked! 🎉",
      preheader: paidInFull
        ? "Paid in full — your booking is confirmed."
        : `Deposit received — ${money(remaining)} due 48h before your event.`,
      intro: paidInFull
        ? "Thank you — here's your receipt. Your booking is confirmed and nothing else is owed. We'll reach out before your event to confirm delivery timing."
        : "Thank you — here's your receipt. Your date is officially reserved; the remaining balance is due 48 hours before your event. We'll reach out before then to confirm delivery timing.",
      receipt: { amount: money(paid), caption: `Paid ${paidOn}` },
      rows: [
        { label: "Receipt for", value: inv },
        {
          label: "Payment method",
          value: o.paymentMethodLabel ?? o.paymentMethodKey ?? "—",
        },
        ...(o.eventDate
          ? [{ label: "Event date", value: formatDate(o.eventDate, o.locale) }]
          : []),
        { label: "Order total", value: money(payableTotal) },
        { label: "Amount paid", value: money(paid) },
        {
          label: paidInFull ? "Balance" : "Amount remaining",
          value: paidInFull
            ? "Paid in full"
            : `${money(remaining)}${o.invoiceDueAt ? ` · due ${formatDate(o.invoiceDueAt, o.locale)}` : ""}`,
        },
      ],
      cta: { label: "View your booking", url: siteUrl(orderPagePath(o)) },
      outro: SCAM_OUTRO,
    }),
  });
}

/** Owner couldn't verify the payment → ask the client to double-check. */
export async function sendProofRejectedEmail(
  o: OrderWithItems,
  reason?: string,
): Promise<void> {
  if (!o.guestEmail) return;
  await sendEmail({
    to: o.guestEmail,
    replyTo: CONTACT_EMAIL,
    subject: `We couldn't verify your payment yet — ${o.invoiceNumber ?? o.orderNumber}`,
    html: renderEmail({
      heading: "We couldn't verify your payment yet",
      intro:
        "We checked but couldn't match a payment to your invoice yet — this is usually just a timing or reference issue, nothing to worry about. Please double-check the amount, destination, and that your invoice number was included as the reference, then resubmit on your invoice page. If you did send it, reply to this email with a screenshot and we'll track it down together.",
      quote: reason || undefined,
      rows: [{ label: "Invoice", value: o.invoiceNumber ?? o.orderNumber }],
      cta: { label: "Open your invoice page", url: siteUrl(orderPagePath(o)) },
      outro: `Questions? Call +1 (614) 302-5899 — a real person will help. ${SCAM_OUTRO}`,
    }),
  });
}
