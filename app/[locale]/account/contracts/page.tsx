import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { FileSignature, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerContracts } from "@/server/data/account";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/account/status-badge";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountContractsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const contracts = await getCustomerContracts(session.user.id, session.user.email);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_contracts")}</h1>
      {contracts.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileSignature className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noContracts")}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {contracts.map((b) => (
            <li key={b.contract!.contractNumber}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {b.contract!.contractNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("forBooking", { number: b.bookingNumber })} ·{" "}
                    {formatDate(b.eventStartDate, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.contract!.status} locale={locale} />
                  <Link
                    href={`/contract/${b.contract!.contractNumber}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {b.contract!.status === "SIGNED" ? t("viewContract") : t("signContract")}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
