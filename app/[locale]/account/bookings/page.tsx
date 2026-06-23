import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck, FileSignature } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerBookings } from "@/server/data/account";
import { formatPrice, formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/account/status-badge";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountBookingsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const bookings = await getCustomerBookings(session.user.id, session.user.email);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_bookings")}</h1>
      {bookings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <CalendarCheck className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noBookings")}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{b.bookingNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.eventStartDate, locale)} – {formatDate(b.eventEndDate, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} locale={locale} />
                    <StatusBadge status={b.paymentStatus} locale={locale} />
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  {b.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {item.name} · {t("days", { count: item.days })}
                      </span>
                      <span>{formatPrice(item.lineTotalCents, locale)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="font-semibold">
                    {t("total")}:{" "}
                    <span className="text-primary">{formatPrice(b.totalCents, locale)}</span>
                  </span>
                  {b.contract ? (
                    <Link
                      href={`/contract/${b.contract.contractNumber}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <FileSignature className="size-4" />
                      {t("viewContract")}
                    </Link>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
