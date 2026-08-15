"use client";

import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { previewPromo } from "@/server/actions/reservations";
import { formatPrice } from "@/lib/format";

export type AppliedPromo = { code: string; label: string; pct: number };

/**
 * Compact promo entry for the single-item checkouts.
 *
 * The applied promo is lifted to the parent as a `pct`, not a cents amount, so
 * the discount stays correct while the client is still changing quantity or
 * rental days — a cents figure captured at apply-time silently goes stale the
 * moment they add a day, and the client notices the mismatch at the total.
 *
 * The server recomputes the real discount at submit regardless; this is a
 * display aid, never the source of truth.
 */
export function PromoField({
  productSlug,
  mode,
  quantity,
  lineTotalCents,
  applied,
  onApply,
}: {
  productSlug: string;
  mode: "BUY" | "RENT";
  quantity: number;
  lineTotalCents: number;
  applied: AppliedPromo | null;
  onApply: (promo: AppliedPromo | null) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function apply() {
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    start(async () => {
      const res = await previewPromo({
        code: trimmed,
        productSlug,
        mode,
        quantity,
        lineTotalCents,
      });
      if (res.ok) {
        onApply({ code: res.code, label: res.label, pct: res.pct });
        setCode("");
      } else {
        setError(res.error);
      }
    });
  }

  if (applied) {
    const off = Math.round(lineTotalCents * applied.pct);
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
        <Tag className="size-4 shrink-0 text-emerald-600" />
        <span className="font-semibold text-emerald-800">{applied.code}</span>
        <span className="text-emerald-700">
          applied — {formatPrice(off, "en")} off
        </span>
        <button
          type="button"
          onClick={() => onApply(null)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
        >
          <X className="size-3" /> Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          className="border-border focus:border-primary focus:ring-primary/25 h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm font-medium tracking-wide uppercase outline-none focus:ring-2"
        />
        <button
          type="button"
          onClick={apply}
          disabled={pending || !code.trim()}
          className="border-border text-foreground hover:border-primary hover:text-primary h-11 shrink-0 rounded-xl border bg-white px-4 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {pending ? "Checking…" : "Apply"}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
