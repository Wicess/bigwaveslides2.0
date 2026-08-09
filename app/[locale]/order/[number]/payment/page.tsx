import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Lock, MessageCircle, Phone } from "lucide-react";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";
import { loadEnabledMethods, DEFAULT_METHODS } from "@/lib/payment-methods";
import { type PaymentPlan } from "@/lib/payment-plan";
import { orderSecurityCode } from "@/lib/security-code";
import { getSettings } from "@/server/data/settings";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { InvoicePayment } from "@/components/order/invoice-payment";
import { PendingOrderFlag } from "@/components/order/pending-order-flag";
import { ClaimAccount } from "@/components/order/claim-account";
import { PaymentTrust } from "@/components/order/payment-trust";

const LOGO =
  "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/brand/logo-email.png";
const CONTACT_EMAIL = "contact@bigwaveslides.com";
const FALLBACK_PHONE = "+16143025899";

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

  // Only rails the owner has switched ON appear as payment options.
  const enabled = await loadEnabledMethods();
  const methods = (enabled.length ? enabled : DEFAULT_METHODS).map((m) => ({
    method: m.method,
    label: m.label,
  }));

  // Same code appears in the payment email — the client cross-checks the two.
  const securityCode = orderSecurityCode(order.orderNumber);

  // Contact channels for the "talk to a human before you pay" strip.
  const settings = await getSettings().catch(() => ({}) as never);
  const phone = settings?.contact?.phone ?? FALLBACK_PHONE;
  const telHref = `tel:${phone.replace(/[^+\d]/g, "")}`;
  const waDigits = (settings?.contact?.whatsapp ?? phone).replace(
    /[^0-9]/g,
    "",
  );
  const email = settings?.contact?.email ?? CONTACT_EMAIL;
  const manualMode = settings?.payment?.manualInvoiceMode !== false;

  const awaiting = order.paymentDetailsState === "AWAITING_DETAILS";

  return (
    <main className="bg-muted/30 min-h-screen py-10 sm:py-14">
      {/* Opening the emailed link signs the browser into the account. */}
      <ClaimAccount orderNumber={order.orderNumber} />
      {/* Arm the global watcher while the owner assigns details. */}
      <PendingOrderFlag
        orderNumber={order.orderNumber}
        email={order.guestEmail ?? ""}
        active={!manualMode && awaiting}
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
          <header className="px-6 py-6 text-white [background:var(--gradient-deep)] sm:px-8">
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
              securityCode={securityCode}
              manualMode={manualMode}
              invoiceId={order.invoiceNumber ?? order.orderNumber}
              methodLabel={order.paymentMethodLabel}
              contactPhone={phone}
            />
          </div>
        </article>

        {/* Trust layer — real reviews, protection & official-account proof, so
            paying a manual rail never feels like a leap of faith. */}
        <PaymentTrust locale={locale} />

        {/* Talk to a human before you pay — kills last-second doubt. */}
        <div className="border-border mt-5 rounded-3xl border bg-white p-5 text-center shadow-sm sm:p-6">
          <p className="text-foreground font-semibold">{t("talkTitle")}</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm leading-relaxed">
            {t("talkDesc")}
          </p>
          <div className="mt-4 flex flex-col justify-center gap-2.5 sm:flex-row">
            <a
              href={telHref}
              className="border-border hover:border-primary hover:text-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            >
              <Phone className="size-4" /> {phone}
            </a>
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-transform [background:linear-gradient(135deg,#3ad07f_0%,#22b06a_45%,#109e5e_100%)] hover:scale-[1.02]"
              >
                <MessageCircle className="size-4" /> {t("whatsappLabel")}
              </a>
            ) : null}
            <a
              href={`mailto:${email}`}
              className="border-border hover:border-primary hover:text-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            >
              {email}
            </a>
          </div>
        </div>
      </Container>
    </main>
  );
}
