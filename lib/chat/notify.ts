import "server-only";
import { env } from "@/lib/env";

/**
 * The chat's phone alerts, through Splash Republic's ntfy topic (NTFY_TOPIC).
 *
 * Same shape as the rest of the site's ntfy alerts (lib/ntfy.ts): JSON publish, so
 * titles keep their emoji and punctuation. The chat adds what lib/ntfy.ts does not
 * carry: action buttons, a photo shown inside the alert, top priority, and retries,
 * because a customer waiting in the chat is the one alert that must not be lost.
 */
export interface NtfyMessage {
  /** Kept for call-site compatibility; Splash Republic has a single topic. */
  readonly topic?: string;
  readonly title: string;
  readonly body: string;
  /** Emoji short codes first (`speech_balloon`, `camera`): shown as the alert's icon. */
  readonly tags?: readonly string[];
  readonly clickUrl?: string;
  readonly actions?: readonly {
    readonly label: string;
    readonly url: string;
  }[];
  readonly attach?: { readonly url: string; readonly filename: string };
}

/** Labelled lines, one fact per line, an empty one left out. */
export function alertLines(
  lines: readonly (readonly [
    label: string,
    value: string | null | undefined | false,
  ])[],
): string {
  return lines
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([label, value]) => (label ? `${label}: ${value}` : String(value)))
    .join("\n");
}

const ATTEMPTS = 3;

export async function notify(message: NtfyMessage): Promise<boolean> {
  const topic = env.NTFY_TOPIC;
  if (!topic) {
    console.info(`[ntfy:not-configured] ${message.title}`);
    return false;
  }
  const server = (env.NTFY_SERVER ?? "https://ntfy.sh").replace(/\/$/, "");
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const payload = {
    topic,
    title: message.title,
    message: message.body.slice(0, 3800),
    priority: 5,
    ...(message.tags?.length ? { tags: [...message.tags] } : {}),
    ...(message.clickUrl ? { click: message.clickUrl } : {}),
    ...(message.actions?.length
      ? {
          actions: message.actions
            .slice(0, 3)
            .map((a) => ({
              action: "view",
              label: a.label,
              url: a.url,
              clear: true,
            })),
        }
      : {}),
    ...(message.attach
      ? { attach: message.attach.url, filename: message.attach.filename }
      : {}),
    ...(site ? { icon: `${site}/icon.png` } : {}),
  };
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(server, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(env.NTFY_TOKEN
            ? { authorization: `Bearer ${env.NTFY_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) return true;
      if (res.status < 500 && res.status !== 429) break;
    } catch {
      /* retried below */
    }
    if (attempt < ATTEMPTS)
      await new Promise((r) => setTimeout(r, 400 * attempt));
  }
  console.error(`[ntfy] chat alert not delivered: ${message.title}`);
  return false;
}
