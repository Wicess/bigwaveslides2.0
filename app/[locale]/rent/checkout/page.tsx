import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getRentalBySlug } from "@/server/data/rentals";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { getLocalized } from "@/lib/localized";
import { TRANSPORT_CENTS } from "@/lib/checkout-config";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { RentCheckoutForm } from "@/components/checkout/rent-checkout-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata(): Metadata {
  // Per-visitor page — never indexed.
  return {
    title: "Reserve your date",
    robots: { index: false, follow: false },
  };
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Rent Now.
 *
 * Replaces the old quote flow: this page creates the booking outright rather
 * than issuing a quote the client has to come back and accept. There is no
 * summary sidebar — the itemised total lives inside the form, directly above the
 * button, where the client is actually looking when they decide.
 */
export default async function RentCheckoutPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const slug = one((await searchParams).product);
  if (!slug) redirect(`/${locale}/rent`);

  const product = await getRentalBySlug(slug).catch(() => null);
  // Sale-only products have no daily rate — nothing to rent.
  if (!product?.dailyRateCents) redirect(`/${locale}/rent`);

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const transport =
    settings.fees?.transportEnabled !== false ? TRANSPORT_CENTS : 0;

  return (
    <main>
      <Section spacing="compact" className="pt-10">
        <Container className="max-w-2xl">
          <header className="mb-6 text-center">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Reserve your date
            </h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl leading-relaxed">
              Check your date, tell us where the party is, and lock it in. We
              verify availability and confirm your booking first. Nothing is
              charged online.
            </p>
          </header>

          <RentCheckoutForm
            productId={product.id}
            productSlug={product.slug}
            productName={getLocalized(product.name, locale)}
            dailyRateCents={product.dailyRateCents}
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
