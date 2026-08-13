"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power } from "lucide-react";
import {
  addRentalUnit,
  toggleRentalUnit,
} from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Unit = { id: string; unitLabel: string; isActive: boolean };

export function InventoryManager({
  productId,
  units,
}: {
  productId: string;
  units: Unit[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");

  const add = () =>
    startTransition(async () => {
      const res = await addRentalUnit(productId, label);
      if (res.ok) {
        setLabel("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });

  const toggle = (id: string) =>
    startTransition(async () => {
      const res = await toggleRentalUnit(id);
      if (!res.ok) toast.error(res.error ?? "Failed");
      else router.refresh();
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {units.length === 0 ? (
          <span className="text-muted-foreground text-sm">No units yet.</span>
        ) : (
          units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                u.isActive
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-border bg-muted text-muted-foreground line-through",
              )}
              title="Toggle active"
            >
              <Power className="size-3" />
              {u.unitLabel}
            </button>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="New unit label (e.g. Unit A)"
          className="h-9"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          loading={pending}
          disabled={!label.trim()}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}
