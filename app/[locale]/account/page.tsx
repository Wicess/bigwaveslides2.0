import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import {
  Mail,
  Package,
  FileText,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { formatPrice, formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { SignOutButton } from "@/components/account/sign-out-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account — Big Wave Slides",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

// Money still owed: any order that's past the quote stage and not yet paid.
const OWES = new Set([
  "AWAITING_DETAILS",
  "DETAILS_SENT",
  "PROOF_SUBMITTED",
  "REJECTED",
]);

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const money = (c: number) => formatPrice(c, locale);
  const op = (n: string) => `/${locale}/order/${n}`;

  const customer = await getCurrentCustomer();

  // Signed-out state — a friendly, honest explanation of how to get in.
  if (!customer) {
    return (
      <main className="bg-muted/30 min-h-screen py-16">
        <Container className="max-w-lg">
          <div className="border-border rounded-3xl border bg-white p-8 text-center shadow-sm dark:bg-slate-950">
            <span className="bg-primary/10 text-primary mx-auto grid size-14 place-items-center rounded-2xl">
              <Package className="size-7" />
            </span>
            <h1 className="font-display mt-5 text-2xl font-bold">
              Your account
            </h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              No password needed. Open any order or quote link we&apos;ve
              emailed you — from any device — and you&apos;ll land right here,
              signed in, with all your orders, invoices, and payments in one
              place.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/${locale}/rent`}
                className="[background:var(--gradient-wave)] inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              >
                Browse rentals <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="border-border hover:border-primary inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const firstName = customer.name.split(" ")[0] || customer.name;
  const pending = customer.orders.filter((o) =>
    OWES.has(o.paymentDetailsState),
  );
  const invoices = customer.orders.filter((o) => o.stage !== "QUOTE");

  return (
    <main className="bg-muted/30 min-h-screen py-10 sm:py-14">
      <Container className="max-w-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
              Your account
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
          </div>
          <SignOutButton label="Sign out" />
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={Package}
            label="Orders"
            value={String(customer.orders.length)}
          />
          <Stat
            icon={FileText}
            label="Quotes"
            value={String(customer.quotes.length)}
          />
          <Stat
            icon={CalendarCheck}
            label="Bookings"
            value={String(customer.bookings.length)}
          />
          <Stat
            icon={CreditCard}
            label="Lifetime"
            value={money(customer.lifetimeValueCents)}
          />
        </div>

        {/* Pending payments — the thing they most want to see */}
        {pending.length > 0 ? (
          <Section
            title="Pending payments"
            icon={CreditCard}
            accent
            count={pending.length}
          >
            {pending.map((o) => (
              <Link
                key={o.id}
                href={op(o.orderNumber)}
                className="border-primary/30 bg-primary/5 hover:border-primary group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {o.invoiceNumber ?? o.orderNumber}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {payStateLabel(o.paymentDetailsState)} ·{" "}
                    {formatDate(o.createdAt, locale)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-display font-bold">
                    {money(o.totalCents)}
                  </span>
                  <ArrowRight className="text-primary size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </Section>
        ) : null}

        {/* Orders */}
        {customer.orders.length > 0 ? (
          <Section title="Orders & invoices" icon={Package}>
            {customer.orders.map((o) => (
              <RowLink
                key={o.id}
                href={op(o.orderNumber)}
                title={o.orderNumber}
                sub={`${stageLabel(o.stage)} · ${formatDate(o.createdAt, locale)}`}
                amount={money(o.totalCents)}
                badge={<PayBadge state={o.paymentDetailsState} />}
              />
            ))}
          </Section>
        ) : null}

        {/* Quotes (standalone quote requests) */}
        {customer.quotes.length > 0 ? (
          <Section title="Quote requests" icon={FileText}>
            {customer.quotes.map((q) => (
              <div
                key={q.id}
                className="border-border flex items-center justify-between gap-4 rounded-2xl border p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {q.quoteNumber}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(q.createdAt, locale)}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {q.status}
                </span>
              </div>
            ))}
          </Section>
        ) : null}

        {/* Bookings */}
        {customer.bookings.length > 0 ? (
          <Section title="Bookings" icon={CalendarCheck}>
            {customer.bookings.map((b) => (
              <div
                key={b.id}
                className="border-border flex items-center justify-between gap-4 rounded-2xl border p-4"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {b.bookingNumber}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {b.eventStartDate
                      ? formatDate(b.eventStartDate, locale)
                      : formatDate(b.createdAt, locale)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-display font-bold">
                    {money(b.totalCents)}
                  </span>
                  <span className="text-muted-foreground text-xs font-semibold uppercase">
                    {b.status}
                  </span>
                </span>
              </div>
            ))}
          </Section>
        ) : null}

        {/* Subscription */}
        <Section title="Newsletter" icon={Mail}>
          <div className="border-border flex items-center gap-3 rounded-2xl border p-4">
            {customer.marketingOptIn ? (
              <>
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                <p className="text-sm">
                  You&apos;re subscribed to seasonal offers and new slides.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                You&apos;re not subscribed to our newsletter. Sign up from the
                footer any time to get seasonal deals.
              </p>
            )}
          </div>
        </Section>

        {invoices.length === 0 &&
        customer.orders.length === 0 &&
        customer.quotes.length === 0 &&
        customer.bookings.length === 0 ? (
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Nothing here yet — your orders and quotes will appear as you place
            them.
          </p>
        ) : null}
      </Container>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border rounded-2xl border bg-white p-4 dark:bg-slate-950">
      <Icon className="text-primary size-4" />
      <p className="font-display mt-2 text-lg font-bold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  accent,
  count,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
  accent?: boolean;
  count?: number;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide">
        <Icon className={cn("size-4", accent ? "text-primary" : "")} />
        {title}
        {count ? (
          <span className="bg-primary text-primary-foreground grid min-w-5 place-items-center rounded-full px-1.5 text-xs">
            {count}
          </span>
        ) : null}
      </h2>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}

function RowLink({
  href,
  title,
  sub,
  amount,
  badge,
}: {
  href: string;
  title: string;
  sub: string;
  amount: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border-border hover:border-primary group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{title}</span>
        <span className="text-muted-foreground text-xs">{sub}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {badge}
        <span className="font-display font-bold">{amount}</span>
        <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function stageLabel(stage: string): string {
  if (stage === "QUOTE") return "Quote";
  if (stage === "INVOICE") return "Invoice";
  if (stage === "CONFIRMED") return "Confirmed";
  return stage;
}

function payStateLabel(state: string): string {
  switch (state) {
    case "AWAITING_DETAILS":
      return "Preparing payment details";
    case "DETAILS_SENT":
      return "Payment details ready";
    case "PROOF_SUBMITTED":
      return "Verifying your payment";
    case "REJECTED":
      return "Action needed";
    default:
      return state;
  }
}

function PayBadge({ state }: { state: string }) {
  if (state === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="size-3" /> Paid
      </span>
    );
  }
  if (OWES.has(state)) {
    return (
      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
        Due
      </span>
    );
  }
  return null;
}
