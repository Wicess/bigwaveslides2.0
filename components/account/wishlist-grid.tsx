"use client";

import { useState, useTransition } from "react";
import { Trash2, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { removeFromWishlist } from "@/server/actions/wishlist";
import { toast } from "@/components/ui/toaster";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { formatPrice } from "@/lib/format";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";

export type WishlistEntry = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  type: "SALE" | "RENTAL" | "BOTH";
  priceCents: number | null;
  ratingAvg: number;
  ratingCount: number;
};

export function WishlistGrid({
  items,
  locale,
}: {
  items: WishlistEntry[];
  locale: string;
}) {
  const t = useTranslations("Account");
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  const remove = (id: string) => {
    const prev = list;
    setList((l) => l.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await removeFromWishlist(id);
      if (!res.ok) {
        setList(prev);
        toast.error(res.error ?? t("genericError"));
      } else {
        // keep the localStorage wishlist badge in sync if present
        try {
          const raw = window.localStorage.getItem("bws.wishlist");
          if (raw) {
            const slugs = (JSON.parse(raw) as string[]).filter(
              (s) => s !== prev.find((p) => p.id === id)?.slug,
            );
            window.localStorage.setItem("bws.wishlist", JSON.stringify(slugs));
            window.dispatchEvent(new Event(CART_CHANGED_EVENT));
          }
        } catch {
          /* ignore */
        }
      }
    });
  };

  if (list.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Heart className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("noWishlist")}</p>
        <Link href="/shop" className="font-semibold text-primary hover:underline">
          {t("browseShop")}
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {list.map((item) => {
        const isRental = item.type === "RENTAL";
        const href = isRental ? `/rent/${item.slug}` : `/shop/${item.slug}`;
        return (
          <Card key={item.id} className="group overflow-hidden">
            <div className="relative">
              <Link href={href} className="block aspect-[4/3] bg-muted">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="size-full object-cover" />
                ) : null}
              </Link>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={t("remove")}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="p-3">
              <Link href={href} className="line-clamp-1 font-semibold hover:text-primary">
                {item.name}
              </Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Stars rating={item.ratingAvg} size="size-3" />
                {item.priceCents != null ? (
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(item.priceCents, locale)}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
