import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PhoneCall, Clock3, ShieldCheck } from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getProductBySlug } from "@/server/data/products";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteForm } from "@/components/forms/quote-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Quote" });
  return { title: t("title"), description: t("desc") };
}

export default async function QuotePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Quote");
  const sp = await searchParams;
  const productSlug = Array.isArray(sp.product) ? sp.product[0] : sp.product;

  let productId: string | undefined;
  let productLabel: string | undefined;
  if (productSlug) {
    const product = await getProductBySlug(productSlug);
    if (product) {
      productId = product.id;
      productLabel = getLocalized(product.name, locale);
    }
  }

  const perks = [
    { icon: Clock3, text: t("perkFast") },
    { icon: ShieldCheck, text: t("perkInsured") },
    { icon: PhoneCall, text: t("perkHuman") },
  ];

  return (
    <main>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />
      <Section spacing="compact" className="pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
            <QuoteForm
              context={productId ? "SHOP" : "GENERAL"}
              productId={productId}
              productLabel={productLabel}
            />

            <aside className="space-y-4">
              <h2 className="text-lg font-semibold">{t("whyTitle")}</h2>
              <ul className="space-y-3">
                {perks.map((p) => {
                  const Icon = p.icon;
                  return (
                    <li key={p.text} className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <span className="pt-2 text-sm text-muted-foreground">{p.text}</span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </Container>
      </Section>
    </main>
  );
}
