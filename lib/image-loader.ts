// lib/image-loader.ts
// Custom next/image loader so we optimize images WITHOUT Vercel's (billed)
// optimizer. Behaviour is chosen by NEXT_PUBLIC_IMAGE_CDN:
//
//   "wsrv"       → resize + convert to modern formats via wsrv.nl, a free
//                  Cloudflare-backed image proxy that works with any public URL
//                  (including our pub-*.r2.dev images). Best zero-infra option.
//   "cloudflare" → Cloudflare Image Resizing (/cdn-cgi/image/...). Requires the
//                  images to be served through a Cloudflare-proxied domain with
//                  Transformations enabled (e.g. media.bigwaveslides.com).
//   unset/other  → passthrough: serve the original file (no optimization, no
//                  Vercel cost). Safe default so nothing ever breaks.
//
// Flip it on in production by setting NEXT_PUBLIC_IMAGE_CDN=wsrv.

type LoaderArgs = { src: string; width: number; quality?: number };

const MODE = process.env.NEXT_PUBLIC_IMAGE_CDN;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Default behaviour: resize remote (R2/Unsplash/etc.) images through wsrv.nl —
// a free, Cloudflare-backed image proxy — so we ship right-sized WebP instead
// of full-resolution originals, with ZERO Vercel optimizer cost. Local/relative
// assets pass through untouched. Set NEXT_PUBLIC_IMAGE_CDN=off to disable, or
// =cloudflare to use Cloudflare Image Resizing on a proxied domain instead.
function useWsrv(src: string): boolean {
  if (MODE === "off") return false;
  if (MODE === "wsrv") return true;
  if (MODE === "cloudflare") return false;
  // Auto: optimize only absolute http(s) images (our R2 CDN + remote hosts).
  return src.startsWith("http");
}

export default function imageLoader({
  src,
  width,
  quality,
}: LoaderArgs): string {
  // Floor the quality at 82: next/image defaults to 75, which visibly softens
  // detailed marketing photos once re-encoded to WebP. 82 keeps them crisp
  // while still far smaller than the full-resolution originals.
  const q = Math.max(quality ?? 82, 82);

  // Never transform data URIs or SVGs.
  if (src.startsWith("data:") || src.endsWith(".svg")) return src;

  if (useWsrv(src)) {
    return wsrvUrl(src.startsWith("http") ? src : `${SITE}${src}`, width, q);
  }

  if (MODE === "cloudflare") {
    const opts = `width=${width},quality=${q},format=auto,fit=cover`;
    if (src.startsWith("http")) {
      try {
        const u = new URL(src);
        return `${u.origin}/cdn-cgi/image/${opts}${u.pathname}${u.search}`;
      } catch {
        return src;
      }
    }
    return `/cdn-cgi/image/${opts}${src}`;
  }

  // Passthrough — original image, no optimization.
  return src;
}

/**
 * Build a wsrv.nl transform URL — resized + re-encoded to WebP.
 *
 * IMPORTANT: wsrv.nl does NOT support `output=avif` — it returns HTTP 400, which
 * breaks every image on the site. WebP is the modern format it reliably serves,
 * and at q82 it's already ~25-35% smaller than the source JPEG with no visible
 * quality loss. Do not switch this to avif.
 */
function wsrvUrl(absolute: string, width: number, q: number): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(
    absolute,
  )}&w=${width}&q=${q}&output=webp`;
}

/**
 * Optimize a plain `<img>` source for cases where `next/image` isn't used
 * (transparent logos, full-bleed decorative covers). Returns a resized WebP URL
 * for remote images; passes data URIs, SVGs and local/relative assets through
 * untouched. Respects NEXT_PUBLIC_IMAGE_CDN=off.
 */
export function optimizedSrc(src: string, width: number, quality = 82): string {
  if (!src || src.startsWith("data:") || src.endsWith(".svg")) return src;
  if (!useWsrv(src) || !src.startsWith("http")) return src;
  return wsrvUrl(src, width, Math.max(quality, 82));
}
