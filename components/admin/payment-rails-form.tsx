"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Save } from "lucide-react";
import { savePaymentRails } from "@/server/actions/admin-payments";
import type { PaymentMethod } from "@/lib/payment-methods";
import { paymentLogo } from "@/lib/payment-logos";
import { AdminSwitch } from "@/components/admin/admin-switch";
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

function railStatus(r: Rail): {
  label: string;
  cls: string;
} {
  if (r.enabled && r.destination.trim())
    return {
      label: "Auto-send ready",
      cls: "bg-emerald-100 text-emerald-800",
    };
  if (r.enabled)
    return {
      label: "Manual — post details per order",
      cls: "bg-primary-50 text-primary-800",
    };
  return { label: "Off", cls: "bg-muted text-muted-foreground" };
}

/** Editor for the manual payment rails. A rail with a destination auto-sends
    details the moment a client picks it; without one, the owner gets a
    priority-5 ntfy push to post details by hand. */
export function PaymentRailsForm({ initial }: { initial: Rail[] }) {
  const [rails, setRails] = React.useState<Rail[]>(initial);
  const [dirty, setDirty] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const patch = (i: number, p: Partial<Rail>) => {
    setDirty(true);
    setRails((r) => r.map((m, j) => (j === i ? { ...m, ...p } : m)));
  };

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
      if (res.ok) {
        setDirty(false);
        toast.success(
          res.synced
            ? `Payment methods saved · updated ${res.synced} pending order${res.synced === 1 ? "" : "s"}.`
            : "Payment methods saved.",
        );
      } else toast.error(res.error ?? "Couldn't save.");
    });

  return (
    <div>
      <ul className="divide-border/70 divide-y">
        {rails.map((r, i) => {
          const status = railStatus(r);
          return (
            <li key={r.method} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-3">
                <AdminSwitch
                  checked={r.enabled}
                  onChange={() => patch(i, { enabled: !r.enabled })}
                  label={`${r.label} enabled`}
                />
                {paymentLogo(r.method) ? (
                  <Image
                    src={paymentLogo(r.method)!}
                    alt=""
                    width={44}
                    height={18}
                    className="h-4 w-auto object-contain"
                  />
                ) : null}
                <p className="text-foreground font-semibold">{r.label}</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase",
                    status.cls,
                  )}
                >
                  {status.label}
                </span>
              </div>

              <div
                className={cn(
                  "mt-3 grid gap-3 transition-opacity duration-200 sm:grid-cols-2",
                  !r.enabled && "opacity-45",
                )}
              >
                <label className="block">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Destination — handle / tag / address
                  </span>
                  <Input
                    value={r.destination}
                    onChange={(e) => patch(i, { destination: e.target.value })}
                    placeholder={
                      r.method === "crypto"
                        ? "Wallet address"
                        : "e.g. pay@bigwaveslides.com or $bigwave"
                    }
                    className="mt-1.5"
                  />
                </label>
                {r.method === "crypto" ? (
                  <label className="block">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Network
                    </span>
                    <Input
                      value={r.network ?? ""}
                      onChange={(e) => patch(i, { network: e.target.value })}
                      placeholder="e.g. USDT · TRON (TRC-20)"
                      className="mt-1.5"
                    />
                  </label>
                ) : (
                  <label className="block">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      QR image URL (optional)
                    </span>
                    <Input
                      value={r.qrImageUrl ?? ""}
                      onChange={(e) => patch(i, { qrImageUrl: e.target.value })}
                      placeholder="https://…"
                      className="mt-1.5"
                    />
                  </label>
                )}
                <label className="block sm:col-span-2">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Client instructions · {"{{amount}}"} {"{{orderNumber}}"}{" "}
                    {"{{destination}}"} {"{{network}}"}
                  </span>
                  <Textarea
                    value={r.instructions}
                    onChange={(e) => patch(i, { instructions: e.target.value })}
                    rows={2}
                    className="mt-1.5"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Sticky save bar on mobile so it's always reachable without scrolling
          to the bottom; a normal inline row on desktop. */}
      <div className="border-border/70 bg-background/95 sticky bottom-0 z-10 mt-2 flex flex-col-reverse items-stretch gap-2 border-t pt-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-between sm:pb-0 sm:backdrop-blur-none">
        <p
          className={cn(
            "text-center text-xs transition-opacity sm:text-left",
            dirty ? "text-primary-800 opacity-100" : "opacity-0",
          )}
          aria-hidden={!dirty}
        >
          Unsaved changes
        </p>
        <Button
          onClick={save}
          disabled={pending || !dirty}
          variant="gradient"
          size="lg"
          className="w-full sm:w-auto"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save payment methods
        </Button>
      </div>
    </div>
  );
}
