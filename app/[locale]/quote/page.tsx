import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/**
 * The standalone "Get a quote" page has been removed — quote requests now go
 * through the Contact page. We keep this route as a permanent redirect so any
 * old or bookmarked /quote links (including /quote?product=...) still land on
 * /contact instead of showing a 404.
 */
export default async function QuoteRedirect({ params }: Props) {
  const { locale } = await params;
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  redirect({ href: "/contact", locale: safeLocale });
}
