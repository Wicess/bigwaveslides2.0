import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { BRAND_EMAIL, brandLogoUrl } from "@/lib/brand";
import { CANONICAL_ORIGIN } from "@/lib/site";

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

export const FROM = env.SMTP_FROM ?? `Splash Republic <${BRAND_EMAIL}>`;

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export type EmailAttachment = { filename: string; content: Buffer };

/** Split "Name <email>" into parts for the Brevo API payload. */
function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match && match[2]) {
    return { name: match[1] || "Splash Republic", email: match[2] };
  }
  return { name: "Splash Republic", email: value.trim() };
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
  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to]).map(
    (email) => ({ email }),
  );
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
      console.error(
        "[email] FAILED via Brevo",
        res.status,
        await res.text().catch(() => ""),
      );
      return { ok: false, error: `brevo ${res.status}` };
    }
    console.info(
      `[email] sent via Brevo: "${opts.subject}" → ${Array.isArray(opts.to) ? opts.to.join(", ") : opts.to}`,
    );
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
    // No email provider configured at runtime — this is why "emails don't send".
    // Set BREVO_API_KEY (or SMTP_*) in the environment and RESTART the server.
    console.warn(
      `[email] NO PROVIDER configured (BREVO_API_KEY / SMTP_* missing) — skipped: "${opts.subject}" → ${opts.to}`,
    );
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

const CONTACT_EMAIL = BRAND_EMAIL;
// Hosted on R2 CDN so it renders in email clients independently of site deploys.
const EMAIL_LOGO = brandLogoUrl(CANONICAL_ORIGIN);

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
  /** Prominent, select-to-copy value (e.g. a payment destination). */
  copyable?: { label: string; value: string };
  /** Big bold anti-impersonation code the reader cross-checks with the site. */
  securityCode?: { label: string; value: string; note: string };
  /** Receipt-style hero: a large bold amount with a caption (e.g. "Paid …"). */
  receipt?: { amount: string; caption: string };
  cta?: { label: string; url: string };
  outro?: string;
  /** Contact phone for the footer. Omitted when unset, so emails never print a
      number that Settings → Contact doesn't currently publish on the site. */
  phone?: string | null;
}): string {
  const preheader = opts.preheader ?? opts.intro;

  const receiptBlock = opts.receipt
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td>
        <div style="color:#0f172a;font-size:38px;font-weight:800;line-height:1.1;letter-spacing:-0.02em">${escape(opts.receipt.amount)}</div>
        <div style="color:#16a34a;font-size:13px;font-weight:700;margin-top:6px">${escape(opts.receipt.caption)}</div>
      </td></tr></table>`
    : "";

  const securityCodeBlock = opts.securityCode
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td align="center" style="background:#eef6ff;border:1.5px solid #0099FF;border-radius:12px;padding:16px 18px">
        <div style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px">${escape(opts.securityCode.label)}</div>
        <div style="color:#003366;font-size:34px;font-weight:800;letter-spacing:0.14em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;line-height:1.2">${escape(opts.securityCode.value)}</div>
        <div style="color:#6b7280;font-size:12px;line-height:1.5;margin-top:6px">${escape(opts.securityCode.note)}</div>
      </td></tr></table>`
    : "";

  const copyableBlock = opts.copyable
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#f1f8ff;border:1.5px solid #0099FF;border-radius:12px;padding:16px 18px">
        <div style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">${escape(opts.copyable.label)}</div>
        <div style="color:#0f172a;font-size:19px;font-weight:700;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;word-break:break-all;line-height:1.4">${escape(opts.copyable.value)}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:6px">Tap &amp; hold to copy</div>
      </td></tr></table>`
    : "";

  // Only show the website link when it's a real public URL — never leak a
  // localhost dev address into a customer's inbox.
  const siteLink = /localhost|127\.0\.0\.1/.test(SITE)
    ? ""
    : `&nbsp;·&nbsp;<a href="${SITE}" style="color:#0099FF;text-decoration:none">${SITE.replace(/^https?:\/\//, "")}</a>`;

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
          <img src="${EMAIL_LOGO}" alt="Splash Republic" height="52" style="display:block;height:52px;width:auto;border:0;outline:none" />
        </td></tr>
        <tr><td style="padding:30px 32px">
          <h1 style="margin:0 0 10px;color:#0f172a;font-size:23px;line-height:1.25">${escape(opts.heading)}</h1>
          <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.65">${escape(opts.intro)}</p>
          ${receiptBlock}
          ${securityCodeBlock}
          ${copyableBlock}
          ${quoteBlock}
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;margin:14px 0">${rows}</table>` : ""}
          ${cta}
          ${opts.outro ? `<p style="margin:18px 0 0;color:#6b7280;font-size:13px;line-height:1.6">${escape(opts.outro)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #eef2f7">
          <p style="margin:0 0 4px;color:#475569;font-size:13px;font-weight:600">Splash Republic</p>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
            <a href="mailto:${CONTACT_EMAIL}" style="color:#0099FF;text-decoration:none">${CONTACT_EMAIL}</a>
            ${
              opts.phone?.trim()
                ? `&nbsp;·&nbsp;<a href="tel:${escape(opts.phone.replace(/[^+\d]/g, ""))}" style="color:#0099FF;text-decoration:none">${escape(opts.phone)}</a>`
                : ""
            }
            ${siteLink}
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
