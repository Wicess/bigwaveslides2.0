import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCart } from "@/server/data/cart";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CartClient } from "@/components/cart/cart-client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Cart" });
  return { title: t("checkout"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Cart");
  const [cart, settings] = await Promise.all([
    getCart(locale),
    getSettings().catch((): SiteSettings => ({})),
  ]);

  return (
    <main className="pt-[108px] sm:pt-[116px]">
      <Section spacing="compact" className="pb-16">
        <Container>
          <Link
            href="/rent"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" /> {t("browseShop")}
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("checkout")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">{t("desc")}</p>

          <div className="mt-8">
            <CartClient
              cart={cart}
              locale={locale}
              deliveryFromCents={settings.fees?.deliveryBaseCents}
            />
          </div>
        </Container>
      </Section>
    </main>
  );
}
