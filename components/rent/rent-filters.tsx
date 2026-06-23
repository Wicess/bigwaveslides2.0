"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { cn } from "@/lib/utils";

type Category = { id: string; slug: string; name: unknown };

/** Category chips + sort for the rental catalog (query-param driven). */
export function RentFilters({
  categories,
  activeCategory,
  locale,
}: {
  categories: Category[];
  activeCategory?: string;
  locale: string;
}) {
  const t = useTranslations("Rent");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value?: string) => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("page");
    if (value) sp.set(key, value);
    else sp.delete(key);
    const qs = sp.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-white"
        : "border-border text-foreground hover:border-primary hover:text-primary",
    );

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setParam("category", undefined)}
          className={chip(!activeCategory)}
        >
          {t("all")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setParam("category", c.slug)}
            className={cn(chip(activeCategory === c.slug), "whitespace-nowrap")}
          >
            {getLocalized(c.name, locale)}
          </button>
        ))}
      </div>

      <label className="flex shrink-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("sortBy")}</span>
        <select
          value={params.get("sort") ?? "featured"}
          onChange={(e) =>
            setParam("sort", e.target.value === "featured" ? undefined : e.target.value)
          }
          className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="featured">{t("sortFeatured")}</option>
          <option value="price-asc">{t("sortPriceAsc")}</option>
          <option value="price-desc">{t("sortPriceDesc")}</option>
          <option value="rating">{t("sortRating")}</option>
        </select>
      </label>
    </div>
  );
}
