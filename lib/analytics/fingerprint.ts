import "server-only";
import { createHash } from "node:crypto";
import type { GeoInfo } from "@/lib/analytics/geo";

/**
 * Stable identity for cookieless clients.
 *
 * Bots, crawlers and privacy browsers don't persist our visitor cookie, so the
 * tracker used to mint a fresh random id on every request — the same Googlebot
 * showed up as dozens of separate "visitors". Instead, when there's no cookie
 * we derive a deterministic key from the user-agent + coarse geo (country /
 * region / city). Identical clients therefore collapse onto a single Visitor,
 * and a returning visitor who cleared cookies re-attaches to the same record.
 *
 * Cookie'd real browsers never reach this path (their cookie is authoritative),
 * so normal human tracking is unaffected. The only trade-off is that two
 * distinct cookieless clients with a byte-identical user-agent in the same city
 * are treated as one — an acceptable, rare merge that overwhelmingly affects
 * bots, which is exactly what we want to deduplicate.
 */
export function visitorFingerprint(
  userAgent: string | null | undefined,
  geo: Pick<GeoInfo, "countryCode" | "regionCode" | "city">,
): string {
  const basis = [
    (userAgent ?? "").trim().toLowerCase(),
    (geo.countryCode ?? "").toUpperCase(),
    (geo.regionCode ?? "").toUpperCase(),
    (geo.city ?? "").trim().toLowerCase(),
  ].join("|");
  return "fp_" + createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

/**
 * Deterministic session key for a cookieless client: the fingerprint identity
 * bucketed into 30-minute windows, so a bot's burst of hits groups into one
 * Visit instead of one Visit per event. Unique per (visitor, 30-min window),
 * which satisfies the `Visit.sessionKey` uniqueness constraint.
 */
export function sessionFingerprint(visitorKey: string, at: Date): string {
  const bucket = Math.floor(at.getTime() / (1000 * 60 * 30));
  return (
    "fps_" +
    createHash("sha256")
      .update(`${visitorKey}|${bucket}`)
      .digest("hex")
      .slice(0, 32)
  );
}
