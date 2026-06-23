import "server-only";
import { env } from "@/lib/env";

const GRAPH = "https://graph.facebook.com/v21.0";

export type WhatsAppResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Send a plain-text WhatsApp message via the Cloud API. Best-effort: skipped
 * when credentials aren't configured, never throws into the caller. Note that
 * free-form text only delivers within the 24-hour customer-service window;
 * outside it, an approved template is required (wire templates when available).
 */
export async function sendWhatsApp(to: string, body: string): Promise<WhatsAppResult> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: true, skipped: true };
  }
  const digits = to.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "invalid recipient" };

  try {
    const res = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits,
        type: "text",
        text: { preview_url: false, body },
      }),
    });
    if (!res.ok) return { ok: false, error: `status ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "request failed" };
  }
}

/** Notify the business WhatsApp number of a new request (if configured). */
export async function notifyAdminWhatsApp(message: string): Promise<void> {
  const to = env.WHATSAPP_PHONE_NUMBER;
  if (!to) return;
  await sendWhatsApp(to, message);
}
