import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import { routing, type AppLocale } from "@/i18n/routing";
import { getRentalProducts } from "@/server/data/rentals";
import { getProductCategories } from "@/server/data/products";
import { parseISODate, toISODate } from "@/lib/rental-pricing";
import type { ShopSort } from "@/server/data/products";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PhotoHero } from "@/components/ui/photo-hero";
import { ProductCard } from "@/components/shop/product-card";

const RENT_HERO_IMAGE =
  "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/services/1782552093459-u6mqiy-event-rentals.jpg";
import { Pagination } from "@/components/shop/pagination";
import { RentFilters } from "@/components/rent/rent-filters";
import { Reveal } from "@/components/motion/reveal";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Rent" });
  return { title: t("title"), description: t("desc") };
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

  const [categories, listing] = await Promise.all([
    getProductCategories().catch(() => []),
    getRentalProducts({ category, sort, page }),
  ]);

  return (
    <main>
      <PhotoHero image={RENT_HERO_IMAGE} eyebrow={t("eyebrow")} title={t("title")} description={t("desc")} />
      <Section spacing="compact" className="pb-16">
        <Container>
          {dateParam ? (
            <p className="mb-6 rounded-[var(--radius-lg)] bg-primary-50 px-4 py-3 text-sm text-primary">
              {t("dateBanner", { date: toISODate(dateParam) })}
            </p>
          ) : null}

          <RentFilters
            categories={categories}
            activeCategory={category}
            locale={locale}
          />

          {listing.items.length === 0 ? (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <PackageOpen className="size-12 text-muted-foreground" />
              <p className="text-lg font-semibold">{t("emptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t("emptyDesc")}</p>
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
