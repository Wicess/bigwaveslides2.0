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
  Weight,
  Maximize2,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductSlugs,
} from "@/server/data/products";
import { getLocalized } from "@/lib/localized";
import { buildMetadata, saleProductSeo, productKindLabel } from "@/lib/seo";
import { saleFaqs } from "@/lib/product-faq";
import { formatPrice, compareAtCents, savingsPercent } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/product-card";
import {
  ProductGallery,
  type GalleryItem,
} from "@/components/shop/product-gallery";
import { ProductCardActions } from "@/components/shop/product-card-actions";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import {
  productLd,
  breadcrumbLd,
  faqLd,
  absoluteUrl,
} from "@/lib/structured-data";

// ISR: serve the cached page (stale-while-revalidate) so it stays up even
// when the serverless DB is asleep, and refreshes catalog data within the hour.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = getLocalized(product.name, locale);
  const seo = saleProductSeo(name, {
    price:
      product.salePriceCents != null
        ? formatPrice(product.salePriceCents, locale)
        : undefined,
    kind: productKindLabel(product.category?.slug),
  });
  const customTitle = product.metaTitle
    ? getLocalized(product.metaTitle, locale)
    : "";
  const customDesc = product.metaDescription
    ? getLocalized(product.metaDescription, locale)
    : "";
  return buildMetadata({
    locale,
    path: `/shop/${slug}`,
    title: customTitle || seo.title,
    description: customDesc || seo.description,
    keywords: seo.keywords,
    image: product.media?.[0]?.url ?? null,
  });
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
  const description =
    getLocalized(product.description, locale) || shortDescription;
  const features = asList(product.features, locale);

  // Sales side shows a single hero image (owner request) — the rent page
  // keeps the full gallery.
  const gallery: GalleryItem[] = product.media.slice(0, 1).map((m) => ({
    type: m.type,
    url: m.url,
    alt: getLocalized(m.alt, locale, name),
  }));

  const priceCents =
    product.type === "SALE" ? product.salePriceCents : product.dailyRateCents;
  const isRental = product.type !== "SALE";

  const dims =
    (product.dimensions as { size?: string; weight?: string } | null) ?? null;
  const space = (product.spaceRequired as { value?: string } | null) ?? null;
  // Back-compat: older rows store dimensions as loose values, not { size }.
  const dimText =
    dims?.size ??
    (product.dimensions
      ? Object.values(product.dimensions as Record<string, unknown>)
          .filter((v) => typeof v === "string" || typeof v === "number")
          .join(" × ")
      : "");

  const specs = [
    product.capacity != null
      ? {
          icon: Users,
          label: t("capacity"),
          value: t("people", { count: product.capacity }),
        }
      : null,
    product.ageRange
      ? { icon: Baby, label: t("ageRange"), value: product.ageRange }
      : null,
    dimText ? { icon: Ruler, label: t("dimensions"), value: dimText } : null,
    dims?.weight
      ? { icon: Weight, label: t("weight"), value: dims.weight }
      : null,
    product.powerRequired
      ? { icon: Zap, label: t("power"), value: product.powerRequired }
      : null,
    space?.value
      ? { icon: Maximize2, label: t("spaceNeeded"), value: space.value }
      : null,
  ].filter(Boolean) as { icon: typeof Users; label: string; value: string }[];

  const related = await getRelatedProducts(product.id, product.categoryId);

  const trust = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Truck, label: t("trustDelivery") },
  ];

  const canonical = absoluteUrl(locale, `/shop/${product.slug}`);

  const faqs = saleFaqs({
    name,
    price:
      product.salePriceCents != null
        ? formatPrice(product.salePriceCents, locale)
        : undefined,
    kind: productKindLabel(product.category?.slug),
  });

  return (
    <main>
      <JsonLd
        data={productLd({
          name,
          description: shortDescription,
          image: gallery[0]?.url,
          url: canonical,
          priceCents,
          ratingAvg: product.ratingAvg,
          ratingCount: product.ratingCount,
          sku: product.sku,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Shop", url: absoluteUrl(locale, "/shop") },
          { name, url: canonical },
        ])}
      />
      <JsonLd data={faqLd(faqs)} />
      <Section spacing="compact" className="pt-6 sm:pt-10">
        <Container>
          {/* Breadcrumb */}
          <nav className="text-muted-foreground mb-6 text-sm">
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

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {/* A — Gallery */}
            <Reveal className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
              <ProductGallery items={gallery} title={name} />
            </Reveal>

            {/* C — Details: under the gallery on desktop; on mobile it sits BELOW
                the buy box (specs) via order-3. */}
            <Reveal
              delay={0.05}
              className="order-3 lg:order-none lg:col-start-1 lg:row-start-2"
            >
              <Accordion
                type="multiple"
                defaultValue={["about"]}
                className="border-border rounded-[var(--radius-lg)] border"
              >
                <AccordionItem value="about" className="px-4 last:border-b-0">
                  <AccordionTrigger>{t("tabDescription")}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-[0.95rem] leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {features.length > 0 ? (
                  <AccordionItem
                    value="features"
                    className="px-4 last:border-b-0"
                  >
                    <AccordionTrigger>{t("tabFeatures")}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="grid gap-2.5 sm:grid-cols-2">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="text-foreground/80 flex items-start gap-2.5"
                          >
                            <Check className="text-primary mt-0.5 size-5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}

                <AccordionItem value="reviews" className="px-4 last:border-b-0">
                  <AccordionTrigger>
                    {t("tabReviews")} ({product.ratingCount})
                  </AccordionTrigger>
                  <AccordionContent>
                    <ReviewsSection
                      productId={product.id}
                      ratingAvg={product.ratingAvg}
                      ratingCount={product.ratingCount}
                      locale={locale}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Reveal>

            {/* B — Buy box (price + add to cart / buy now): right column on
                desktop, directly under the images on mobile. */}
            <Reveal
              delay={0.08}
              className="order-2 flex flex-col lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1"
            >
              <div className="flex items-center gap-3">
                <Badge variant={isRental ? "primary" : "accent"}>
                  {isRental ? tp("rentBadge") : tp("saleBadge")}
                </Badge>
                {product.sku ? (
                  <span className="text-muted-foreground text-xs">
                    {t("sku")}: {product.sku}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">
                {name}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <Stars rating={product.ratingAvg} />
                <span className="text-muted-foreground text-sm">
                  {product.ratingAvg.toFixed(1)} · {product.ratingCount}{" "}
                  {tp("reviews")}
                </span>
              </div>

              <p className="text-muted-foreground mt-4 text-lg">
                {shortDescription}
              </p>

              {priceCents != null ? (
                <div className="mt-5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display text-primary text-[2.75rem] leading-none font-extrabold tracking-tight tabular-nums">
                      {formatPrice(priceCents, locale)}
                    </span>
                    {isRental ? (
                      <span className="text-muted-foreground text-sm font-medium">
                        {tp("perDay")}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2.5 text-sm">
                    <span className="text-muted-foreground/60 tabular-nums line-through decoration-1">
                      {formatPrice(compareAtCents(priceCents), locale)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700 uppercase ring-1 ring-emerald-600/20 ring-inset">
                      {`Save ${savingsPercent(priceCents)}%`}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Specs */}
              {specs.length > 0 ? (
                <ul className="mt-6 grid grid-cols-2 gap-3">
                  {specs.map((s) => {
                    const Icon = s.icon;
                    return (
                      <li
                        key={s.label}
                        className="border-border bg-muted/40 hover:border-primary/40 hover:bg-primary-50/60 flex items-center gap-3 rounded-xl border p-3 transition-colors"
                      >
                        <Icon className="text-primary size-5 shrink-0" />
                        <span className="min-w-0">
                          <span className="text-muted-foreground block text-xs">
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

              {/* CTAs — add to cart + buy now (→ checkout) */}
              <div className="mt-7">
                <ProductCardActions
                  productId={product.id}
                  labels={{
                    add: tp("addToCart"),
                    added: tp("added"),
                    primary: tp("buyNow"),
                  }}
                />
              </div>

              {/* Trust */}
              <ul className="border-border mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-sm">
                {trust.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label} className="flex items-center gap-2">
                      <Icon className="text-primary size-4" />
                      {item.label}
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* FAQ — buying-intent content + FAQPage schema (rich-result eligible). */}
      <Section spacing="compact" className="border-border border-t">
        <Container className="max-w-3xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {`${name} — Frequently Asked Questions`}
          </h2>
          <Accordion
            type="multiple"
            defaultValue={["faq-0"]}
            className="border-border mt-6 rounded-[var(--radius-lg)] border"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="px-4 last:border-b-0"
              >
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="leading-relaxed">{f.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* Related */}
      {related.length > 0 ? (
        <Section
          spacing="compact"
          className="border-foreground/10 bg-muted/70 border-t"
        >
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
