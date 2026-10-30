import { CANONICAL_ORIGIN } from "@/lib/site";

/** An absolute URL on this site, for links that leave it (ntfy alerts, push). */
export function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_ORIGIN).replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
