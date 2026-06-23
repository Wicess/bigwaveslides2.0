"use client";

import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const t = useTranslations("Shop");
  const pathname = usePathname();
  const params = useSearchParams();

  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  };

  // Compact page window around the current page.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  const base =
    "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border px-3 text-sm font-medium transition-colors";

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label={t("pagination")}
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(base, "border-border hover:border-primary hover:text-primary")} aria-label={t("prevPage")}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            base,
            p === page
              ? "border-primary bg-primary text-white"
              : "border-border hover:border-primary hover:text-primary",
          )}
        >
          {p}
        </Link>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(base, "border-border hover:border-primary hover:text-primary")} aria-label={t("nextPage")}>
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
