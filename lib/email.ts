import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return cached;
}

export const FROM = env.SMTP_FROM ?? "Big Wave Slides <contact@bigwaveslides.com>";

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export type EmailAttachment = { filename: string; content: Buffer };

/** Split "Name <email>" into parts for the Brevo API payload. */
function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match && match[2]) {
    return { name: match[1] || "Big Wave Slides", email: match[2] };
  }
  return { name: "Big Wave Slides", email: value.trim() };
}

/** Send via Brevo's transactional API (uses the xkeysib- API key). */
async function sendViaBrevo(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<SendResult> {
  const sender = parseFrom(FROM);
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((email) => ({ email }));
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY as string,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: recipients,
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text ?? stripHtml(opts.html),
        ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
        ...(opts.attachments?.length
          ? {
              attachment: opts.attachments.map((a) => ({
                name: a.filename,
                content: a.content.toString("base64"),
              })),
            }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email error] brevo", res.status, await res.text().catch(() => ""));
      return { ok: false, error: `brevo ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[email error] brevo", error);
    return { ok: false, error: "send failed" };
  }
}

/**
 * Send a transactional email. Prefers the Brevo API (if BREVO_API_KEY is set),
 * otherwise falls back to SMTP. Best-effort: if no provider is configured the
 * call is skipped (not an error), and failures never throw into the caller so a
 * missed email can't break a request/booking submission.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<SendResult> {
  if (env.BREVO_API_KEY) {
    return sendViaBrevo(opts);
  }

  const transport = getTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email skipped] ${opts.subject} → ${opts.to}`);
    }
    return { ok: true, skipped: true };
  }
  try {
    await transport.sendMail({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? stripHtml(opts.html),
      replyTo: opts.replyTo,
      attachments: opts.attachments,
    });
    return { ok: true };
  } catch (error) {
    console.error("[email error]", error);
    return { ok: false, error: "send failed" };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ───────────────── Branded layout ───────────────── */

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CONTACT_EMAIL = "contact@bigwaveslides.com";
const CONTACT_PHONE = "+1 (614) 302-5899";
// Hosted on R2 CDN so it renders in email clients independently of site deploys.
const EMAIL_LOGO = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/brand/logo-email.png";

export type EmailRow = { label: string; value: string };

/** Branded, email-client-safe HTML wrapper for all transactional emails. */
export function renderEmail(opts: {
  heading: string;
  intro: string;
  /** Hidden inbox preview text. */
  preheader?: string;
  rows?: EmailRow[];
  /** Highlighted block (e.g. the visitor's message). */
  quote?: string;
  cta?: { label: string; url: string };
  outro?: string;
}): string {
  const preheader = opts.preheader ?? opts.intro;

  const rows = (opts.rows ?? [])
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:14px">${escape(r.label)}</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right">${escape(r.value)}</td>
      </tr>`,
    )
    .join("");

  const quoteBlock = opts.quote
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#f1f8ff;border-left:4px solid #0099FF;border-radius:10px;padding:16px 18px;color:#334155;font-size:15px;line-height:1.6;white-space:pre-line">${escape(opts.quote)}</td></tr></table>`
    : "";

  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="border-radius:999px;background:linear-gradient(135deg,#0099FF,#00D4FF)"><a href="${escape(opts.cta.url)}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 30px;border-radius:999px;font-size:15px">${escape(opts.cta.label)} &rarr;</a></td></tr></table>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
  <body style="margin:0;background:#eef2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f8;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(2,32,71,0.08)">
        <tr><td style="height:5px;line-height:5px;font-size:0;background:linear-gradient(135deg,#0099FF,#00D4FF)">&nbsp;</td></tr>
        <tr><td style="background:#ffffff;padding:26px 32px 18px;border-bottom:1px solid #eef2f7" align="left">
          <img src="${EMAIL_LOGO}" alt="Big Wave Slides" height="60" style="display:block;height:60px;width:auto;border:0;outline:none" />
          <div style="color:#0099FF;font-size:13px;font-weight:700;margin-top:10px">Big waves, bigger smiles.</div>
        </td></tr>
        <tr><td style="padding:30px 32px">
          <h1 style="margin:0 0 10px;color:#0f172a;font-size:23px;line-height:1.25">${escape(opts.heading)}</h1>
          <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.65">${escape(opts.intro)}</p>
          ${quoteBlock}
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;margin:14px 0">${rows}</table>` : ""}
          ${cta}
          ${opts.outro ? `<p style="margin:18px 0 0;color:#6b7280;font-size:13px;line-height:1.6">${escape(opts.outro)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #eef2f7">
          <p style="margin:0 0 4px;color:#475569;font-size:13px;font-weight:600">Big Wave Slides</p>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
            Premium water slides to buy, rent &amp; install.<br>
            <a href="mailto:${CONTACT_EMAIL}" style="color:#0099FF;text-decoration:none">${CONTACT_EMAIL}</a>
            &nbsp;·&nbsp;
            <a href="tel:+16143025899" style="color:#0099FF;text-decoration:none">${CONTACT_PHONE}</a>
            &nbsp;·&nbsp;
            <a href="${SITE}" style="color:#0099FF;text-decoration:none">${SITE.replace(/^https?:\/\//, "")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function siteUrl(path = ""): string {
  return `${SITE}${path}`;
}
