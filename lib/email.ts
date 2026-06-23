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

/**
 * Send a transactional email. Best-effort: if SMTP isn't configured the call is
 * skipped (not an error), and failures never throw into the caller so a missed
 * email can't break a request/booking submission.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
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
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? stripHtml(opts.html),
      replyTo: opts.replyTo,
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

export type EmailRow = { label: string; value: string };

/** Branded HTML wrapper for all transactional emails (table-based, email-safe). */
export function renderEmail(opts: {
  heading: string;
  intro: string;
  rows?: EmailRow[];
  cta?: { label: string; url: string };
  outro?: string;
}): string {
  const rows = (opts.rows ?? [])
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px">${escape(r.label)}</td>
        <td style="padding:6px 0;color:#111111;font-size:14px;font-weight:600;text-align:right">${escape(r.value)}</td>
      </tr>`,
    )
    .join("");

  const cta = opts.cta
    ? `<tr><td style="padding:24px 0 8px"><a href="${escape(opts.cta.url)}" style="display:inline-block;background:#0099FF;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:999px;font-size:15px">${escape(opts.cta.label)}</a></td></tr>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e9f0">
        <tr><td style="background:linear-gradient(135deg,#0099FF,#00D4FF);padding:20px 28px">
          <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.02em">🌊 Big Wave Slides</span>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 8px;color:#111111;font-size:22px">${escape(opts.heading)}</h1>
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">${escape(opts.intro)}</p>
          ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;margin:8px 0">${rows}</table>` : ""}
          <table role="presentation" cellpadding="0" cellspacing="0">${cta}</table>
          ${opts.outro ? `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.6">${escape(opts.outro)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#fafbfc;border-top:1px solid #eef2f7">
          <p style="margin:0;color:#9ca3af;font-size:12px">Big Wave Slides · <a href="${SITE}" style="color:#0099FF;text-decoration:none">${SITE.replace(/^https?:\/\//, "")}</a></p>
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
