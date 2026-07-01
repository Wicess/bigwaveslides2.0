"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * MobileFilters — a compact "Filters" pill that opens a designed bottom-sheet
 * containing the shop filters (phones only; the desktop sidebar is unchanged).
 */
export function MobileFilters({
  children,
  active = false,
}: {
  children: ReactNode;
  /** Show a dot on the trigger when any filter is applied. */
  active?: boolean;
}) {
  const t = useTranslations("Shop");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border text-foreground hover:border-primary hover:text-primary relative inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-sm font-semibold shadow-sm transition-colors"
      >
        <SlidersHorizontal className="size-4" />
        {t("filters")}
        {active ? (
          <span className="bg-primary absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white" />
        ) : null}
      </button>

      {/* Backdrop + bottom sheet */}
      <div
        className={cn(
          "fixed inset-0 z-[70]",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-neutral-950/50 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-label={t("filters")}
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Grab handle */}
          <div className="bg-border mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full" />
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <h2 className="font-display flex items-center gap-2 text-lg font-bold">
              <SlidersHorizontal className="text-primary size-5" />
              {t("filters")}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-9 place-items-center rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>

          <div className="border-border border-t p-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-full py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] [background:var(--gradient-wave)]"
            >
              {t("show")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
