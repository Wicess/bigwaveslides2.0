import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getShopProducts, getProductCategories } from "@/server/data/products";
import { parseShopQuery } from "@/lib/shop-query";
import { PageHeader } from "@/components/ui/page-header";
import { ShopView } from "@/components/shop/shop-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Shop" });
  return { title: t("title"), description: t("desc") };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Shop");
  const sp = await searchParams;
  const query = parseShopQuery(sp);

  const [categories, listing] = await Promise.all([
    getProductCategories().catch(() => []),
    getShopProducts(query),
  ]);

  return (
    <main>
      <PageHeader tone="brand" eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />
      <ShopView
        locale={locale}
        categories={categories}
        items={listing.items}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        query={query.q}
      />
    </main>
  );
}
