"use client";

import * as React from "react";
import { MessagesSquare } from "lucide-react";
import { setManualInvoiceMode } from "@/server/actions/admin-payments";
import { AdminSwitch } from "@/components/admin/admin-switch";
import { toast } from "@/components/ui/toaster";

/**
 * Manual-invoice mode switch. ON → the client picks a plan + method but the
 * payment details are never shown on-site; they see their Invoice ID and are
 * told the details will come by email / phone / WhatsApp. OFF → the normal
 * on-site payment-details reveal.
 */
export function ManualInvoiceToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next); // optimistic
    startTransition(async () => {
      const res = await setManualInvoiceMode({ enabled: next });
      if (res.ok) {
        toast.success(
          next
            ? "Manual invoice mode is ON — details sent by you, not shown on-site."
            : "Manual invoice mode is OFF — payment details show on-site again.",
        );
      } else {
        setEnabled(!next);
        toast.error(res.error ?? "Couldn't update.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="bg-primary-50 text-primary grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)]">
          <MessagesSquare className="size-5" />
        </span>
        <div>
          <p className="text-foreground font-semibold">Manual invoice mode</p>
          <p className="text-muted-foreground max-w-md text-xs">
            When ON, the client still picks a plan &amp; method, but payment
            details are never shown on-site — they see their Invoice ID and you
            send the details by email, phone, or WhatsApp. They verify the
            Invoice ID matches before paying.
          </p>
        </div>
      </div>
      <AdminSwitch
        checked={enabled}
        onChange={toggle}
        disabled={pending}
        label="Manual invoice mode"
      />
    </div>
  );
}
