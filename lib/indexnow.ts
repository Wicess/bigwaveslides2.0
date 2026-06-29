// lib/indexnow.ts
// IndexNow integration — instantly notifies Bing, Yandex, Seznam, etc. when a
// URL is added or updated, instead of waiting for a crawl. The key is published
// at /<key>.txt (public/) so search engines can verify ownership.
//
// IMPORTANT: NEXT_PUBLIC_SITE_URL must be the canonical host that serves the key
// file WITHOUT a redirect (e.g. https://bigwaveslides.com if the apex is your
// primary Vercel domain). If the host redirects (apex⇄www), IndexNow can't
// verify the key.
import { routing } from "@/i18n/routing";

const KEY = "a6c8a198654f4812ae52d2692674c8a2";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/**
 * Submit one or more absolute URLs to IndexNow. Fire-and-forget: failures are
 * logged but never block the caller. No-op if the site URL isn't configured.
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!SITE || urls.length === 0) return;
  let host: string;
  try {
    host = new URL(SITE).host;
  } catch {
    return;
  }
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`IndexNow returned ${res.status} for ${urls.length} URL(s)`);
    }
  } catch (err) {
    console.error("IndexNow submit failed:", err);
  }
}

/** Build absolute URLs for a path across every locale (e.g. /en/... and /fr/...). */
export function localizedUrls(path: string): string[] {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return routing.locales.map((l) => `${SITE}/${l}${clean}`);
}
