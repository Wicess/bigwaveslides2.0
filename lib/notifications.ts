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
import { generateQuotePdf, type QuotePdfInput } from "@/lib/pdf/quote-pdf";
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

/** Best-effort PDF quote generation — never blocks the email if it fails. */
async function buildQuoteAttachment(
  input: QuotePdfInput,
): Promise<EmailAttachment[]> {
  try {
    const content = await generateQuotePdf(input);
    return [{ filename: `Big-Wave-Slides-Quote-${input.number}.pdf`, content }];
  } catch (error) {
    console.error("[pdf error]", error);
    return [];
  }
}

/* ───────────────── Orders ───────────────── */

export type OrderEmailInput = {
  orderNumber: string;
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
  }[];
  subtotalCents: number;
  totalCents: number;
  locale: string;
};

export async function notifyOrderRequest(o: OrderEmailInput): Promise<void> {
  const attachments = await buildQuoteAttachment({
    kind: "order",
    number: o.orderNumber,
    dateLabel: formatDate(new Date(), o.locale),
    heroImageUrl: o.heroImageUrl,
    customer: {
      name: o.name,
      email: o.email,
      phone: o.phone,
      address: o.address,
    },
    items: o.items.map((i) => ({
      name: i.name,
      qtyLabel: String(i.quantity),
      rateLabel: formatPrice(i.unitPriceCents, o.locale),
      amountCents: i.lineTotalCents,
    })),
    totals: { subtotalCents: o.subtotalCents, totalCents: o.totalCents },
    locale: o.locale,
  });

  const rows: EmailRow[] = [
    { label: "Reference", value: o.orderNumber },
    {
      label: "Items",
      value: String(o.items.reduce((n, i) => n + i.quantity, 0)),
    },
    { label: "Estimated total", value: formatPrice(o.totalCents, o.locale) },
  ];

  await sendEmail({
    to: o.email,
    replyTo: CONTACT_EMAIL,
    subject: `Your Big Wave Slides quote — ${o.orderNumber}`,
    attachments,
    html: renderEmail({
      heading: `Thanks, ${o.name.split(" ")[0] || o.name}! Your quote is attached`,
      preheader:
        "Your personalized quote is attached as a PDF. Sign it and reply to confirm your order.",
      intro:
        "Thanks for your order request with Big Wave Slides. Your personalized quote is attached as a PDF. To confirm your order, please review and sign the attached quote, then return it by replying to this email. We'll follow up with an invoice and next steps.",
      rows,
      cta: {
        label: "Reply to confirm",
        url: `mailto:${CONTACT_EMAIL}?subject=Accept%20quote%20${o.orderNumber}`,
      },
      outro:
        "Have a question first? Just reply to this email and a real person will help.",
    }),
  });

  const admins = await adminRecipients();
  if (admins.length) {
    await sendEmail({
      to: admins,
      replyTo: o.email,
      subject: `New order request — ${o.orderNumber}`,
      attachments,
      html: renderEmail({
        heading: "New order request",
        intro: `${o.name} (${o.email}${o.phone ? `, ${o.phone}` : ""}) submitted an order request. The generated quote PDF is attached.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin/orders") },
      }),
    });
  }
  await notifyAdminWhatsApp(
    `🛒 New order ${o.orderNumber} from ${o.name} — ${formatPrice(o.totalCents, o.locale)}`,
  );
}

/* ───────────────── Bookings ───────────────── */

export type BookingEmailInput = {
  bookingNumber: string;
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
    { label: "Reference", value: b.bookingNumber },
    { label: "Event dates", value: datesLabel },
    { label: "Estimated total", value: formatPrice(b.totalCents, b.locale) },
  ];

  await sendEmail({
    to: b.email,
    replyTo: CONTACT_EMAIL,
    subject: `Your Big Wave Slides rental quote — ${b.bookingNumber}`,
    attachments,
    html: renderEmail({
      heading: `Thanks, ${b.name.split(" ")[0] || b.name}! Your rental quote is attached`,
      preheader:
        "Your rental agreement is attached. Sign and return it to confirm your dates.",
      intro:
        "Thanks for your booking request — we've tentatively held your dates. Your rental quote & agreement is attached as a PDF. To confirm your booking, you'll need to sign the attached agreement and return it to us (reply to this email, or sign online). Once received, we'll send your invoice and lock in your dates.",
      rows,
      cta: b.contractNumber
        ? {
            label: "Review & sign online",
            url: siteUrl(`/contract/${b.contractNumber}`),
          }
        : {
            label: "Reply to confirm",
            url: `mailto:${CONTACT_EMAIL}?subject=Accept%20quote%20${b.bookingNumber}`,
          },
      outro: `Please sign the attached agreement and return it to ${CONTACT_EMAIL}. Questions? Just reply and we'll help.`,
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
        intro: `${b.name} (${b.email}${b.phone ? `, ${b.phone}` : ""}) requested a booking for ${datesLabel}. Confirm it in admin to lock the dates. The quote PDF is attached.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin/bookings") },
      }),
    });
  }
  await notifyAdminWhatsApp(
    `📅 New booking ${b.bookingNumber} from ${b.name} — ${datesLabel}`,
  );
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
}

/* ───────────────── Contact ───────────────── */

export async function notifyContact(c: {
  name: string;
  email: string;
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
