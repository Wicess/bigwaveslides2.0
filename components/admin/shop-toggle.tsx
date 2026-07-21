"use client";

/*
 * ShopToggle — the "appears on the sales side" switch in the admin products
 * list. On = the product is listed in /shop (type SALE/BOTH); off = rental
 * only. Optimistic flip with rollback on failure.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductSale } from "@/server/actions/admin-products";
import { toast } from "@/components/ui/toaster";
import { AdminSwitch } from "@/components/admin/admin-switch";

export function ShopToggle({
  productId,
  inShop,
  name,
}: {
  productId: string;
  inShop: boolean;
  name: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(inShop);
  const [pending, start] = useTransition();

  const flip = () => {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await toggleProductSale(productId);
      if (!res.ok) {
        setOn(!next);
        toast.error(res.error ?? "Couldn't update.");
      } else {
        toast.success(next ? `${name} is now in the shop` : `${name} removed from the shop`);
        router.refresh();
      }
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <AdminSwitch
        checked={on}
        onChange={flip}
        disabled={pending}
        label={`Show ${name} in the shop`}
      />
      <span className="text-muted-foreground hidden text-xs whitespace-nowrap lg:inline">
        {on ? "In shop" : "Rent only"}
      </span>
    </span>
  );
}
