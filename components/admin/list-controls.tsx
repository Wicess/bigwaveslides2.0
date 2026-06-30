"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Build a new querystring with one param changed (cleared when empty). */
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return React.useCallback(
    (name: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(name, value);
      else next.delete(name);
      next.delete("page"); // reset pagination on filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params],
  );
}

/** A styled native-select filter that drives a URL search param. */
export function FilterSelect({
  name,
  options,
  placeholder = "All",
  className,
}: {
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  const params = useSearchParams();
  const setParam = useSetParam();
  const current = params.get(name) ?? "";

  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={placeholder}
        value={current}
        onChange={(e) => setParam(name, e.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-full border bg-white pl-4 pr-9 text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
          current ? "border-primary/40 text-primary" : "border-border",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

/** Pill-style filter tabs (desktop-friendly); drives a URL search param. */
export function FilterTabs({
  name,
  options,
  allLabel = "All",
}: {
  name: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const params = useSearchParams();
  const setParam = useSetParam();
  const current = params.get(name) ?? "";
  const all = [{ value: "", label: allLabel }, ...options];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {all.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            onClick={() => setParam(name, o.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200",
              active
                ? "text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]"
                : "border border-border bg-white text-foreground/70 hover:border-primary/40 hover:text-primary",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Debounced search box bound to a URL search param (default `q`). */
export function SearchBox({
  name = "q",
  placeholder = "Search…",
  className,
}: {
  name?: string;
  placeholder?: string;
  className?: string;
}) {
  const params = useSearchParams();
  const setParam = useSetParam();
  const [value, setValue] = React.useState(params.get(name) ?? "");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (v: string) => {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam(name, v.trim()), 350);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
