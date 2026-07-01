import { getTranslations } from "next-intl/server";
import { PackageOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ProductCard, type CardProduct } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchBox } from "@/components/shop/search-box";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { Pagination } from "@/components/shop/pagination";
import { Reveal } from "@/components/motion/reveal";

type Category = {
  id: string;
  slug: string;
  name: unknown;
  image: string | null;
};

export async function ShopView({
  locale,
  categories,
  items,
  total,
  page,
  pageCount,
  activeCategory,
  query,
}: {
  locale: string;
  categories: Category[];
  items: CardProduct[];
  total: number;
  page: number;
  pageCount: number;
  activeCategory?: string;
  query?: string;
}) {
  const t = await getTranslations("Shop");

  const filters = (
    <ShopFilters
      categories={categories}
      activeCategory={activeCategory}
      locale={locale}
    />
  );

  return (
    <Section spacing="compact" className="pt-8">
      <Container>
        {/* Search — hidden on phones for a cleaner mobile top */}
        <div className="mx-auto hidden max-w-2xl md:block">
          <SearchBox initialQuery={query} />
        </div>

        <div className="mt-6 grid gap-8 md:mt-8 lg:grid-cols-[260px_1fr]">
          {/* Desktop filters — a clean white card that stays in view while you
              scroll the results (sticky top-28 clears the fixed header). */}
          <div className="hidden lg:block">
            <div className="border-border sticky top-28 rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {filters}
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {query
                  ? t("resultsFor", { count: total, query })
                  : t("results", { count: total })}
              </p>
              <div className="flex items-center gap-2">
                {/* Compact filter pill → designed bottom-sheet (phones only) */}
                <MobileFilters active={Boolean(activeCategory)}>
                  {filters}
                </MobileFilters>
                <SortSelect />
              </div>
            </div>

            {items.length === 0 ? (
              <div className="mt-12 flex flex-col items-center gap-4 text-center">
                <PackageOpen className="text-muted-foreground size-12" />
                <p className="text-lg font-semibold">{t("emptyTitle")}</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  {t("emptyDesc")}
                </p>
                <Button asChild variant="outline">
                  <Link href="/shop">{t("clearFilters")}</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-8 min-[440px]:grid-cols-2 lg:grid-cols-3">
                {items.map((p, i) => (
                  <Reveal key={p.slug} delay={(i % 3) * 0.05}>
                    <ProductCard
                      product={p}
                      locale={locale}
                      context="shop"
                      priority={i < 3}
                    />
                  </Reveal>
                ))}
              </div>
            )}

            <Pagination page={page} pageCount={pageCount} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
