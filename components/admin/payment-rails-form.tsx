"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { savePaymentRails } from "@/server/actions/admin-payments";
import type { PaymentMethod } from "@/lib/payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Rail = Pick<
  PaymentMethod,
  | "method"
  | "label"
  | "destination"
  | "instructions"
  | "network"
  | "qrImageUrl"
  | "enabled"
>;

/** Editor for the manual payment rails. A rail with a destination auto-sends
    details the moment a client picks it; without one, the owner gets a
    priority-5 ntfy push to post details by hand. */
export function PaymentRailsForm({ initial }: { initial: Rail[] }) {
  const [rails, setRails] = React.useState<Rail[]>(initial);
  const [pending, startTransition] = React.useTransition();

  const patch = (i: number, p: Partial<Rail>) =>
    setRails((r) => r.map((m, j) => (j === i ? { ...m, ...p } : m)));

  const save = () =>
    startTransition(async () => {
      const res = await savePaymentRails(
        rails.map((r) => ({
          method: r.method,
          label: r.label,
          destination: r.destination ?? "",
          instructions: r.instructions ?? "",
          network: r.network ?? "",
          qrImageUrl: r.qrImageUrl ?? "",
          enabled: r.enabled,
        })),
      );
      if (res.ok) toast.success("Payment methods saved.");
      else toast.error(res.error ?? "Couldn't save.");
    });

  return (
    <div className="space-y-4">
      {rails.map((r, i) => (
        <div
          key={r.method}
          className={cn(
            "rounded-2xl border p-4 transition-colors",
            r.enabled ? "border-primary/40 bg-primary/[0.03]" : "border-border",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={r.enabled}
                onClick={() => patch(i, { enabled: !r.enabled })}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  r.enabled ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                    r.enabled ? "translate-x-5" : "",
                  )}
                />
              </button>
              <p className="font-semibold">{r.label}</p>
              <span className="text-muted-foreground font-mono text-xs">
                {r.method}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
                r.enabled && r.destination.trim()
                  ? "bg-emerald-100 text-emerald-700"
                  : r.enabled
                    ? "bg-amber-100 text-amber-700"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {r.enabled && r.destination.trim()
                ? "Auto-send ready"
                : r.enabled
                  ? "Manual — details posted per order"
                  : "Disabled"}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground text-xs font-semibold">
                Destination (handle / tag / address)
              </span>
              <Input
                value={r.destination}
                onChange={(e) => patch(i, { destination: e.target.value })}
                placeholder="e.g. pay@bigwaveslides.com or $bigwave"
                className="mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground text-xs font-semibold">
                Network (crypto only)
              </span>
              <Input
                value={r.network ?? ""}
                onChange={(e) => patch(i, { network: e.target.value })}
                placeholder="e.g. USDT · TRON (TRC-20)"
                className="mt-1"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted-foreground text-xs font-semibold">
                QR image URL (optional)
              </span>
              <Input
                value={r.qrImageUrl ?? ""}
                onChange={(e) => patch(i, { qrImageUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted-foreground text-xs font-semibold">
                Instructions template — placeholders: {"{{amount}}"},{" "}
                {"{{orderNumber}}"}, {"{{destination}}"}, {"{{network}}"}
              </span>
              <Textarea
                value={r.instructions}
                onChange={(e) => patch(i, { instructions: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </label>
          </div>
        </div>
      ))}

      <Button onClick={save} disabled={pending} variant="gradient" size="lg">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Save payment methods
      </Button>
    </div>
  );
}
