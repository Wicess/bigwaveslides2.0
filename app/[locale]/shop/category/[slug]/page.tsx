import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  getShopProducts,
  getProductCategories,
  getCategoryBySlug,
} from "@/server/data/products";
import { parseShopQuery } from "@/lib/shop-query";
import { getLocalized } from "@/lib/localized";
import { PageHeader } from "@/components/ui/page-header";
import { ShopView } from "@/components/shop/shop-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: SearchParams;
};

export async function generateStaticParams() {
  const categories = await getProductCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: getLocalized(category.metaTitle ?? category.name, locale),
    description: getLocalized(category.metaDescription ?? category.description, locale),
  };
}

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const t = await getTranslations("Shop");
  const sp = await searchParams;
  const query = { ...parseShopQuery(sp), category: slug };

  const [categories, listing] = await Promise.all([
    getProductCategories().catch(() => []),
    getShopProducts(query),
  ]);

  return (
    <main>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={getLocalized(category.name, locale)}
        description={getLocalized(category.description, locale) || t("desc")}
      />
      <ShopView
        locale={locale}
        categories={categories}
        items={listing.items}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        activeCategory={slug}
        query={query.q}
      />
    </main>
  );
}
