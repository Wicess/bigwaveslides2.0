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
  mode = "BUY",
  directHref,
}: {
  productId: string;
  labels: { add: string; added: string; primary: string };
  /** Buy (sale price) or Rent (daily rate) — sets how the line is priced. */
  mode?: "BUY" | "RENT";
  /**
   * Send the primary CTA straight to a single-item checkout instead of routing
   * through the cart.
   *
   * The cart is a detour for someone buying one slide, and it is now
   * single-mode — a shopper with a rental already in it would be refused at the
   * add step and never reach checkout at all. When this is set the button
   * navigates and nothing is added to the cart.
   */
  directHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const add = (after?: () => void) =>
    startTransition(async () => {
      const res = await addToCart(productId, 1, mode);
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

      {/* "Rent now" / "Buy now". With directHref this is a straight navigation
          to the single-item checkout — no cart round trip. Without it, the old
          behaviour: add the line, then open the cart checkout. */}
      <Button
        type="button"
        variant="gradient"
        size="sm"
        loading={pending && !directHref}
        onClick={() =>
          directHref
            ? router.push(directHref)
            : add(() => router.push("/checkout"))
        }
        className="w-full gap-1.5"
      >
        {labels.primary} <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
