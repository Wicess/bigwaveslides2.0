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

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const q = quality ?? 72;

  // Never transform data URIs or SVGs.
  if (src.startsWith("data:") || src.endsWith(".svg")) return src;

  if (MODE === "wsrv") {
    const absolute = src.startsWith("http") ? src : `${SITE}${src}`;
    // output=webp + we (allow webp); n=-1 keeps animation; il = interlace.
    return `https://wsrv.nl/?url=${encodeURIComponent(absolute)}&w=${width}&q=${q}&output=webp`;
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
