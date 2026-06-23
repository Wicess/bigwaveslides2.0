import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Ruler,
  Users,
  Zap,
  Baby,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductSlugs,
} from "@/server/data/products";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery, type GalleryItem } from "@/components/shop/product-gallery";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
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

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("ProductDetail");
  const tp = await getTranslations("Product");

  const name = getLocalized(product.name, locale);
  const shortDescription = getLocalized(product.shortDescription, locale);
  const description = getLocalized(product.description, locale) || shortDescription;
  const features = asList(product.features, locale);

  const gallery: GalleryItem[] = product.media.map((m) => ({
    type: m.type,
    url: m.url,
    alt: getLocalized(m.alt, locale, name),
  }));

  const priceCents =
    product.type === "SALE" ? product.salePriceCents : product.dailyRateCents;
  const isRental = product.type !== "SALE";

  const specs = [
    product.capacity != null
      ? { icon: Users, label: t("capacity"), value: t("people", { count: product.capacity }) }
      : null,
    product.ageRange
      ? { icon: Baby, label: t("ageRange"), value: product.ageRange }
      : null,
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

  const related = await getRelatedProducts(product.id, product.categoryId);

  const trust = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Truck, label: t("trustDelivery") },
  ];

  return (
    <main>
      <Section className="pt-28 sm:pt-32">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/shop" className="hover:text-primary">
              {t("breadcrumbShop")}
            </Link>
            {product.category ? (
              <>
                <span className="px-2">/</span>
                <Link
                  href={`/shop/category/${product.category.slug}`}
                  className="hover:text-primary"
                >
                  {getLocalized(product.category.name, locale)}
                </Link>
              </>
            ) : null}
            <span className="px-2">/</span>
            <span className="text-foreground">{name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Gallery */}
            <Reveal>
              <ProductGallery items={gallery} title={name} />
            </Reveal>

            {/* Summary / buy box */}
            <Reveal delay={0.08} className="flex flex-col">
              <div className="flex items-center gap-3">
                <Badge variant={isRental ? "primary" : "accent"}>
                  {isRental ? tp("rentBadge") : tp("saleBadge")}
                </Badge>
                {product.sku ? (
                  <span className="text-xs text-muted-foreground">
                    {t("sku")}: {product.sku}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                {name}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <Stars rating={product.ratingAvg} />
                <span className="text-sm text-muted-foreground">
                  {product.ratingAvg.toFixed(1)} · {product.ratingCount}{" "}
                  {tp("reviews")}
                </span>
              </div>

              <p className="mt-4 text-lg text-muted-foreground">{shortDescription}</p>

              {priceCents != null ? (
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-primary">
                    {formatPrice(priceCents, locale)}
                  </span>
                  {isRental ? (
                    <span className="text-muted-foreground">{tp("perDay")}</span>
                  ) : null}
                </div>
              ) : null}

              {product.depositCents ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("deposit", { amount: formatPrice(product.depositCents, locale) })}
                </p>
              ) : null}

              {/* Specs */}
              {specs.length > 0 ? (
                <ul className="mt-6 grid grid-cols-2 gap-3">
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

              {/* CTAs */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="gradient" className="flex-1">
                  <Link href={`/quote?product=${product.slug}`}>{t("requestQuote")}</Link>
                </Button>
                <WishlistButton slug={product.slug} name={name} variant="full" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("noPaymentNote")}</p>

              {/* Trust */}
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-sm">
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
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Tabs: description / features / reviews */}
      <Section spacing="compact">
        <Container>
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">{t("tabDescription")}</TabsTrigger>
              {features.length > 0 ? (
                <TabsTrigger value="features">{t("tabFeatures")}</TabsTrigger>
              ) : null}
              <TabsTrigger value="reviews">
                {t("tabReviews")} ({product.ratingCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="max-w-3xl pt-6">
              <p className="whitespace-pre-line text-muted-foreground">{description}</p>
            </TabsContent>

            {features.length > 0 ? (
              <TabsContent value="features" className="pt-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ) : null}

            <TabsContent value="reviews" className="pt-6">
              <ReviewsSection
                productId={product.id}
                ratingAvg={product.ratingAvg}
                ratingCount={product.ratingCount}
                locale={locale}
              />
            </TabsContent>
          </Tabs>
        </Container>
      </Section>

      {/* Related */}
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
