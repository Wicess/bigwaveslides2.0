"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { setQuantity, removeItem } from "@/server/actions/cart";
import { CART_CHANGED_EVENT, OPEN_CART_EVENT } from "@/lib/cart-event";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";

type Line = {
  itemId: string;
  slug: string;
  name: string;
  image: string | null;
  type: "SALE" | "RENTAL" | "BOTH";
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};
type CartData = { lines: Line[]; count: number; subtotalCents: number };

/**
 * Slide-in cart drawer. Opens from the header cart button or the OPEN_CART
 * event (fired after "Add to cart"). Lets shoppers adjust quantities, remove
 * items, and head to checkout — replacing the standalone cart page as the
 * default cart view.
 */
export function CartDrawer({ locale }: { locale: string }) {
  const t = useTranslations("Cart");
  const [open, setOpen] = React.useState(false);
  const [cart, setCart] = React.useState<CartData | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cart/items?locale=${locale}`, { cache: "no-store" });
      setCart((await res.json()) as CartData);
    } catch {
      /* ignore */
    }
  }, [locale]);

  // Open on the global event; always refresh contents when opening.
  React.useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      refresh();
    };
    const onChange = () => refresh();
    window.addEventListener(OPEN_CART_EVENT, onOpen);
    window.addEventListener(CART_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(OPEN_CART_EVENT, onOpen);
      window.removeEventListener(CART_CHANGED_EVENT, onChange);
    };
  }, [refresh]);

  // Lock body scroll while open.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const broadcast = (count?: number) =>
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT, { detail: { count } }));

  const changeQty = async (itemId: string, quantity: number) => {
    setBusy(itemId);
    const res = await setQuantity(itemId, quantity);
    if (res.ok) {
      broadcast(res.count);
      await refresh();
    }
    setBusy(null);
  };

  const remove = async (itemId: string) => {
    setBusy(itemId);
    const res = await removeItem(itemId);
    if (res.ok) {
      broadcast(res.count);
      await refresh();
    }
    setBusy(null);
  };

  const lines = cart?.lines ?? [];
  const empty = lines.length === 0;

  return (
    <>
      {/* Header trigger is wired separately; expose an imperative open via event.
          This invisible button lets the header open the drawer by id-less event. */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-neutral-950/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[26rem] flex-col bg-background shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              role="dialog"
              aria-label={t("title")}
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <ShoppingBag className="size-5 text-primary" />
                  {t("title")}
                  {cart ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      ({t("itemCount", { count: cart.count })})
                    </span>
                  ) : null}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {empty ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <ShoppingBag className="size-12 text-muted-foreground" />
                    <p className="font-semibold">{t("emptyTitle")}</p>
                    <p className="max-w-xs text-sm text-muted-foreground">{t("emptyBody")}</p>
                    <Button asChild variant="outline" className="mt-2" onClick={() => setOpen(false)}>
                      <Link href="/rent">{t("browseShop")}</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {lines.map((line) => (
                      <li key={line.itemId} className="flex gap-3">
                        <Link
                          href={line.type === "RENTAL" ? `/rent/${line.slug}` : `/shop/${line.slug}`}
                          onClick={() => setOpen(false)}
                          className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                        >
                          {line.image ? (
                            <MediaImage
                              src={line.image}
                              alt={line.name}
                              rounded={false}
                              className="size-20"
                              sizes="80px"
                            />
                          ) : null}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold">{line.name}</p>
                            <button
                              type="button"
                              onClick={() => remove(line.itemId)}
                              disabled={busy === line.itemId}
                              aria-label={t("remove")}
                              className="shrink-0 text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(line.unitPriceCents, locale)}
                            {line.type !== "SALE" ? t("perDay") : ""}
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                            <div className="flex items-center rounded-full border border-border">
                              <button
                                type="button"
                                onClick={() => changeQty(line.itemId, line.quantity - 1)}
                                disabled={busy === line.itemId}
                                aria-label={t("decrease")}
                                className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQty(line.itemId, line.quantity + 1)}
                                disabled={busy === line.itemId}
                                aria-label={t("increase")}
                                className="grid size-8 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <span className="font-display text-sm font-bold">
                              {formatPrice(line.lineTotalCents, locale)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {!empty ? (
                <div
                  className="border-t border-border px-5 pt-4"
                  style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
                    <span className="font-display text-lg font-bold text-primary">
                      {formatPrice(cart?.subtotalCents ?? 0, locale)}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">{t("totalNote")}</p>
                  <Button asChild variant="gradient" size="lg" className="w-full gap-1.5">
                    <Link href="/cart" onClick={() => setOpen(false)}>
                      {t("checkout")} <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
