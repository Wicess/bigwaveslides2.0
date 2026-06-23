import "server-only";
import { sendEmail, renderEmail, siteUrl, type EmailRow } from "@/lib/email";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { formatPrice, formatDate } from "@/lib/format";
import { notifyAdminWhatsApp } from "@/lib/whatsapp";
import { env } from "@/lib/env";

async function adminRecipient(): Promise<string | null> {
  const settings = await getSettings().catch((): SiteSettings => ({}));
  return settings.contact?.email ?? env.SMTP_USER ?? null;
}

/* ───────────────── Orders ───────────────── */

export async function notifyOrderRequest(o: {
  orderNumber: string;
  name: string;
  email: string;
  phone?: string;
  totalCents: number;
  locale: string;
}): Promise<void> {
  const rows: EmailRow[] = [
    { label: "Reference", value: o.orderNumber },
    { label: "Estimated total", value: formatPrice(o.totalCents, o.locale) },
  ];

  await sendEmail({
    to: o.email,
    subject: `We received your order request (${o.orderNumber})`,
    html: renderEmail({
      heading: "Thanks for your request! 🌊",
      intro: `Hi ${o.name}, we've received your order request and our team will email you a quote and payment details shortly. No payment is needed yet.`,
      rows,
      cta: { label: "Visit your account", url: siteUrl("/account/orders") },
      outro: "Questions? Just reply to this email.",
    }),
  });

  const admin = await adminRecipient();
  if (admin) {
    await sendEmail({
      to: admin,
      replyTo: o.email,
      subject: `New order request — ${o.orderNumber}`,
      html: renderEmail({
        heading: "New order request",
        intro: `${o.name} (${o.email}${o.phone ? `, ${o.phone}` : ""}) submitted an order request.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin/orders") },
      }),
    });
  }
  await notifyAdminWhatsApp(`🛒 New order request ${o.orderNumber} from ${o.name} — ${formatPrice(o.totalCents, o.locale)}`);
}

/* ───────────────── Bookings ───────────────── */

export async function notifyBookingRequest(b: {
  bookingNumber: string;
  contractNumber?: string;
  name: string;
  email: string;
  phone?: string;
  startAt: Date;
  endAt: Date;
  totalCents: number;
  locale: string;
}): Promise<void> {
  const rows: EmailRow[] = [
    { label: "Reference", value: b.bookingNumber },
    { label: "Dates", value: `${formatDate(b.startAt, b.locale)} – ${formatDate(b.endAt, b.locale)}` },
    { label: "Estimated total", value: formatPrice(b.totalCents, b.locale) },
  ];

  await sendEmail({
    to: b.email,
    subject: `Your booking request is in (${b.bookingNumber})`,
    html: renderEmail({
      heading: "Booking requested! 🌊",
      intro: `Hi ${b.name}, we've tentatively held your dates. Review and sign your rental agreement to speed things up — we'll confirm availability and email payment details.`,
      rows,
      cta: b.contractNumber
        ? { label: "Review & sign agreement", url: siteUrl(`/contract/${b.contractNumber}`) }
        : { label: "Visit your account", url: siteUrl("/account/bookings") },
    }),
  });

  const admin = await adminRecipient();
  if (admin) {
    await sendEmail({
      to: admin,
      replyTo: b.email,
      subject: `New booking request — ${b.bookingNumber}`,
      html: renderEmail({
        heading: "New booking request",
        intro: `${b.name} (${b.email}${b.phone ? `, ${b.phone}` : ""}) requested a booking. Confirm it in admin to lock the dates.`,
        rows,
        cta: { label: "Open in admin", url: siteUrl("/admin/bookings") },
      }),
    });
  }
  await notifyAdminWhatsApp(
    `📅 New booking ${b.bookingNumber} from ${b.name} — ${formatDate(b.startAt, b.locale)} to ${formatDate(b.endAt, b.locale)}`,
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

  const admin = await adminRecipient();
  if (admin) {
    await sendEmail({
      to: admin,
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
  await sendEmail({
    to: c.email,
    subject: "Thanks for contacting Big Wave Slides 🌊",
    html: renderEmail({
      heading: "We got your message",
      intro: `Hi ${c.name}, thanks for reaching out — we usually reply within a few hours. Here's a copy of your message:`,
      outro: c.message,
    }),
  });

  const admin = await adminRecipient();
  if (admin) {
    await sendEmail({
      to: admin,
      replyTo: c.email,
      subject: `New inquiry${c.subject ? `: ${c.subject}` : ""} — ${c.name}`,
      html: renderEmail({
        heading: "New contact inquiry",
        intro: `${c.name} (${c.email}) sent a message:`,
        outro: c.message,
        cta: { label: "Open inbox", url: siteUrl("/admin/contacts") },
      }),
    });
  }
}

/* ───────────────── Event registration ───────────────── */

export async function notifyEventRegistration(e: {
  name: string;
  email: string;
  eventTitle: string;
}): Promise<void> {
  await sendEmail({
    to: e.email,
    subject: `You're registered: ${e.eventTitle}`,
    html: renderEmail({
      heading: "You're on the list! 🎉",
      intro: `Hi ${e.name}, your spot for "${e.eventTitle}" is reserved. We can't wait to see you there!`,
    }),
  });
}

/* ───────────────── Auth ───────────────── */

export async function sendPasswordReset(email: string, token: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: renderEmail({
      heading: "Reset your password",
      intro: "We received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can safely ignore this email.",
      cta: { label: "Choose a new password", url: siteUrl(`/reset-password?token=${token}`) },
    }),
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
        url: siteUrl(s.kind === "order" ? "/account/orders" : "/account/bookings"),
      },
    }),
  });
}

/* ───────────────── Abandoned cart ───────────────── */

export async function sendAbandonedCartReminder(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "You left something in your cart 🌊",
    html: renderEmail({
      heading: "Still thinking it over?",
      intro: "Your cart is waiting! Finish your request in a couple of clicks — no payment needed, we'll send you a personalized quote.",
      cta: { label: "Return to your cart", url: siteUrl("/cart") },
    }),
  });
}
