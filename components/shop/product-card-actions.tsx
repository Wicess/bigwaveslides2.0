"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addToCart } from "@/server/actions/cart";
import { CART_CHANGED_EVENT, OPEN_CART_EVENT } from "@/lib/cart-event";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

/**
 * The action row at the bottom of a product card: "Add to cart" plus a primary
 * "Rent now" / "Buy now". Lives in its own client component so the rest of the
 * card can stay a server component and the whole card body can still link to
 * the detail page (these buttons sit outside that link).
 */
export function ProductCardActions({
  productId,
  labels,
}: {
  productId: string;
  labels: { add: string; added: string; primary: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const add = (after?: () => void) =>
    startTransition(async () => {
      const res = await addToCart(productId);
      if (res.ok) {
        window.dispatchEvent(
          new CustomEvent(CART_CHANGED_EVENT, { detail: { count: res.count } }),
        );
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
        if (after) {
          // "Buy now" — go straight to checkout.
          after();
        } else {
          // "Add to cart" — slide the cart drawer open.
          toast.success(labels.added);
          window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
        }
      } else {
        toast.error(res.error ?? "Couldn't add to cart");
      }
    });

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending && !added}
        onClick={() => add()}
        className="w-full gap-1.5"
      >
        {added ? (
          <>
            <Check className="size-4" /> {labels.added}
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" /> {labels.add}
          </>
        )}
      </Button>

      {/* "Rent now" / "Buy now" both add the item and go straight to the
          unified checkout where the quote is generated and emailed. */}
      <Button
        type="button"
        variant="gradient"
        size="sm"
        loading={pending}
        onClick={() => add(() => router.push("/checkout"))}
        className="w-full gap-1.5"
      >
        {labels.primary} <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
