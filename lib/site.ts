// lib/site.ts
// The one place that decides which hostname IS this site.
//
// Why this file exists: for a while the entire site was live twice — once on
// bigwavesslides.com and once on bigwaveslides.com (one 's') — as two separate
// deployments. Each served the full ~560-page site and each declared ITSELF
// canonical, so Google was shown two complete copies of the same site and asked
// to pick. It picked neither, which is why the site didn't rank even for its
// own brand name. Duplicate hosts also split every backlink: citations pointing
// at the alias built authority the canonical host never received.
//
// The rule now: one host is canonical, everything else 301s to it. Because the
// constants live here rather than in an env var, a deployment that is
// mis-configured (an alias project still carrying its own NEXT_PUBLIC_SITE_URL)
// still emits canonical URLs for the right host and still redirects to it. The
// code is the source of truth, not the dashboard.
//
// Kept dependency-free on purpose: middleware.ts imports it and runs on the
// edge for every page request.

/** The single host every canonical URL, sitemap entry and redirect targets. */
export const CANONICAL_HOST = "www.bigwavesslides.com";

/** Canonical origin, e.g. for absolute URLs built outside a request context. */
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

/**
 * Every production hostname that has served this site and must now fold into
 * CANONICAL_HOST. Deliberately an explicit allowlist rather than a pattern:
 * localhost, *.vercel.app previews and any future staging host must NOT be
 * redirected, or local dev and preview deployments break.
 */
export const ALIAS_HOSTS: readonly string[] = [
  // Apex → www. Canonicals must match the host verified in Search Console.
  "bigwavesslides.com",
  // The one-'s' typo domain that ran as a full duplicate deployment.
  "bigwaveslides.com",
  "www.bigwaveslides.com",
];

/** Strip the port so `example.com:443` matches `example.com`. */
function bareHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? "";
}

/** True when `host` is a known production alias that should 301 to canonical. */
export function isAliasHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return ALIAS_HOSTS.includes(bareHost(host));
}

/**
 * Normalise any absolute site URL onto the canonical host.
 *
 * Applied to NEXT_PUBLIC_SITE_URL so canonical tags, hreflang, OG URLs, JSON-LD
 * and the sitemap all agree on one host even if the deployed env var is the
 * apex, the alias domain, or has a trailing slash. Non-production hosts
 * (localhost, previews) pass through untouched.
 */
export function canonicalSiteUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (bareHost(u.host) === CANONICAL_HOST || isAliasHost(u.host)) {
      return CANONICAL_ORIGIN;
    }
    return u.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}
