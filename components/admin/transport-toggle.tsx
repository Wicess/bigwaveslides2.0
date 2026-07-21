"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import { setTransportEnabled } from "@/server/actions/admin-payments";
import { AdminSwitch } from "@/components/admin/admin-switch";
import { toast } from "@/components/ui/toaster";

/** On/off switch for the flat $30 transportation line on new quotes. */
export function TransportToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next); // optimistic
    startTransition(async () => {
      const res = await setTransportEnabled({ enabled: next });
      if (res.ok) {
        toast.success(
          next
            ? "Transportation fee ($30) is ON for new quotes."
            : "Transportation fee is OFF for new quotes.",
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
          <Truck className="size-5" />
        </span>
        <div>
          <p className="text-foreground font-semibold">
            Transportation fee — $30
          </p>
          <p className="text-muted-foreground text-xs">
            Added to every new quote and invoice while on. Existing quotes keep
            their price.
          </p>
        </div>
      </div>
      <AdminSwitch
        checked={enabled}
        onChange={toggle}
        disabled={pending}
        label="Transportation fee"
      />
    </div>
  );
}
