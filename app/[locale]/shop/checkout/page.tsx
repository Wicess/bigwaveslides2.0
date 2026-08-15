import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getProductBySlug } from "@/server/data/products";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { getLocalized } from "@/lib/localized";
import { TRANSPORT_CENTS } from "@/lib/checkout-config";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { BuyCheckoutForm } from "@/components/checkout/buy-checkout-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata(): Metadata {
  // Checkout is a private, per-visitor page — never indexed.
  return { title: "Buy your slide", robots: { index: false, follow: false } };
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopCheckoutPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const slug = one((await searchParams).product);
  if (!slug) redirect(`/${locale}/shop`);

  const product = await getProductBySlug(slug).catch(() => null);
  // A rental-only product has no sale price — send them to the shop rather than
  // rendering a checkout that cannot compute a total.
  if (!product?.salePriceCents) redirect(`/${locale}/shop`);

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const transport =
    settings.fees?.transportEnabled !== false ? TRANSPORT_CENTS : 0;

  return (
    <main>
      <Section spacing="compact" className="pt-10">
        <Container className="max-w-2xl">
          <header className="mb-6 text-center">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Buy your slide
            </h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl leading-relaxed">
              Place your order now — we confirm availability and delivery, then
              get in touch to finalize your purchase. Nothing is charged online.
            </p>
          </header>

          <BuyCheckoutForm
            productId={product.id}
            productSlug={product.slug}
            productName={getLocalized(product.name, locale)}
            unitPriceCents={product.salePriceCents}
            transportCents={transport}
            locale={locale}
            contactEmail={settings.contact?.email ?? null}
            contactPhone={settings.contact?.phone ?? null}
            whatsapp={settings.contact?.whatsapp ?? null}
          />
        </Container>
      </Section>
    </main>
  );
}
