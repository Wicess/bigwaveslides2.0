import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Individual service pages were merged into the single /services page. We keep
 * this route as a redirect so old/bookmarked /services/<slug> links land on the
 * matching section (via the #slug anchor) instead of 404ing.
 */
export default async function ServiceRedirect({ params }: Props) {
  const { locale, slug } = await params;
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  redirect({ href: `/services#${slug}`, locale: safeLocale });
}
