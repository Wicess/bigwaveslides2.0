"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  ArrowLeft,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { setQuantity, removeItem } from "@/server/actions/cart";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { CART_CHANGED_EVENT } from "@/lib/cart-event";
import { trackEvent } from "@/lib/analytics/client";
import type { CartLine, CartSummary } from "@/server/data/cart";
import { OrderRequestForm } from "@/components/cart/order-request-form";

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

export function CartClient({
  cart,
  locale,
  deliveryFromCents,
}: {
  cart: CartSummary;
  locale: string;
  deliveryFromCents?: number;
}) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>(cart.lines);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  // ── Success ──────────────────────────────────────────────
  if (orderNumber) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">{t("successTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("successBody")}</p>
        <p className="mt-4 inline-block rounded-full bg-muted px-4 py-2 font-mono text-sm font-semibold">
          {t("orderRef")}: {orderNumber}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gradient">
            <Link href="/shop">{t("keepShopping")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // ── Empty ────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <ShoppingBag className="size-14 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
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
          <dd className="font-semibold">{formatPrice(subtotalCents, locale)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="size-4" /> {t("delivery")}
          </dt>
          <dd className="text-right text-xs text-muted-foreground">
            {deliveryFromCents
              ? t("deliveryFrom", { amount: formatPrice(deliveryFromCents, locale) })
              : t("deliveryQuoted")}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between border-t border-border pt-4">
        <span className="font-semibold">{t("estTotal")}</span>
        <span className="font-display text-xl font-bold text-primary">
          {formatPrice(subtotalCents, locale)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("totalNote")}</p>

      <Link
        href="/rent"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> {t("browseShop")}
      </Link>
    </Card>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* Detailed booking — what you're renting / buying. */}
        <div>
          <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
          <ul className="divide-y divide-border">
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
                    href={line.type === "RENTAL" ? `/rent/${line.slug}` : `/shop/${line.slug}`}
                    className="size-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-muted"
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
                        href={line.type === "RENTAL" ? `/rent/${line.slug}` : `/shop/${line.slug}`}
                        className="font-semibold hover:text-primary"
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
                    <span className="mt-0.5 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground">
                      <span
                        className={
                          line.type === "SALE"
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                            : "rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary"
                        }
                      >
                        {line.type === "SALE" ? t("buyLabel") : t("rentLabel")}
                      </span>
                      {formatPrice(line.unitPriceCents, locale)}
                      {line.type !== "SALE" ? t("perDay") : ""}
                    </span>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          onClick={() => changeQty(line, line.quantity - 1)}
                          aria-label={t("decrease")}
                          className="grid size-9 place-items-center rounded-l-full hover:bg-muted"
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
                          className="grid size-9 place-items-center rounded-r-full hover:bg-muted"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        {formatPrice(line.lineTotalCents, locale)}
                      </span>
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
          <p className="mt-1 text-sm text-muted-foreground">{t("detailsIntro")}</p>

          <div className="mt-4 rounded-[var(--radius-lg)] bg-muted/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("nextStepsTitle")}
            </p>
            <ol className="mt-2 space-y-1.5 text-sm">
              {[t("step1"), t("step2"), t("step3")].map((stepText, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
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
                setOrderNumber(num);
                setLines([]);
                notifyChange();
                router.refresh();
              }}
            />
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">{summary}</div>
    </div>
  );
}
