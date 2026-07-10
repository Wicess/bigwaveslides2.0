import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getRentalProducts } from "@/server/data/rentals";
import { parseISODate, toISODate } from "@/lib/rental-pricing";
import type { ShopSort } from "@/server/data/products";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { ProductCard } from "@/components/shop/product-card";

const RENT_HERO_IMAGE =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/services/1782552093459-u6mqiy-event-rentals.jpg";
import { Pagination } from "@/components/shop/pagination";
import { Reveal } from "@/components/motion/reveal";
import { buildMetadata } from "@/lib/seo";
import { rentalItemListLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  return buildMetadata({
    locale,
    path: "/rent",
    title: fr
      ? "Location de glissades d'eau dès 199 $/jour — livrées & installées"
      : "Water Slide Rentals from $199/day — Delivered, Set Up & Insured",
    description: fr
      ? "Louez des glissades d'eau gonflables et châteaux gonflables près de chez vous dès 199 $/jour — livraison, installation et assurance comprises pour anniversaires, fêtes de piscine, écoles et églises. Devis gratuit."
      : "Rent inflatable water slides & bounce houses near you from $199/day — delivered, set up & fully insured for birthday parties, pool parties, school & church events. Get a free rental quote.",
    keywords: [
      "water slide rentals",
      "inflatable water slide rentals",
      "water slide rental near me",
      "backyard water slide rentals",
      "party water slide rentals",
      "giant water slide rentals",
    ],
  });
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Rent");
  const sp = await searchParams;
  const category = one(sp.category);
  const sort = (one(sp.sort) as ShopSort) || "featured";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  // A date picked in the homepage "check your date" widget flows through to
  // each rental's calendar via the card link.
  const dateParam = parseISODate(one(sp.date) ?? null);
  const cardQuery = dateParam ? `date=${toISODate(dateParam)}` : undefined;

  const listing = await getRentalProducts({ category, sort, page });

  return (
    <main>
      {listing.items.length > 0 ? (
        <JsonLd data={rentalItemListLd(locale, listing.items)} />
      ) : null}
      <PhotoHero
        image={RENT_HERO_IMAGE}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />
      <Section spacing="compact" className="pb-16">
        <Container>
          {dateParam ? (
            <p className="bg-primary-50 text-primary mb-6 rounded-[var(--radius-lg)] px-4 py-3 text-sm">
              {t("dateBanner", { date: toISODate(dateParam) })}
            </p>
          ) : null}

          {listing.items.length === 0 ? (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <PackageOpen className="text-muted-foreground size-12" />
              <p className="text-lg font-semibold">{t("emptyTitle")}</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {t("emptyDesc")}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-8 min-[440px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listing.items.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 3) * 0.05}>
                  <ProductCard
                    product={p}
                    locale={locale}
                    context="rent"
                    priority={i < 3}
                    query={cardQuery}
                  />
                </Reveal>
              ))}
            </div>
          )}

          <Pagination page={listing.page} pageCount={listing.pageCount} />
        </Container>
      </Section>
    </main>
  );
}
