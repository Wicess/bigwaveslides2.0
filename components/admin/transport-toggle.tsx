"use client";

import * as React from "react";
import { Truck } from "lucide-react";
import { setTransportEnabled } from "@/server/actions/admin-payments";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

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
        <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
          <Truck className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Transportation fee — $30</p>
          <p className="text-muted-foreground text-xs">
            Added to every new quote and invoice while ON. Toggle anytime;
            existing quotes keep their price.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={toggle}
        className={cn(
          "relative h-7 w-13 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-6" : "",
          )}
        />
      </button>
    </div>
  );
}
