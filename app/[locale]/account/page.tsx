import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ShoppingBag, CalendarCheck, FileText, Heart, ArrowRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getAccountSummary } from "@/server/data/account";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountDashboard({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const summary = await getAccountSummary(session.user.id, session.user.email);

  const cards = [
    { key: "orders", href: "/account/orders", icon: ShoppingBag, count: summary.orders },
    { key: "bookings", href: "/account/bookings", icon: CalendarCheck, count: summary.bookings },
    { key: "quotes", href: "/account/quotes", icon: FileText, count: summary.quotes },
    { key: "wishlist", href: "/account/wishlist", icon: Heart, count: summary.wishlist },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} href={c.href}>
              <Card className="flex flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:border-primary/40">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-3xl font-bold">{c.count}</span>
                <span className="text-sm text-muted-foreground">{t(`nav_${c.key}`)}</span>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("ctaTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("ctaDesc")}</p>
        </div>
        <Link
          href="/rent"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          {t("ctaLink")}
          <ArrowRight className="size-4" />
        </Link>
      </Card>
    </div>
  );
}
