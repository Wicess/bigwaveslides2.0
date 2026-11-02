import "server-only";
import { createHmac } from "node:crypto";
import { after } from "next/server";
import { env } from "@/lib/env";
import { pingTopic } from "@/lib/chat/notify";

/**
 * Live-chat "wake up" topics on ntfy.sh, so a browser learns about a new message the
 * moment it is written instead of polling the database for it.
 *
 * The cost rule: Neon only sleeps after five minutes with ZERO queries, so the
 * closed-chat check every 30s kept it awake for every visitor with a conversation
 * and a tab open. A browser now holds one EventSource to ntfy.sh (free, and nothing
 * on our bill) and asks the database only when a ping says there is something new.
 *
 * A ping carries NO content: no text, no name, not even which message. ntfy.sh
 * topics are public to anyone who knows the name, so the name is the secret — an
 * HMAC of the thread id under the server's existing secret (NEXTAUTH_SECRET), not
 * stored anywhere, never derivable from anything a visitor can see. Even a leaked
 * topic only reveals "something happened", and the browser still reads the
 * messages through its own cookie-checked route.
 *
 *   · thread topic  — one per conversation, pinged when the TEAM writes, edits or
 *                     removes a message (including the automatic invoice). The
 *                     customer's browser listens.
 *   · staff topic   — one for the whole inbox, pinged when a CUSTOMER writes or
 *                     opens their chat. The admin inbox listens. It is silent: it is
 *                     not the owner's phone topic (NTFY_TOPIC_CHAT), which rings.
 */

/** Always the public server: the browser subscribes to the same place, with no token. */
export const LIVE_SERVER = "https://ntfy.sh";

const DEV_SECRET = "dev-secret-change-me-in-production";

function secret(): string | null {
  if (env.NEXTAUTH_SECRET) return env.NEXTAUTH_SECRET;
  // Never derive public topics from a secret that is in the source code.
  return env.NODE_ENV === "production" ? null : DEV_SECRET;
}

function derive(prefix: string, label: string): string | null {
  const key = secret();
  if (!key) return null;
  // 40 hex chars = 160 bits; ntfy allows [-_A-Za-z0-9]{1,64}.
  const digest = createHmac("sha256", key).update(label).digest("hex");
  return `${prefix}${digest.slice(0, 40)}`;
}

/** The customer's topic for one conversation, or null when live push is unavailable. */
export function threadTopic(
  threadId: string | null | undefined,
): string | null {
  if (!threadId) return null;
  return derive("srl-", `chat-thread:${threadId}`);
}

/** The inbox's topic. Only ever sent to a signed-in admin. */
export function staffTopic(): string | null {
  return derive("srs-", "chat-staff");
}

/**
 * Publish an empty ping after the response is sent. Never awaited, never throws: a
 * missed ping is caught by the client's rare safety check, and must never cost
 * anyone a message.
 */
function schedulePing(topic: string | null): void {
  if (!topic || env.NODE_ENV === "test") return;
  const run = () => pingTopic(LIVE_SERVER, topic);
  try {
    after(run);
  } catch {
    // Outside a request (a script): send it now, still unawaited.
    void run();
  }
}

/** The team wrote, edited or removed something in this conversation. */
export function pingThread(threadId: string | null | undefined): void {
  schedulePing(threadTopic(threadId));
}

/** A customer wrote, or opened their chat. */
export function pingStaff(): void {
  schedulePing(staffTopic());
}
