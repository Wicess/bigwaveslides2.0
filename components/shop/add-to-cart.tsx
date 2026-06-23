"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { addToCart } from "@/server/actions/cart";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";

export function AddToCart({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const t = useTranslations("Cart");
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();

  const onAdd = () => {
    startTransition(async () => {
      const res = await addToCart(productId, qty);
      if (res.ok) {
        toast.success(t("added"));
        window.dispatchEvent(
          new CustomEvent(CART_CHANGED_EVENT, { detail: { count: res.count } }),
        );
      } else {
        toast.error(res.error ?? t("addError"));
      }
    });
  };

  return (
    <div className={className}>
      <div className="flex items-stretch gap-3">
        <div className="inline-flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label={t("decrease")}
            className="grid size-11 place-items-center rounded-l-full text-foreground hover:bg-muted disabled:opacity-40"
            disabled={qty <= 1}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-base font-semibold" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            aria-label={t("increase")}
            className="grid size-11 place-items-center rounded-r-full text-foreground hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          variant="gradient"
          className="flex-1"
          loading={pending}
          onClick={onAdd}
        >
          {!pending ? <ShoppingBag className="size-5" /> : null}
          {t("addToCart")}
        </Button>
      </div>
    </div>
  );
}
