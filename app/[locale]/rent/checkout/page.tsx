import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getRentalBySlug } from "@/server/data/rentals";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import {
  rentalDays,
  computeQuote,
  parseISODate,
  toISODate,
} from "@/lib/rental-pricing";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MediaImage } from "@/components/ui/media-image";
import { BookingForm } from "@/components/rent/booking-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "Checkout",
  });
  return { title: t("title"), robots: { index: false } };
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Checkout");
  const sp = await searchParams;
  const slug = one(sp.product);
  if (!slug) redirect("/rent");

  const product = await getRentalBySlug(slug);
  if (!product) redirect("/rent");

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const fees = settings.fees ?? {};

  const start = parseISODate(one(sp.start) ?? null);
  const end = parseISODate(one(sp.end) ?? null) ?? start;
  const startISO = start ? toISODate(start) : undefined;
  const endISO = end ? toISODate(end) : undefined;
  const days = startISO && endISO ? rentalDays(startISO, endISO) : 0;

  const dailyRate = product.dailyRateCents ?? 0;
  const quote =
    days > 0
      ? computeQuote({
          dailyRateCents: dailyRate,
          depositCents: product.depositCents,
          deliveryBaseCents: fees.deliveryBaseCents,
          pickupCents: fees.pickupCents,
          days,
        })
      : null;

  const name = getLocalized(product.name, locale);
  const image = product.media[0]?.url;

  const surfaceKeys = [
    "grass",
    "concrete",
    "asphalt",
    "turf",
    "indoor",
    "other",
  ] as const;
  const surfaceOptions = surfaceKeys.map((k) => ({
    value: k,
    label: t(`surface_${k}`),
  }));

  return (
    <main>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />
      <Section spacing="compact" className="pb-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <BookingForm
              productId={product.id}
              defaultStart={startISO}
              defaultEnd={endISO}
              surfaceOptions={surfaceOptions}
            />

            {/* Summary */}
            <Card className="h-fit p-6 lg:sticky lg:top-28">
              <div className="flex gap-4">
                <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-[var(--radius-lg)]">
                  {image ? (
                    <MediaImage
                      src={image}
                      alt={name}
                      rounded={false}
                      className="size-20"
                      sizes="80px"
                    />
                  ) : null}
                </div>
                <div>
                  <h2 className="font-semibold">{name}</h2>
                  <p className="text-muted-foreground text-sm">
                    {formatPrice(dailyRate, locale)}/{t("day")}
                  </p>
                </div>
              </div>

              <dl className="border-border mt-5 space-y-2 border-t pt-4 text-sm">
                {quote ? (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        {formatPrice(dailyRate, locale)} ×
                        {t("days", { count: quote.days })}
                      </dt>
                      <dd className="font-medium">
                        {formatPrice(quote.rentalCents, locale)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        {t("deliverySetup")}
                      </dt>
                      <dd className="font-medium">
                        {quote.deliveryCents > 0
                          ? formatPrice(quote.deliveryCents, locale)
                          : t("quotedByLocation")}
                      </dd>
                    </div>
                    {quote.depositCents > 0 ? (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                          {t("refundableDeposit")}
                        </dt>
                        <dd className="font-medium">
                          {formatPrice(quote.depositCents, locale)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="border-border flex justify-between border-t pt-3">
                      <dt className="font-semibold">{t("estTotal")}</dt>
                      <dd className="font-display text-primary text-lg font-bold">
                        {formatPrice(quote.totalCents, locale)}
                      </dd>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">{t("chooseDates")}</p>
                )}
              </dl>

              <p className="bg-muted/60 text-muted-foreground mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] p-3 text-xs">
                <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
                {t("holdNote")}
              </p>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}
