"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CircleAlert, Loader2, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { computeQuote, rentalDays } from "@/lib/rental-pricing";
import {
  AvailabilityCalendar,
  type DateRange,
} from "@/components/rent/availability-calendar";

type RangeCheck = {
  available: boolean;
  totalUnits: number;
  minAvailable: number;
  conflictDates: string[];
};

export function InstantQuote({
  productId,
  slug,
  dailyRateCents,
  depositCents,
  deliveryBaseCents,
  pickupCents,
  initialStart,
}: {
  productId: string;
  slug: string;
  dailyRateCents: number;
  depositCents?: number | null;
  deliveryBaseCents?: number | null;
  pickupCents?: number | null;
  initialStart?: string;
}) {
  const t = useTranslations("RentalDetail");
  const locale = useLocale();
  const [range, setRange] = useState<DateRange>({
    start: initialStart ?? null,
    end: initialStart ?? null,
  });
  const [check, setCheck] = useState<RangeCheck | null>(null);
  const [checking, setChecking] = useState(false);

  const days =
    range.start && range.end ? rentalDays(range.start, range.end) : 0;
  const quote =
    days > 0
      ? computeQuote({
          dailyRateCents,
          depositCents,
          deliveryBaseCents,
          pickupCents,
          days,
        })
      : null;

  // Confirm real-time availability whenever a complete range is chosen.
  useEffect(() => {
    if (!range.start || !range.end) {
      setCheck(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    fetch(
      `/api/availability?productId=${productId}&start=${range.start}&end=${range.end}`,
    )
      .then((r) => r.json())
      .then((data: RangeCheck) => !cancelled && setCheck(data))
      .catch(() => !cancelled && setCheck(null))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [productId, range.start, range.end]);

  const available = check?.available ?? false;
  const quoteHref = `/quote?product=${slug}${range.start ? `&date=${range.start}` : ""}`;

  return (
    <div className="space-y-4">
      <AvailabilityCalendar productId={productId} value={range} onChange={setRange} />

      {/* Live quote */}
      <div className="rounded-[var(--radius-lg)] border border-border p-5">
        {!quote ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck className="size-4 text-primary" />
            {t("pickDates")}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t("instantQuote")}</h3>
              {checking ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : check ? (
                available ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    <CalendarCheck className="size-3.5" /> {t("available")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    <CircleAlert className="size-3.5" /> {t("unavailable")}
                  </span>
                )
              ) : null}
            </div>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {formatPrice(dailyRateCents, locale)} × {t("days", { count: quote.days })}
                </dt>
                <dd className="font-medium">{formatPrice(quote.rentalCents, locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("deliverySetup")}</dt>
                <dd className="font-medium">
                  {quote.deliveryCents > 0
                    ? formatPrice(quote.deliveryCents, locale)
                    : t("quotedByLocation")}
                </dd>
              </div>
              {quote.depositCents > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("refundableDeposit")}</dt>
                  <dd className="font-medium">{formatPrice(quote.depositCents, locale)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="font-semibold">{t("estTotal")}</span>
              <span className="font-display text-xl font-bold text-primary">
                {formatPrice(quote.totalCents, locale)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("estNote")}</p>

            {check && !available ? (
              <p className="mt-3 text-sm text-red-600">{t("unavailableHint")}</p>
            ) : null}
          </>
        )}

        <Button asChild size="lg" variant="gradient" className="mt-4 w-full">
          <Link href={quoteHref}>
            {t("requestBooking")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("noPaymentNote")}
        </p>
      </div>
    </div>
  );
}
