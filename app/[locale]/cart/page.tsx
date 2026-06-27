import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/**
 * The cart is now a slide-in drawer; the full cart view + request form lives on
 * /checkout. Redirect any old /cart links there.
 */
export default async function CartRedirect({ params }: Props) {
  const { locale } = await params;
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  redirect({ href: "/checkout", locale: safeLocale });
}
