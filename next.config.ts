import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Whatever host R2_PUBLIC_URL points at is a legitimate image source. Derived
// rather than hardcoded so moving the bucket behind a custom domain (e.g.
// media.splashrep.com) is a one-value env change, not a code edit. The
// literal **.r2.dev stays so existing rows still render mid-migration —
// see scripts/rehost-images.ts for rewriting stored URLs.
const r2Hostname = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Optimize OFF Vercel via a custom loader (lib/image-loader.ts). Safe
    // passthrough by default; set NEXT_PUBLIC_IMAGE_CDN=wsrv (free, works with
    // our r2.dev images) or =cloudflare to turn on real resizing + AVIF/WebP,
    // never touching Vercel's billed optimizer.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      ...(r2Hostname && !r2Hostname.endsWith(".r2.dev")
        ? [{ protocol: "https" as const, hostname: r2Hostname }]
        : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  eslint: {
    // Lint runs as its own gate (`npm run lint`); keep it out of the build
    // pipeline to avoid the flat-config serialization bug in next build.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // The three listing pages await searchParams, which makes them dynamic.
        // Next then sends "private, no-cache, no-store" on every response, so
        // nothing in front of them ever caches: each crawl and each visit runs a
        // serverless render. They are also three of the most-crawled URLs on the
        // site, which is the worst possible combination.
        //
        // Safe to cache because nothing in the server render is per-viewer: the
        // pages read no cookies, headers or session, and the account chip is a
        // client component that reads its cookie in the browser. The homepage is
        // already prerendered and served to everyone from the same HTML.
        //
        // 5 minutes is deliberately much tighter than the rest of the site (the
        // product and city pages sit on 6-hour ISR). Admin edits call
        // revalidateTag("products"), which clears the data cache immediately, so
        // this window is the only lag an edit can pick up — and s-maxage applies
        // to the shared CDN copy only, never the visitor's own browser.
        source: "/:locale(en)/:page(shop|rent|blog)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=86400",
          },
          // Marker: proves whether this block reached the response at all, so a
          // missing Cache-Control can be read as "Next overrode it" rather than
          // "the deploy has not landed". Removed once that is settled.
          { key: "X-Listing-Cache", value: "config" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Report-only: logs violations to the console without blocking
            // anything, so it can't break the live site. Review the reports,
            // tighten as needed, then switch the key to "Content-Security-Policy"
            // to enforce.
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "connect-src 'self' https:",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
