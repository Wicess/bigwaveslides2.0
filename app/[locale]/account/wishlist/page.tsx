import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerWishlist } from "@/server/data/account";
import { getLocalized } from "@/lib/localized";
import { WishlistGrid, type WishlistEntry } from "@/components/account/wishlist-grid";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountWishlistPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("Account");
  const products = await getCustomerWishlist(session.user.id, locale);

  const items: WishlistEntry[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: getLocalized(p.name, locale),
    image: p.media[0]?.url ?? null,
    type: p.type,
    priceCents: p.type === "SALE" ? p.salePriceCents : p.dailyRateCents,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
  }));

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_wishlist")}</h1>
      <WishlistGrid items={items} locale={locale} />
    </div>
  );
}
