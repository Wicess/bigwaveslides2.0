import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getCustomerOrders } from "@/server/data/account";
import { formatPrice, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/account/status-badge";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountOrdersPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const t = await getTranslations("Account");
  const orders = await getCustomerOrders(session.user.id, session.user.email);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold">{t("nav_orders")}</h1>
      {orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt, locale)} · {t("itemCount", { count: order.items.length })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.status} locale={locale} />
                  <StatusBadge status={order.paymentStatus} locale={locale} />
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.lineTotalCents, locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
                <span>{t("total")}</span>
                <span className="text-primary">{formatPrice(order.totalCents, locale)}</span>
              </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
