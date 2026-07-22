import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, ChevronDown, ShieldCheck } from "lucide-react";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { formatDate, formatPrice } from "@/lib/format";
import {
  amountDueCents,
  cryptoDiscountCents,
  effectiveTotalCents,
  type PaymentPlan,
} from "@/lib/payment-plan";
import { loadPaymentMethods, DEFAULT_METHODS } from "@/lib/payment-methods";
import { quoteTerms, orderTerms, SETUP_REQUIREMENTS } from "@/lib/legal-terms";
import { ANTI_SCAM_SHORT, ANTI_SCAM_SHORT_FR } from "@/lib/anti-scam";
import { Container } from "@/components/ui/container";
import { QuoteActions } from "@/components/order/quote-actions";
import { InvoicePayment } from "@/components/order/invoice-payment";
import { PendingOrderFlag } from "@/components/order/pending-order-flag";
import { ClaimAccount } from "@/components/order/claim-account";
import { cn } from "@/lib/utils";

const LOGO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/brand/logo-email.png";
const CONTACT_EMAIL = "contact@bigwaveslides.com";
const CONTACT_PHONE = "+1 (614) 302-5899";

// Live order-status page — never serve it from the Full Route Cache.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Order ${number} — Big Wave Slides`,
    robots: { index: false, follow: false },
  };
}

const RENTAL_INCLUDES =
  "slide, commercial blower, anchoring, setup safety & professional workmanship, basic insurance, sanitizing before delivery, pickup. Each rental day is one complete 24-hour period";

