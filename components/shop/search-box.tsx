"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Hit = {
  slug: string;
  name: string;
  type: "SALE" | "RENTAL" | "BOTH";
  image: string | null;
  ratingAvg: number;
  ratingCount: number;
  salePriceCents: number | null;
  dailyRateCents: number | null;
};

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced live suggestions.
  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(term)}&locale=${locale}`,
          { signal: ctrl.signal },
        );
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results);
        setOpen(true);
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [value, locale]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (term: string) => {
    setOpen(false);
    const q = term.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        role="search"
      >
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-13 w-full rounded-full border border-border bg-background pl-12 pr-12 text-base transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setHits([]);
            }}
            aria-label={t("clear")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </form>

      {open && value.trim().length >= 2 ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background shadow-[var(--shadow-soft)]">
          {hits.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("noResultsFor", { query: value.trim() })}
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-auto py-2">
              {hits.map((h) => {
                const isRental = h.type === "RENTAL";
                const cents = isRental ? h.dailyRateCents : h.salePriceCents;
                return (
                  <li key={h.slug}>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          isRental ? `/rent/${h.slug}` : `/shop/${h.slug}`,
                        )
                      }
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {h.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={h.image}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {h.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ★ {h.ratingAvg.toFixed(1)} ({h.ratingCount})
                        </span>
                      </span>
                      {cents != null ? (
                        <span className="shrink-0 text-sm font-semibold text-primary">
                          {formatPrice(cents, locale)}
                          {isRental ? (
                            <span className="text-xs font-normal text-muted-foreground">
                              {t("perDayShort")}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={() => submit(value)}
                  className={cn(
                    "w-full px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-muted",
                  )}
                >
                  {t("seeAllResults")}
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
