import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCart } from "@/server/data/cart";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PageHeader } from "@/components/ui/page-header";
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
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("checkout")} description={t("desc")} />
      <Section spacing="compact" className="pb-16">
        <Container>
          <CartClient
            cart={cart}
            locale={locale}
            deliveryFromCents={settings.fees?.deliveryBaseCents}
          />
        </Container>
      </Section>
    </main>
  );
}
