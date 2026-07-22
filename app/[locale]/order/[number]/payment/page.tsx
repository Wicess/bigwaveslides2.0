import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { loadPaymentMethods, DEFAULT_METHODS } from "@/lib/payment-methods";
import { type PaymentPlan } from "@/lib/payment-plan";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { InvoicePayment } from "@/components/order/invoice-payment";
import { PendingOrderFlag } from "@/components/order/pending-order-flag";
import { ClaimAccount } from "@/components/order/claim-account";

const LOGO =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/brand/logo-email.png";

// Live payment page — never serve it from the Full Route Cache.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Secure payment ${number} — Big Wave Slides`,
    robots: { index: false, follow: false },
  };
}

export default async function PaymentPage({ params }: Props) {
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

  const plan = (order.paymentPlan as PaymentPlan | null) ?? null;

  // This page is only for the payment step: quote not yet accepted, or a plan
  // not yet chosen → send them back to the order page to do that first.
  if (order.stage === "QUOTE" || plan === null) {
    redirect(`/${locale}/order/${order.orderNumber}`);
  }

  const allMethods = await loadPaymentMethods();
  const methods = (allMethods.length ? allMethods : DEFAULT_METHODS).map(
    (m) => ({ method: m.method, label: m.label }),
  );

  const awaiting = order.paymentDetailsState === "AWAITING_DETAILS";

  return (
    <main className="bg-muted/30 min-h-screen py-10 sm:py-14">
      {/* Opening the emailed link signs the browser into the account. */}
      <ClaimAccount orderNumber={order.orderNumber} />
      {/* Arm the global watcher while the owner assigns details. */}
      <PendingOrderFlag
        orderNumber={order.orderNumber}
        email={order.guestEmail ?? ""}
        active={awaiting}
      />
      <Container className="max-w-xl">
        <Link
          href={`/order/${order.orderNumber}`}
          className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("backToInvoice")}
        </Link>

        <article className="border-border overflow-hidden rounded-3xl border bg-white shadow-sm">
          {/* Premium secure-checkout header */}
          <header className="[background:var(--gradient-deep)] px-6 py-6 text-white sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <Image
                src={LOGO}
                alt="Big Wave Slides"
                width={200}
                height={100}
                className="h-10 w-auto brightness-0 invert"
                priority
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                <Lock className="size-3.5" />
                {t("secureCheckout")}
              </span>
            </div>
            <h1 className="font-display mt-4 text-2xl font-bold tracking-wide">
              {awaiting ? t("securingTitle") : t("payTitle")}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {t("invoiceNo")}:{" "}
              <span className="font-semibold text-white">
                {order.invoiceNumber ?? order.orderNumber}
              </span>
            </p>
          </header>

          <div className="p-5 sm:p-7">
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

            <p className="text-muted-foreground mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-relaxed">
              <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
              {t("securedBadgeNote")}
            </p>
          </div>
        </article>
      </Container>
    </main>
  );
}
