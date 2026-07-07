import { hasLocale } from "next-intl";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Individual service pages were merged into the single /services page. This
 * route 308-redirects so old/bookmarked /services/<slug> links land on the
 * matching section — and, crucially, so Google consolidates the retired URL
 * into /services and drops the stale index entry (a temporary 307 would keep
 * the old page indexed with its outdated title).
 */
export default async function ServiceRedirect({ params }: Props) {
  const { locale, slug } = await params;
  const safeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  permanentRedirect({ href: `/services#${slug}`, locale: safeLocale });
}
