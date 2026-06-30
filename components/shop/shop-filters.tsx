"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: unknown;
  image: string | null;
};

const PRICE_BANDS = [
  { min: 0, max: 50000, label: "price_0-50000" },
  { min: 50000, max: 150000, label: "price_50000-150000" },
  { min: 150000, max: 300000, label: "price_150000-300000" },
  { min: 300000, max: undefined, label: "price_300000+" },
] as const;

const RATINGS = [4, 3, 2];

export function ShopFilters({
  categories,
  activeCategory,
  locale,
}: {
  categories: Category[];
  activeCategory?: string;
  locale: string;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Build a query string carrying over the search term but resetting the page.
  const withParams = useCallback(
    (mut: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params.toString());
      sp.delete("page");
      mut(sp);
      const qs = sp.toString();
      return qs ? `?${qs}` : "";
    },
    [params],
  );

  const apply = useCallback(
    (mut: (sp: URLSearchParams) => void) => {
      router.push(`${pathname}${withParams(mut)}`);
    },
    [router, pathname, withParams],
  );

  const activePrice = `${params.get("minPrice") ?? ""}-${params.get("maxPrice") ?? ""}`;
  const activeRating = params.get("minRating");
  const hasFilters =
    activeCategory ||
    params.get("minPrice") ||
    params.get("maxPrice") ||
    params.get("minRating") ||
    params.get("q");

  const categoryHref = (slug?: string) =>
    `/shop${withParams((sp) => {
      if (slug) sp.set("category", slug);
      else sp.delete("category");
    })}`;

  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          {t("filterCategory")}
        </h3>
        <ul className="space-y-1">
          <li>
            <Link
              href={categoryHref()}
              className={cn(
                "hover:bg-muted block rounded-lg px-3 py-1.5 text-sm transition-colors",
                !activeCategory && "bg-primary-50 text-primary font-semibold",
              )}
            >
              {t("allProducts")}
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={categoryHref(c.slug)}
                className={cn(
                  "hover:bg-muted block rounded-lg px-3 py-1.5 text-sm transition-colors",
                  activeCategory === c.slug &&
                    "bg-primary-50 text-primary font-semibold",
                )}
              >
                {getLocalized(c.name, locale)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          {t("filterPrice")}
        </h3>
        <ul className="space-y-1">
          {PRICE_BANDS.map((band) => {
            const key = `${band.min}-${band.max ?? ""}`;
            const checked = activePrice === key;
            return (
              <li key={band.label}>
                <button
                  type="button"
                  onClick={() =>
                    apply((sp) => {
                      if (checked) {
                        sp.delete("minPrice");
                        sp.delete("maxPrice");
                      } else {
                        sp.set("minPrice", String(band.min));
                        if (band.max != null)
                          sp.set("maxPrice", String(band.max));
                        else sp.delete("maxPrice");
                      }
                    })
                  }
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                    checked && "bg-primary-50 text-primary font-semibold",
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      checked ? "border-primary bg-primary" : "border-border",
                    )}
                    aria-hidden
                  />
                  {t(band.label)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          {t("filterRating")}
        </h3>
        <ul className="space-y-1">
          {RATINGS.map((r) => {
            const checked = activeRating === String(r);
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() =>
                    apply((sp) => {
                      if (checked) sp.delete("minRating");
                      else sp.set("minRating", String(r));
                    })
                  }
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                    checked && "bg-primary-50 text-primary font-semibold",
                  )}
                >
                  <span className="text-amber-400" aria-hidden>
                    {"★".repeat(r)}
                    <span className="text-border">{"★".repeat(5 - r)}</span>
                  </span>
                  {t("ratingUp")}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {hasFilters ? (
        <Link
          href="/shop"
          className="text-primary inline-block text-sm font-semibold hover:underline"
        >
          {t("clearFilters")}
        </Link>
      ) : null}
    </aside>
  );
}
