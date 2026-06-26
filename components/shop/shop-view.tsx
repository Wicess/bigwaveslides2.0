import { getTranslations } from "next-intl/server";
import { SlidersHorizontal, PackageOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ProductCard, type CardProduct } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchBox } from "@/components/shop/search-box";
import { Pagination } from "@/components/shop/pagination";
import { Reveal } from "@/components/motion/reveal";

type Category = { id: string; slug: string; name: unknown; image: string | null };

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
        {/* Search */}
        <div className="mx-auto max-w-2xl">
          <SearchBox initialQuery={query} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Desktop filters — a clean white card that stays in view while you
              scroll the results (sticky top-28 clears the fixed header). */}
          <div className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {filters}
            </div>
          </div>

          {/* Mobile filters */}
          <details className="group rounded-[var(--radius-lg)] border border-border lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 font-semibold">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                {t("filters")}
              </span>
              <span className="text-sm text-muted-foreground group-open:hidden">
                {t("show")}
              </span>
            </summary>
            <div className="border-t border-border p-4">{filters}</div>
          </details>

          {/* Results */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {query
                  ? t("resultsFor", { count: total, query })
                  : t("results", { count: total })}
              </p>
              <SortSelect />
            </div>

            {items.length === 0 ? (
              <div className="mt-12 flex flex-col items-center gap-4 text-center">
                <PackageOpen className="size-12 text-muted-foreground" />
                <p className="text-lg font-semibold">{t("emptyTitle")}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t("emptyDesc")}
                </p>
                <Button asChild variant="outline">
                  <Link href="/shop">{t("clearFilters")}</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p, i) => (
                  <Reveal key={p.slug} delay={(i % 3) * 0.05}>
                    <ProductCard product={p} locale={locale} priority={i < 3} />
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
