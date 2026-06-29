import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Users, Zap, Baby, Ruler, ShieldCheck, Sparkles, Truck, Weight, Maximize2 } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getRentalBySlug,
  getRelatedRentals,
  getRentalSlugs,
} from "@/server/data/rentals";
import { getLocalized } from "@/lib/localized";
import { buildMetadata, rentProductSeo } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery, type GalleryItem } from "@/components/shop/product-gallery";
import { ProductCardActions } from "@/components/shop/product-card-actions";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { productLd, absoluteUrl } from "@/lib/structured-data";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getRentalSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getRentalBySlug(slug);
  if (!product) return {};
  const name = getLocalized(product.name, locale);
  const seo = rentProductSeo(name, locale);
  const customTitle = product.metaTitle ? getLocalized(product.metaTitle, locale) : "";
  const customDesc = product.metaDescription ? getLocalized(product.metaDescription, locale) : "";
  return buildMetadata({
    locale,
    path: `/rent/${slug}`,
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

export default async function RentalDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const product = await getRentalBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("RentalDetail");
  const tp = await getTranslations("Product");

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

  const dims = (product.dimensions as { size?: string; weight?: string } | null) ?? null;
  const space = (product.spaceRequired as { value?: string } | null) ?? null;
  const dimText =
    dims?.size ??
    (product.dimensions
      ? Object.values(product.dimensions as Record<string, unknown>)
          .filter((v) => typeof v === "string" || typeof v === "number")
          .join(" × ")
      : "");

  const specs = [
    product.capacity != null
      ? { icon: Users, label: t("capacity"), value: t("people", { count: product.capacity }) }
      : null,
    product.ageRange ? { icon: Baby, label: t("ageRange"), value: product.ageRange } : null,
    dimText ? { icon: Ruler, label: t("dimensions"), value: dimText } : null,
    dims?.weight ? { icon: Weight, label: t("weight"), value: dims.weight } : null,
    product.powerRequired
      ? { icon: Zap, label: t("power"), value: product.powerRequired }
      : null,
    space?.value ? { icon: Maximize2, label: t("spaceNeeded"), value: space.value } : null,
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
      <Section spacing="compact" className="pt-6 sm:pt-10">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/rent" className="hover:text-primary">
              {t("breadcrumbRent")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Gallery + details accordion */}
            <div className="space-y-6">
              <Reveal>
                <ProductGallery items={gallery} title={name} />
              </Reveal>

              <Reveal delay={0.05}>
                <Accordion
                  type="multiple"
                  defaultValue={["about"]}
                  className="rounded-[var(--radius-lg)] border border-border"
                >
                  {description ? (
                    <AccordionItem value="about" className="px-4 last:border-b-0">
                      <AccordionTrigger>{t("about")}</AccordionTrigger>
                      <AccordionContent>
                        <p className="whitespace-pre-line text-[0.95rem] leading-relaxed">
                          {description}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}

                  {features.length > 0 ? (
                    <AccordionItem value="features" className="px-4 last:border-b-0">
                      <AccordionTrigger>{t("features")}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-foreground/80">
                              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}
                </Accordion>
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

                {product.dailyRateCents != null ? (
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-primary">
                      {formatPrice(product.dailyRateCents, locale)}
                    </span>
                    <span className="text-muted-foreground">{tp("perDay")}</span>
                  </div>
                ) : null}

                {product.depositCents ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("refundableDeposit")}: {formatPrice(product.depositCents, locale)}
                  </p>
                ) : null}

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
                  <ProductCardActions
                    productId={product.id}
                    labels={{ add: tp("addToCart"), added: tp("added"), primary: tp("rentNow") }}
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
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section spacing="compact" className="border-t border-foreground/10 bg-muted/70">
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
