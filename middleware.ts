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
  // Every rule below rewrites some part of the URL, and until now each one
  // returned its own redirect. That built chains: http://splashrep.com/ cost
  // three hops (→ https, → www, → /en) before a byte of HTML was served.
  //
  // Chains are not neutral. Google follows them but discounts a little signal
  // at each hop and gives up entirely past five; Ahrefs flagged the root of
  // this site — the URL almost every external link, directory listing and
  // social share points at — as a 3xx chain. Browsers pay a full round trip
  // per hop, and each of those hops is a billed edge invocation.
  //
  // So the rules now *compose*: work out the final host and the final path,
  // then issue at most one redirect to the finished URL. Only Vercel's
  // http→https hop remains, and that one is not ours to remove.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const { pathname } = req.nextUrl;

  // ─── One site, one host ───────────────────────────────────────────────────
  // A second domain serving the same pages splits ranking signals between two
  // copies and strands every backlink built against the alias. Behind Vercel's
  // proxy the public hostname arrives as x-forwarded-host; `host` is the
  // fallback for direct requests and local dev.
  const hostIsAlias = isAliasHost(host);

  // 301 for a permanent change of address (host, retired locale, retired post),
  // 308 for the locale prefix — which is what next-intl would have issued, only
  // permanent. Google treats the two identically; 308 additionally preserves
  // the request method.
  let status = 308;
  if (hostIsAlias) status = 301;

  // ─── Path rules, applied in order to a single working value ───────────────
  // /sitemap.xml and /robots.txt are matched only so the host rule can reach
  // them. They are not localized — prefixing them with a locale would 404 the
  // two files Google reads first — so they skip the rest of the path rules.
  let path = pathname;

  if (!UNLOCALIZED.has(pathname)) {
    // ─── Retired French locale ──────────────────────────────────────────────
    // The site was bilingual until 2026-08-13. Those /fr/* URLs were submitted
    // to Google and Bing, so they must not simply disappear: an indexed URL
    // that starts 404ing drops out of the index and takes any link equity with
    // it. This must run before next-intl — with "fr" gone from routing.locales
    // next-intl no longer recognises the segment as a locale and would rewrite
    // /fr/rent to /en/fr/rent, which 404s.
    if (path === "/fr" || path.startsWith("/fr/")) {
      path = `/${EN}${path.slice(3)}`;
      status = 301;
    }

    // ─── Retired posts ──────────────────────────────────────────────────────
    // A post set to DRAFT stops rendering, so its URL would start 404ing. That
    // is the wrong ending for a page that was live and linkable: 404 throws
    // away whatever the URL had accumulated, while a 301 hands it to the page
    // that replaced it. Keyed without the locale prefix — there is only ever
    // one. Checked after the French mapping so /fr/blog/<retired> resolves to
    // its replacement in the same single hop.
    const retired =
      RETIRED_POSTS[
        path.startsWith(`/${EN}/`) ? path.slice(EN.length + 1) : path
      ];
    if (retired) {
      path = `/${EN}${retired}`;
      status = 301;
    }

    // ─── Locale prefix ──────────────────────────────────────────────────────
    // next-intl redirects an unprefixed path to the default locale with a 307.
    // That is the right default when the locale is negotiated per visitor — but
    // this site has exactly one locale (i18n/routing.ts), so "/" can never
    // legitimately resolve anywhere except "/en". A temporary redirect tells
    // Google "keep indexing the source, this may change back", so it never
    // fully consolidates the source URL's signals into the target — and the
    // paths affected are the worst possible ones to leave unconsolidated.
    //
    // Matched on a segment boundary, not a prefix: "/energy" starts with "/en"
    // but is not the locale.
    if (path !== `/${EN}` && !path.startsWith(`/${EN}/`)) {
      path = path === "/" ? `/${EN}` : `/${EN}${path}`;
    }
  }

  // ─── One redirect, or none ────────────────────────────────────────────────
  if (hostIsAlias || path !== pathname) {
    const url = req.nextUrl.clone();
    url.pathname = path;
    if (hostIsAlias) {
      url.protocol = "https:";
      url.host = CANONICAL_HOST;
      url.port = "";
    }
    return NextResponse.redirect(url, status);
  }

  if (UNLOCALIZED.has(pathname)) return NextResponse.next();

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
