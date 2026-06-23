import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Users, Zap, Baby, Ruler, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getRentalBySlug,
  getRelatedRentals,
  getRentalSlugs,
} from "@/server/data/rentals";
import { getSettings, type SiteSettings } from "@/server/data/settings";
import { getLocalized } from "@/lib/localized";
import { parseISODate, toISODate } from "@/lib/rental-pricing";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery, type GalleryItem } from "@/components/shop/product-gallery";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { InstantQuote } from "@/components/rent/instant-quote";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { productLd, absoluteUrl } from "@/lib/structured-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: SearchParams;
};

export async function generateStaticParams() {
  const slugs = await getRentalSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getRentalBySlug(slug);
  if (!product) return {};
  return {
    title: getLocalized(product.metaTitle ?? product.name, locale),
    description: getLocalized(
      product.metaDescription ?? product.shortDescription,
      locale,
    ),
  };
}

function asList(value: unknown, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => getLocalized(v, locale, String(v))).filter(Boolean);
}

export default async function RentalDetailPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const product = await getRentalBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("RentalDetail");
  const tp = await getTranslations("Product");

  const sp = await searchParams;
  const dateParam = parseISODate(Array.isArray(sp.date) ? sp.date[0] : sp.date);
  const initialStart = dateParam ? toISODate(dateParam) : undefined;

  const settings = await getSettings().catch((): SiteSettings => ({}));
  const fees = settings.fees ?? {};

  const name = getLocalized(product.name, locale);
  const shortDescription = getLocalized(product.shortDescription, locale);
  const description = getLocalized(product.description, locale) || shortDescription;
  const features = asList(product.features, locale);
  const unitsAvailable = product._count.rentalUnits;

  const gallery: GalleryItem[] = product.media.map((m) => ({
    type: m.type,
    url: m.url,
    alt: getLocalized(m.alt, locale, name),
  }));

  const specs = [
    product.capacity != null
      ? { icon: Users, label: t("capacity"), value: t("people", { count: product.capacity }) }
      : null,
    product.ageRange ? { icon: Baby, label: t("ageRange"), value: product.ageRange } : null,
    product.powerRequired
      ? { icon: Zap, label: t("power"), value: product.powerRequired }
      : null,
    product.dimensions
      ? {
          icon: Ruler,
          label: t("dimensions"),
          value: Object.values(product.dimensions as Record<string, unknown>)
            .filter((v) => typeof v === "string" || typeof v === "number")
            .join(" × "),
        }
      : null,
  ].filter(Boolean) as { icon: typeof Users; label: string; value: string }[];

  const related = await getRelatedRentals(product.id, product.categoryId);

  const trust = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Truck, label: t("trustDelivery") },
  ];

  return (
    <main>
      <JsonLd
        data={productLd({
          name,
          description: shortDescription,
          image: gallery[0]?.url,
          url: absoluteUrl(locale, `/rent/${product.slug}`),
          priceCents: product.dailyRateCents,
          ratingAvg: product.ratingAvg,
          ratingCount: product.ratingCount,
          sku: product.sku,
        })}
      />
      <Section className="pt-28 sm:pt-32">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/rent" className="hover:text-primary">
              {t("breadcrumbRent")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Gallery + info */}
            <div className="space-y-8">
              <Reveal>
                <ProductGallery items={gallery} title={name} />
              </Reveal>

              <Reveal delay={0.05} className="space-y-6">
                {description ? (
                  <div>
                    <h2 className="text-lg font-semibold">{t("about")}</h2>
                    <p className="mt-2 whitespace-pre-line text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ) : null}

                {features.length > 0 ? (
                  <div>
                    <h2 className="text-lg font-semibold">{t("features")}</h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </div>

            {/* Buy box — sticky on desktop */}
            <Reveal delay={0.1}>
              <div className="lg:sticky lg:top-28">
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{tp("rentBadge")}</Badge>
                  {unitsAvailable > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t("unitsAvailable", { count: unitsAvailable })}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                  {name}
                </h1>

                <div className="mt-3 flex items-center gap-2">
                  <Stars rating={product.ratingAvg} />
                  <span className="text-sm text-muted-foreground">
                    {product.ratingAvg.toFixed(1)} · {product.ratingCount} {tp("reviews")}
                  </span>
                </div>

                <p className="mt-4 text-muted-foreground">{shortDescription}</p>

                {specs.length > 0 ? (
                  <ul className="mt-5 grid grid-cols-2 gap-3">
                    {specs.map((s) => {
                      const Icon = s.icon;
                      return (
                        <li
                          key={s.label}
                          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border p-3"
                        >
                          <Icon className="size-5 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-xs text-muted-foreground">
                              {s.label}
                            </span>
                            <span className="block truncate text-sm font-semibold">
                              {s.value}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                <div className="mt-6">
                  <InstantQuote
                    productId={product.id}
                    slug={product.slug}
                    dailyRateCents={product.dailyRateCents ?? 0}
                    depositCents={product.depositCents}
                    deliveryBaseCents={fees.deliveryBaseCents}
                    pickupCents={fees.pickupCents}
                    initialStart={initialStart}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {trust.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label} className="flex items-center gap-2">
                          <Icon className="size-4 text-primary" />
                          {item.label}
                        </li>
                      );
                    })}
                  </ul>
                  <WishlistButton slug={product.slug} name={name} />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section className="bg-muted/40">
          <Container>
            <SectionHeader title={t("relatedTitle")} />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 0.05}>
                  <ProductCard product={p} locale={locale} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
