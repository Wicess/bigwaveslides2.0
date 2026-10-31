"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/select";

// No "Top rated": with no approved reviews it ranked by nothing (or, worse,
// by ratings an import script once seeded).
const OPTIONS = ["featured", "newest", "price-asc", "price-desc"] as const;

export function SortSelect() {
  const t = useTranslations("Shop");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "featured";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{t("sortBy")}</span>
      <Select
        value={current}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString());
          sp.delete("page");
          if (e.target.value === "featured") sp.delete("sort");
          else sp.set("sort", e.target.value);
          const qs = sp.toString();
          router.push(`${pathname}${qs ? `?${qs}` : ""}`);
        }}
        className="h-10 w-44"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {t(`sort_${o}`)}
          </option>
        ))}
      </Select>
    </label>
  );
}
