import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { CANONICAL_HOST, isAliasHost } from "./lib/site";

const intlMiddleware = createMiddleware(routing);

/** The one locale. See i18n/routing.ts. */
const EN = routing.defaultLocale;

/**
 * Retired blog URLs → the post that now owns their topic. Locale-free paths.
 *
 * Only for posts that were genuinely published and then withdrawn in favour of
 * another page. A post that was merely never finished should stay DRAFT with no
 * entry here — redirecting a URL that was never live invents a signal.
 *
 * "what-a-water-slide-rental-actually-costs" was published alongside
 * "water-slide-rental-cost-guide" and competed with it for the same query. The
 * cost guide won on integration (older, longer, cover image, tags, 7 product
 * links, cited in llms.txt); the duplicate was orphaned from the link graph.
 * See scripts/retire-duplicate-cost-guide.ts.
 */
const RETIRED_POSTS: Record<string, string> = {
  "/blog/what-a-water-slide-rental-actually-costs":
    "/blog/water-slide-rental-cost-guide",
};

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

  // ─── Retired posts ────────────────────────────────────────────────────────
  // A post set to DRAFT stops rendering, so its URL would start 404ing. That is
  // the wrong ending for a page that was live and linkable: 404 throws away
  // whatever the URL had accumulated, while a 301 hands it to the page that
  // replaced it. Keyed without the locale prefix — there is only ever one.
  const retired = RETIRED_POSTS[pathname.replace(/^\/en/, "")];
  if (retired) {
    const url = req.nextUrl.clone();
    url.pathname = `/en${retired}`;
    return NextResponse.redirect(url, 301);
  }

  // ─── Locale prefix: permanent, not temporary ──────────────────────────────
  // next-intl redirects an unprefixed path to the default locale with a 307.
  // That is the right default when the locale is negotiated per visitor — but
  // this site has exactly one locale (i18n/routing.ts), so "/" can never
  // legitimately resolve anywhere except "/en".
  //
  // The status matters. Google treats a temporary redirect as "keep indexing
  // the source, this may change back", so it does not fully consolidate the
  // source URL's signals into the target. The paths this affects are the worst
  // possible ones to leave unconsolidated: "/" is what almost every external
  // link, directory listing and social share points at, followed by /shop,
  // /rent and /blog. Search Console was reporting these as "Moved temporarily
  // (302)". Issuing the redirect ourselves, permanently, before next-intl sees
  // it consolidates them instead.
  //
  // Matched on a segment boundary, not a prefix: "/energy" starts with "/en"
  // but is not the locale.
  const isLocalized = pathname === `/${EN}` || pathname.startsWith(`/${EN}/`);
  if (!isLocalized) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${EN}` : `/${EN}${pathname}`;
    return NextResponse.redirect(url, 308);
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
