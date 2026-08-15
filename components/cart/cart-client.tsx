"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { setQuantity, removeItem, addToCart } from "@/server/actions/cart";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";
import { trackEvent } from "@/lib/analytics/client";
import type { CartLine, CartSummary } from "@/server/data/cart";
import { OrderRequestForm } from "@/components/cart/order-request-form";

export type CheckoutSuggestion = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  type: "SALE" | "RENTAL" | "BOTH";
  priceCents: number | null;
};

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

export function CartClient({
  cart,
  locale,
  deliveryFromCents,
  checkoutSummary = false,
  suggestions = [],
}: {
  cart: CartSummary;
  locale: string;
  deliveryFromCents?: number;
  /** On the checkout page the totals live in the booking form below, so this
      hides the sticky sidebar summary rather than showing two sets of numbers
      that disagree the moment a payment plan is chosen. */
  checkoutSummary?: boolean;
  suggestions?: CheckoutSuggestion[];
}) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>(cart.lines);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Re-pull the cart after a quick-add so the line list reflects the new item.
  const refreshLines = async () => {
    try {
      const res = await fetch(`/api/cart/items?locale=${locale}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as CartSummary;
      setLines(data.lines);
    } catch {
      /* ignore */
    }
  };

  const quickAdd = (s: CheckoutSuggestion) => {
    setAddingId(s.id);
    startTransition(async () => {
      const res = await addToCart(s.id);
      if (res.ok) {
        toast.success(t("added"));
        notifyChange();
        await refreshLines();
      } else {
        toast.error(res.error ?? t("updateError"));
      }
      setAddingId(null);
    });
  };

  const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  // Record that the visitor viewed their cart (once, on mount with items).
  useEffect(() => {
    if (cart.lines.length > 0) {
      trackEvent({
        type: "CART_VIEW",
        meta: {
          itemCount: cart.lines.reduce((n, l) => n + l.quantity, 0),
          subtotalCents: cart.lines.reduce((n, l) => n + l.lineTotalCents, 0),
        },
      });
    }
  }, []);

  const changeQty = (line: CartLine, next: number) => {
    if (next < 1) return remove(line);
    const prev = lines;
    setLines((ls) =>
      ls.map((l) =>
        l.itemId === line.itemId
          ? { ...l, quantity: next, lineTotalCents: l.unitPriceCents * next }
          : l,
      ),
    );
    startTransition(async () => {
      const res = await setQuantity(line.itemId, next);
      if (!res.ok) {
        setLines(prev);
        toast.error(res.error ?? t("updateError"));
      } else {
        notifyChange();
      }
    });
  };

  const remove = (line: CartLine) => {
    const prev = lines;
    setLines((ls) => ls.filter((l) => l.itemId !== line.itemId));
    startTransition(async () => {
      const res = await removeItem(line.itemId);
      if (!res.ok) {
        setLines(prev);
        toast.error(res.error ?? t("updateError"));
      } else {
        toast.success(t("removed"));
        trackEvent({
          type: "REMOVE_FROM_CART",
          meta: { productId: line.productId, productName: line.name },
        });
        notifyChange();
      }
    });
  };

  // ── Empty ────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <ShoppingBag className="text-muted-foreground size-14" />
        <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          {t("emptyBody")}
        </p>
        <Button asChild variant="gradient" size="lg">
          <Link href="/shop">{t("browseShop")}</Link>
        </Button>
      </div>
    );
  }

  const summary = (
    <Card className="h-fit p-6">
      <h2 className="text-lg font-semibold">{t("summary")}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t("subtotal")} ({t("itemCount", { count })})
          </dt>
          <dd className="font-semibold">
            {formatPrice(subtotalCents, locale)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground flex items-center gap-1.5">
            <Truck className="size-4" /> {t("delivery")}
          </dt>
          <dd className="text-muted-foreground text-right text-xs">
            {deliveryFromCents
              ? t("deliveryFrom", {
                  amount: formatPrice(deliveryFromCents, locale),
                })
              : t("deliveryQuoted")}
          </dd>
        </div>
      </dl>
      <div className="border-border mt-4 flex justify-between border-t pt-4">
        <span className="font-semibold">{t("estTotal")}</span>
        <span className="font-display text-primary text-xl font-bold">
          {formatPrice(subtotalCents, locale)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{t("totalNote")}</p>

      <Link
        href="/rent"
        className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        <ArrowLeft className="size-4" /> {t("browseShop")}
      </Link>
    </Card>
  );

  const inCart = new Set(lines.map((l) => l.productId));
  const recommend = suggestions.filter((s) => !inCart.has(s.id)).slice(0, 4);

  return (
    <>
      <div
        className={
          checkoutSummary
            ? "mx-auto max-w-2xl"
            : "grid gap-8 lg:grid-cols-[1fr_360px]"
        }
      >
        <div className="space-y-8">
          {/* Detailed booking — what you're renting / buying. */}
          <div>
            <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
            <ul className="divide-border divide-y">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.itemId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 py-5"
                  >
                    <Link
                      href={
                        line.mode === "RENT"
                          ? `/rent/${line.slug}`
                          : `/shop/${line.slug}`
                      }
                      className="bg-muted size-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)]"
                    >
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.image}
                          alt={line.name}
                          className="size-full object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={
                            line.mode === "RENT"
                              ? `/rent/${line.slug}`
                              : `/shop/${line.slug}`
                          }
                          className="hover:text-primary font-semibold"
                        >
                          {line.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(line)}
                          aria-label={t("remove")}
                          className="text-muted-foreground transition-colors hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <span className="text-muted-foreground mt-0.5 inline-flex w-fit items-center gap-1.5 text-sm">
                        <span
                          className={
                            line.mode === "RENT"
                              ? "bg-primary-50 text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                              : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                          }
                        >
                          {line.mode === "RENT"
                            ? t("rentLabel")
                            : t("buyLabel")}
                        </span>
                        {formatPrice(line.unitPriceCents, locale)}
                        {line.mode === "RENT" ? t("perDay") : ""}
                      </span>

                      <div className="mt-auto flex items-end justify-between pt-3">
                        <div>
                          <span className="text-muted-foreground mb-1 block text-xs font-medium">
                            {line.mode === "RENT" ? t("days") : t("qty")}
                          </span>
                          <div className="border-border inline-flex items-center rounded-full border">
                            <button
                              type="button"
                              onClick={() => changeQty(line, line.quantity - 1)}
                              aria-label={t("decrease")}
                              className="hover:bg-muted grid size-9 place-items-center rounded-l-full"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeQty(line, line.quantity + 1)}
                              aria-label={t("increase")}
                              className="hover:bg-muted grid size-9 place-items-center rounded-r-full"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          {line.mode === "RENT" ? (
                            <span className="text-muted-foreground block text-xs">
                              {formatPrice(line.unitPriceCents, locale)}
                              {t("perDay")} × {line.quantity}
                            </span>
                          ) : null}
                          <span className="font-semibold">
                            {formatPrice(line.lineTotalCents, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* Your details — submitting emails the quote PDF. */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold">{t("yourDetails")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("detailsIntro")}
            </p>

            <div className="bg-muted/50 mt-4 rounded-[var(--radius-lg)] p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t("nextStepsTitle")}
              </p>
              <ol className="mt-2 space-y-1.5 text-sm">
                {[t("step1"), t("step2"), t("step3")].map((stepText, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="bg-primary grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {stepText}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-5">
              <OrderRequestForm
                onSuccess={(num) => {
                  trackEvent({
                    type: "ORDER_REQUEST",
                    meta: { orderNumber: num, itemCount: count, subtotalCents },
                  });
                  // Straight to the quote. There is no interstitial "request
                  // received" card: the client reads the quote and accepts it
                  // on that page, which issues the invoice.
                  setLines([]);
                  notifyChange();
                  router.push(`/order/${num}`);
                }}
              />
            </div>
          </Card>
        </div>

        {checkoutSummary ? null : (
          <div className="lg:sticky lg:top-28 lg:self-start">{summary}</div>
        )}
      </div>

      {/* You might also like — quick-add straight into this order. */}
      {recommend.length > 0 ? (
        <section className="border-border mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold">{t("suggestTitle")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("suggestDesc")}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommend.map((s) => (
              <div
                key={s.id}
                className="border-border flex flex-col overflow-hidden rounded-2xl border bg-white"
              >
                <Link
                  href={
                    s.type === "RENTAL" ? `/rent/${s.slug}` : `/shop/${s.slug}`
                  }
                  className="bg-muted block aspect-[4/3] overflow-hidden"
                >
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image}
                      alt={s.name}
                      className="size-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={
                      s.type === "RENTAL"
                        ? `/rent/${s.slug}`
                        : `/shop/${s.slug}`
                    }
                    className="hover:text-primary line-clamp-1 text-sm font-semibold"
                  >
                    {s.name}
                  </Link>
                  {s.priceCents != null ? (
                    <span className="font-display text-primary mt-0.5 text-sm font-bold">
                      {formatPrice(s.priceCents, locale)}
                      {s.type !== "SALE" ? (
                        <span className="text-muted-foreground text-xs font-medium">
                          {t("perDay")}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={addingId === s.id}
                    onClick={() => quickAdd(s)}
                    className="mt-2 w-full gap-1.5"
                  >
                    <ShoppingBag className="size-4" /> {t("addToCart")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
