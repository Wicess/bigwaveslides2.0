// lib/ntfy.ts
// -----------------------------------------------------------------------------
// Push notifications to the owner's phone via ntfy (https://ntfy.sh).
// The admin subscribes to the secret NTFY_TOPIC in the ntfy mobile app; every
// publish here lands as a push notification, and `clickUrl` makes tapping the
// notification open the admin panel directly on the relevant order/booking.
//
// Best-effort by design: if ntfy is down or unconfigured, checkout must never
// break — failures are logged and swallowed. Uses ntfy's JSON publish API so
// titles/messages with emoji and accents survive intact (raw HTTP headers
// don't handle UTF-8 well).
// -----------------------------------------------------------------------------
import "server-only";
import { env } from "@/lib/env";

export async function notifyAdminNtfy(opts: {
  title: string;
  message: string;
  /** Opened when the notification is tapped (deep link into /admin). */
  clickUrl?: string;
  /** ntfy emoji shortcodes shown on the notification, e.g. ["shopping_cart"]. */
  tags?: string[];
  /** 1 (min) … 5 (urgent). 4 = "high" — vibrates but doesn't override DND. */
  priority?: 1 | 2 | 3 | 4 | 5;
}): Promise<void> {
  const topic = env.NTFY_TOPIC;
  if (!topic) return; // Not configured — skip silently (e.g. local dev).
  const server = (env.NTFY_SERVER ?? "https://ntfy.sh").replace(/\/$/, "");
  try {
    const res = await fetch(server, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Only needed for self-hosted/protected servers; ntfy.sh topics are
        // open, which is why NTFY_TOPIC must stay long and unguessable.
        ...(env.NTFY_TOKEN
          ? { authorization: `Bearer ${env.NTFY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        topic,
        title: opts.title,
        message: opts.message,
        ...(opts.clickUrl ? { click: opts.clickUrl } : {}),
        tags: opts.tags ?? ["ocean"],
        priority: opts.priority ?? 4,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[ntfy] publish failed: HTTP ${res.status}`);
    }
  } catch (e) {
    console.error("[ntfy] publish failed:", e);
  }
}
