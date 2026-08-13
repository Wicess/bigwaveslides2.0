import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { CANONICAL_HOST, isAliasHost } from "./lib/site";

const intlMiddleware = createMiddleware(routing);

// Paths matched below purely so the host redirect can reach them. next-intl
// must not touch these — /sitemap.xml and /robots.txt are not localized, and
// prefixing them with a locale would 404 the two files Google reads first.
const UNLOCALIZED = new Set(["/sitemap.xml", "/robots.txt"]);

export default function middleware(req: NextRequest) {
  // ─── One site, one host ───────────────────────────────────────────────────
  // A second domain serving the same pages splits ranking signals between two
  // copies and strands every backlink built against the alias. Anything on a
  // known alias host is permanently redirected to the canonical host, path and
  // query intact, BEFORE any locale handling — so /sitemap.xml and /robots.txt
  // move too, and Google is told once that the alias is not a separate site.
  // Behind Vercel's proxy the public hostname arrives as x-forwarded-host;
  // `host` is the fallback for direct requests and local dev.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (isAliasHost(host)) {
    const url = new URL(req.url);
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  if (UNLOCALIZED.has(req.nextUrl.pathname)) return NextResponse.next();

  // ─── Retired French locale ────────────────────────────────────────────────
  // The site was bilingual until 2026-08-13. Those /fr/* URLs were submitted to
  // Google and Bing, so they must not simply disappear: an indexed URL that
  // starts 404ing drops out of the index and takes any link equity with it.
  //
  // This redirect has to run BEFORE next-intl. With "fr" gone from
  // routing.locales, next-intl no longer recognises the segment as a locale and
  // would treat it as an ordinary path — rewriting /fr/rent to /en/fr/rent,
  // which 404s. So we map the path ourselves and 301 (permanent, so Google
  // transfers the old URL's signals to the English page and drops the French
  // one from the index).
  const { pathname } = req.nextUrl;
  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname.slice(3)}`;
    return NextResponse.redirect(url, 301);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // All localized pages: everything except API routes, Next internals, the
    // admin area (not localized), and any file with an extension.
    "/((?!api|_next|_vercel|admin|.*\\..*).*)",
    // Added so the canonical-host redirect above covers them. Excluded from
    // next-intl by UNLOCALIZED.
    "/sitemap.xml",
    "/robots.txt",
  ],
};