export default async function OrderFlowPage({ params }: Props) {
  const { locale, number } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("OrderFlow");

  const order = await withRetry(() =>
    prisma.order.findUnique({
      where: { orderNumber: number },
      include: { items: true },
    }),
  ).catch(() => null);
  if (!order) notFound();

  const isQuote = order.stage === "QUOTE";
  const paid = order.paymentDetailsState === "PAID";
  const money = (c: number) => formatPrice(c, locale);
  const addr = (order.deliveryAddress ?? {}) as {
    address?: string;
    city?: string;
  };
  const eventLocation =
    [addr.address, addr.city].filter(Boolean).join(", ") || null;
  const docNumber = isQuote
    ? order.orderNumber
    : (order.invoiceNumber ?? order.orderNumber);
  // Once the client picks crypto, 11.5% comes off the whole invoice — every
  // schedule amount below works from the discounted total.
  const discount = cryptoDiscountCents(
    order.totalCents,
    order.paymentMethodKey,
  );
  const payableTotal = effectiveTotalCents(
    order.totalCents,
    order.paymentMethodKey,
  );
  const half = amountDueCents("HALF", payableTotal);
  const plan = (order.paymentPlan as PaymentPlan | null) ?? null;

  // Once a plan is chosen, the payment step lives on its own premium, secure
  // page — send them there (waiting UI, details reveal, proof all happen there).
  if (!isQuote && plan !== null) {
    redirect(`/${locale}/order/${order.orderNumber}/payment`);
  }

  // Show every payment option (owner labels merged over the defaults) — the
  // buyer picks any; owner-configured rails send details instantly, the rest
  // route through the manual assign flow.
  const allMethods = await loadPaymentMethods();
  const methods = (allMethods.length ? allMethods : DEFAULT_METHODS).map(
    (m) => ({ method: m.method, label: m.label }),
  );

  const terms = isQuote
    ? quoteTerms(
        "Renter",
        order.quoteValidUntil
          ? formatDate(order.quoteValidUntil, locale)
          : undefined,
      )
    : orderTerms("Renter");

  const steps = [t("stepQuote"), t("stepInvoice"), t("stepBooked")];
  const activeStep = isQuote ? 0 : paid ? 2 : 1;

  return (
    <main className="bg-muted/30 min-h-screen py-10 sm:py-14">
      {/* Arms the global PaymentWatcher while the buyer waits for payment
          details (plan chosen, admin not yet responded); disarms it once
          details land or the order is paid. Renders nothing. */}
      {/* Opening this emailed link signs the browser into the account. */}
      <ClaimAccount orderNumber={order.orderNumber} />
      <PendingOrderFlag
        orderNumber={order.orderNumber}
        email={order.guestEmail ?? ""}
        active={
          !isQuote &&
          plan !== null &&
          order.paymentDetailsState === "AWAITING_DETAILS"
        }
      />
      <Container className="max-w-3xl">
        {/* Progress stepper */}
        <ol className="mb-8 flex items-center gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  i < activeStep
                    ? "bg-emerald-500 text-white"
                    : i === activeStep
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < activeStep ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold sm:text-sm",
                  i === activeStep
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "h-px flex-1",
                    i < activeStep ? "bg-emerald-400" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>

        {/* Document card */}
        <article className="border-border overflow-hidden rounded-3xl border bg-white shadow-sm">
          {/* Brand header — clients are told to verify this logo before paying */}
          <header className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
            <Image
              src={LOGO}
              alt="Big Wave Slides"
              width={220}
              height={110}
              className="h-12 w-auto sm:h-14"
              priority
            />
            <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold">
              <ShieldCheck className="size-3.5" />
              {t("secureBadge")}
            </span>
          </header>

          {/* Title bar */}
          <div className="mx-6 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white [background:var(--gradient-deep)] sm:mx-10">
            <h1 className="font-display text-xl font-bold tracking-wide sm:text-2xl">
              {isQuote ? t("docQuote") : t("docInvoice")}
            </h1>
            <div className="text-right text-xs text-white/75">
              <p>
                {isQuote ? t("quoteNo") : t("invoiceNo")}:{" "}
                <span className="font-semibold text-white">{docNumber}</span>
              </p>
              <p>
                {t("issued")}:{" "}
                {formatDate(
                  isQuote
                    ? order.createdAt
                    : (order.invoiceIssuedAt ?? order.createdAt),
                  locale,
                )}
              </p>
              {isQuote && order.quoteValidUntil ? (
                <p>
                  {t("validUntil")}: {formatDate(order.quoteValidUntil, locale)}
                </p>
              ) : null}
              {!isQuote && order.invoiceDueAt ? (
                <p>
                  {t("balanceDue")}: {formatDate(order.invoiceDueAt, locale)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-10 sm:py-8">
            {/* Parties — flat, divided sections (no nested cards) */}
            <div className="border-border grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 sm:gap-6 sm:p-5">
              <div className="sm:border-border sm:border-r sm:pr-6">
                <p className="text-muted-foreground text-[10px] font-bold tracking-[0.14em] uppercase">
                  {isQuote ? t("preparedFor") : t("billTo")}
                </p>
                <p className="text-foreground mt-1.5 font-semibold">
                  {order.guestName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {order.guestEmail}
                </p>
                {order.guestPhone ? (
                  <p className="text-muted-foreground text-sm">
                    {order.guestPhone}
                  </p>
                ) : null}
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-[10px] font-bold tracking-[0.14em] uppercase">
                  {t("eventDetails")}
                </p>
                <dl className="mt-1.5 space-y-1">
                  {!isQuote ? (
                    <DetailRow k={t("quoteRef")} v={order.orderNumber} />
                  ) : null}
                  <DetailRow
                    k={t("eventDate")}
                    v={
                      order.eventDate
                        ? formatDate(order.eventDate, locale)
                        : t("toBeConfirmed")
                    }
                  />
                  <DetailRow
                    k={t("location")}
                    v={eventLocation ?? t("toBeConfirmed")}
                  />
                </dl>
              </div>
            </div>

            {/* Items — stacked cards on phones so the price is never hidden
                behind a side-scroll; classic table from sm: up. */}
            <div className="space-y-3 sm:hidden">
              {order.items.map((it) => {
                const rent = /\(rental\)/i.test(it.name);
                return (
                  <div
                    key={it.id}
                    className="border-border rounded-2xl border p-4"
                  >
                    <p className="text-sm font-semibold">{it.name}</p>
                    {rent ? (
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {t("includes")}: {RENTAL_INCLUDES}
                      </p>
                    ) : null}
                    <div className="border-border mt-3 flex items-center justify-between gap-3 border-t pt-2.5 text-sm">
                      <span className="text-muted-foreground">
                        {rent
                          ? `${it.quantity} ${it.quantity === 1 ? t("day") : t("days")} × ${money(it.unitPriceCents)}/${t("day")}`
                          : `${it.quantity} × ${money(it.unitPriceCents)}`}
                      </span>
                      <span className="font-semibold">
                        {money(it.lineTotalCents)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-border hidden overflow-x-auto rounded-2xl border sm:block">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="bg-primary/5 text-primary text-left text-[10px] font-bold tracking-[0.12em] uppercase">
                    <th className="px-4 py-3">{t("description")}</th>
                    <th className="px-4 py-3 text-center">{t("qty")}</th>
                    <th className="px-4 py-3 text-right">{t("rate")}</th>
                    <th className="px-4 py-3 text-right">{t("amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => {
                    const rent = /\(rental\)/i.test(it.name);
                    return (
                      <tr
                        key={it.id}
                        className="border-border border-t align-top"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{it.name}</p>
                          {rent ? (
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {t("includes")}: {RENTAL_INCLUDES}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rent
                            ? `${it.quantity} ${it.quantity === 1 ? t("day") : t("days")}`
                            : it.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {money(it.unitPriceCents)}
                          {rent ? `/${t("day")}` : ""}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {money(it.lineTotalCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total — one prominent number; the math lives in a dropdown */}
            <div className="border-primary/20 bg-primary/5 rounded-2xl border p-4 sm:p-5">
              <div className="flex items-end justify-between gap-4">
                <span className="font-display text-base font-bold">
                  {isQuote ? t("quoteTotal") : t("totalDue")}
                </span>
                <span className="text-primary font-display text-3xl font-bold">
                  {money(payableTotal)}
                </span>
              </div>
              <Disclosure summary={t("viewBreakdown")}>
                <dl className="space-y-1.5 text-sm">
                  <BreakRow k={t("subtotal")} v={money(order.subtotalCents)} />
                  {order.deliveryFeeCents ? (
                    <BreakRow
                      k={t("transportation")}
                      v={money(order.deliveryFeeCents)}
                    />
                  ) : null}
                  {order.taxCents ? (
                    <BreakRow k={t("tax")} v={money(order.taxCents)} />
                  ) : null}
                  {discount ? (
                    <BreakRow
                      k={t("cryptoDiscountRow")}
                      v={`−${money(discount)}`}
                      accent
                    />
                  ) : null}
                  <div className="border-border mt-1 flex justify-between border-t pt-1.5 font-semibold">
                    <dt>{isQuote ? t("quoteTotal") : t("totalDue")}</dt>
                    <dd>{money(payableTotal)}</dd>
                  </div>
                </dl>
              </Disclosure>
            </div>

            {/* One-line payment summary on the quote (no calculations dumped) */}
            {isQuote ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("reserveLine", {
                  half: money(half),
                  total: money(payableTotal),
                })}
              </p>
            ) : null}

            {/* Anti-scam — one calm line, full wording is on the PDF */}
            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
              <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
              {locale === "fr" ? ANTI_SCAM_SHORT_FR : ANTI_SCAM_SHORT}
            </p>

            {/* Setup + Terms — collapsed, professional disclosures */}
            {isQuote ? (
              <Disclosure summary={t("setupReqTitle")} card>
                <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
                  {SETUP_REQUIREMENTS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ol>
              </Disclosure>
            ) : null}
            <Disclosure
              summary={isQuote ? t("quoteTermsTitle") : t("invoiceTermsTitle")}
              card
            >
              <div className="text-muted-foreground space-y-2.5 text-sm leading-relaxed">
                {terms.map((c, i) => (
                  <p key={i}>
                    <span className="text-foreground font-semibold">
                      {i + 1}. {c.t}
                    </span>{" "}
                    {c.b}
                  </p>
                ))}
              </div>
            </Disclosure>

            {/* Action zone — at the bottom, where the decision is made */}
            {isQuote ? (
              <QuoteActions orderNumber={order.orderNumber} />
            ) : (
              <InvoicePayment
                orderNumber={order.orderNumber}
                email={order.guestEmail ?? ""}
                locale={locale}
                totalCents={order.totalCents}
                plan={plan}
                methodKey={order.paymentMethodKey}
                state={order.paymentDetailsState}
                details={
                  order.paymentDestination
                    ? {
                        label:
                          order.paymentMethodLabel ??
                          order.paymentMethodKey ??
                          "",
                        destination: order.paymentDestination,
                        instructions: order.paymentInstructions,
                        network: order.paymentNetwork,
                        qrUrl: order.paymentQrUrl,
                      }
                    : null
                }
                methods={methods}
              />
            )}
          </div>

          <footer className="border-border text-muted-foreground border-t px-6 py-4 text-center text-xs sm:px-10">
            Big Wave Slides · {CONTACT_EMAIL} · {CONTACT_PHONE}
          </footer>
        </article>
      </Container>
    </main>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-muted-foreground w-24 shrink-0">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

/** Native <details> disclosure — collapsed by default, no JS, no clipping. */
function Disclosure({
  summary,
  children,
  card,
}: {
  summary: string;
  children: React.ReactNode;
  /** Standalone bordered card (Setup/Terms) vs. inline (breakdown). */
  card?: boolean;
}) {
  return (
    <details
      className={cn(
        "group",
        card ? "border-border overflow-hidden rounded-2xl border" : "mt-3",
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden",
          card
            ? "font-display px-4 py-3.5 text-sm"
            : "text-primary text-xs tracking-wide",
        )}
      >
        {summary}
        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className={cn(card ? "border-border border-t p-4" : "mt-2.5")}>
        {children}
      </div>
    </details>
  );
}

function BreakRow({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between",
        accent ? "font-semibold text-emerald-600" : "",
      )}
    >
      <dt className={accent ? "" : "text-muted-foreground"}>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
