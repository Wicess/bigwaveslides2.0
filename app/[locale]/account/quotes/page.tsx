import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerQuotes } from "@/server/data/account";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/account/status-badge";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountQuotesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const quotes = await getCustomerQuotes(session.user.id, session.user.email);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_quotes")}</h1>
      {quotes.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noQuotes")}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {quotes.map((q) => (
            <li key={q.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{q.quoteNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(q.createdAt, locale)}
                      {q.eventDate ? ` · ${formatDate(q.eventDate, locale)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={q.status} locale={locale} />
                </div>
                {q.message ? (
                  <p className="mt-3 line-clamp-2 border-t border-border pt-3 text-sm text-muted-foreground">
                    {q.message}
                  </p>
                ) : null}
                {q.estimateCents != null ? (
                  <p className="mt-2 text-sm font-semibold">
                    {t("estimate")}:{" "}
                    <span className="text-primary">{formatPrice(q.estimateCents, locale)}</span>
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
