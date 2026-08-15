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
import { CartCheckoutForm } from "@/components/checkout/cart-checkout-form";
import { TRANSPORT_CENTS } from "@/lib/checkout-config";
import { BRAND_EMAIL } from "@/lib/brand";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as AppLocale,
    namespace: "Cart",
  });
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
      <Section spacing="compact" className="pt-8 pb-16 sm:pt-10">
        <Container>
          {/* Animated, centered title */}
          <Reveal className="mb-8 text-center sm:mb-10">
            <h1 className="text-shimmer font-display bg-[linear-gradient(90deg,#0a1a2f_0%,#0099ff_35%,#00d4ff_50%,#0099ff_65%,#0a1a2f_100%)] text-4xl font-extrabold tracking-tight uppercase sm:text-6xl">
              {t("checkout")}
            </h1>
            <span
              aria-hidden
              className="mx-auto mt-3 block h-1 w-16 rounded-full bg-[linear-gradient(90deg,#0099ff,#00d4ff)] sm:w-24"
            />
          </Reveal>

          {/* Cart contents stay editable (quantities, remove, suggestions).
              The booking form goes in via `afterCart` rather than after this
              component, so the page reads cart -> book -> "you might also like";
              rendered as a sibling it landed BELOW four upsell cards, which put
              the submit button off the bottom of the page.

              `checkoutSummary` hides CartClient's own sticky summary and its
              legacy quote form — the totals now sit directly above the submit,
              where the plan and method pickers can move them in view. */}
          <CartClient
            cart={cart}
            locale={locale}
            deliveryFromCents={settings.fees?.deliveryBaseCents}
            suggestions={suggestions}
            checkoutSummary
            afterCart={
              cart.lines.length > 0 && cart.id ? (
                <div className="mx-auto mt-10 max-w-2xl">
                  <CartCheckoutForm
                    cartId={cart.id}
                    lines={cart.lines.map((l) => ({
                      productId: l.productId,
                      slug: l.slug,
                      name: l.name,
                      mode: l.mode,
                      unitPriceCents: l.unitPriceCents,
                      quantity: l.quantity,
                      lineTotalCents: l.lineTotalCents,
                    }))}
                    subtotalCents={cart.subtotalCents}
                    transportCents={
                      settings.fees?.transportEnabled === false
                        ? 0
                        : TRANSPORT_CENTS
                    }
                    locale={locale}
                    contactEmail={settings.contact?.email ?? BRAND_EMAIL}
                    contactPhone={settings.contact?.phone ?? null}
                    whatsapp={settings.contact?.whatsapp ?? null}
                  />
                </div>
              ) : null
            }
          />
        </Container>
      </Section>
    </main>
  );
}
