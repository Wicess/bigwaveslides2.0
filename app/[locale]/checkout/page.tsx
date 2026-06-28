import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCart } from "@/server/data/cart";
import { getCheckoutSuggestions } from "@/server/data/products";
import { getLocalized } from "@/lib/localized";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
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

  const rawSuggestions = await getCheckoutSuggestions(
    cart.lines.map((l) => l.productId),
  );
  const suggestions = rawSuggestions.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: getLocalized(p.name, locale),
    image: p.media[0]?.url ?? null,
    type: p.type,
    priceCents: p.type === "SALE" ? p.salePriceCents : p.dailyRateCents,
  }));

  return (
    <main>
      <Section spacing="compact" className="pb-16 pt-8 sm:pt-10">
        <Container>
          {/* Animated, centered title */}
          <Reveal className="mb-8 text-center sm:mb-10">
            <h1 className="text-shimmer bg-[linear-gradient(90deg,#0a1a2f_0%,#0099ff_35%,#00d4ff_50%,#0099ff_65%,#0a1a2f_100%)] font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl">
              {t("checkout")}
            </h1>
            <span
              aria-hidden
              className="mx-auto mt-3 block h-1 w-16 rounded-full bg-[linear-gradient(90deg,#0099ff,#00d4ff)] sm:w-24"
            />
          </Reveal>

          <CartClient
            cart={cart}
            locale={locale}
            deliveryFromCents={settings.fees?.deliveryBaseCents}
            suggestions={suggestions}
          />
        </Container>
      </Section>
    </main>
  );
}
