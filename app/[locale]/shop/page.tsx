import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getShopProducts, getProductCategories } from "@/server/data/products";
import { parseShopQuery } from "@/lib/shop-query";
import { buildMetadata } from "@/lib/seo";
import { PhotoHero } from "@/components/ui/photo-hero";
import { ShopView } from "@/components/shop/shop-view";

const SHOP_HERO_IMAGE =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/services/1782552076322-pu88b6-custom-builds.jpg";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  return buildMetadata({
    locale,
    path: "/shop",
    title: fr
      ? "Glissades d'eau commerciales à vendre | gonflables"
      : "Commercial Water Slides for Sale | Buy Inflatable Slides",
    description: fr
      ? "Achetez des glissades d'eau gonflables commerciales conçues pour la location et la revente — robustes, livraison nationale. Parcourez nos glissades à vendre et demandez un devis."
      : "Buy commercial inflatable water slides built for rentals and resale — heavy-duty, with nationwide delivery. Browse our water slides for sale and request a price quote.",
    keywords: [
      "commercial water slides for sale",
      "buy inflatable water slides",
      "inflatable water slides for sale",
      "commercial inflatable water slides",
      "buy water slides",
      "giant water slide for sale",
    ],
  });
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
      {/* Photo hero on tablet/desktop only — hidden on phones for a tighter,
          app-like top. A compact text title stands in on mobile. */}
      <PhotoHero
        image={SHOP_HERO_IMAGE}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
        className="hidden md:block"
      />
      <div className="px-5 pt-6 md:hidden">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("desc")}</p>
      </div>
      <ShopView
        locale={locale}
        categories={categories}
        items={listing.items}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        activeCategory={query.category}
        query={query.q}
      />
    </main>
  );
}
