import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter for public API routes.
 * Per-instance only (resets on cold start, not shared across serverless
 * instances) — a first line of defense against abuse/scraping. For strict
 * global limits, back this with Redis/Upstash in production.
 */
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - entry.count, retryAfterSec: 0 };

  // Note: occasional cleanup avoids unbounded growth on long-lived instances.
}

/** Derive a client key from forwarded headers. */
export function clientKey(req: Request, scope: string): string {
  return clientKeyFromHeaders(req.headers, scope);
}

/**
 * Derive a client key from a Headers object (e.g. from `next/headers` inside a
 * Server Action, which has no Request).
 */
export function clientKeyFromHeaders(headers: Headers, scope: string): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}

// Periodically evict expired buckets (best-effort; safe to skip on edge).
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }, 300_000);
  // Don't keep the process alive solely for cleanup.
  (timer as { unref?: () => void }).unref?.();
}
