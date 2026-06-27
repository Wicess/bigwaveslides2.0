"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { addToCart } from "@/server/actions/cart";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";
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
  context,
  rentHref,
  labels,
}: {
  productId: string;
  context: "rent" | "shop";
  /** Destination for "Rent now" (the booking checkout). */
  rentHref: string;
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
        toast.success(labels.added);
        after?.();
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

      {context === "rent" ? (
        <Button asChild variant="gradient" size="sm" className="w-full gap-1.5">
          <Link href={rentHref}>
            {labels.primary} <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="gradient"
          size="sm"
          loading={pending}
          onClick={() => add(() => router.push("/cart"))}
          className="w-full gap-1.5"
        >
          {labels.primary} <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  );
}
