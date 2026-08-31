import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { getRenamedProductSlug } from "@/server/data/products";
import {
  Users,
  Zap,
  Baby,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
  Weight,
  Maximize2,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getRentalBySlug,
  getRelatedRentals,
  getRentalSlugs,
} from "@/server/data/rentals";
import { getGuideLinks } from "@/server/data/blog";
import { serviceAreaLinks, pickN, hashSeed } from "@/lib/internal-links";
import { getLocalized } from "@/lib/localized";
import {
  buildMetadata,
  rentProductSeo,
  productKindLabel,
  heightFromDimensions,
} from "@/lib/seo";
import { rentalFaqs } from "@/lib/product-faq";
import { formatPrice, compareAtCents, savingsPercent } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
import {
  ProductGallery,
  type GalleryItem,
} from "@/components/shop/product-gallery";
import { ProductCardActions } from "@/components/shop/product-card-actions";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { productLd, faqLd, absoluteUrl } from "@/lib/structured-data";

// See the note on the blog pages: widened because revalidateTag("products")
// makes catalog edits appear immediately, so this window is only a backstop.
export const revalidate = 21600;

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
  const seo = rentProductSeo(name, {
    price:
      product.dailyRateCents != null
        ? formatPrice(product.dailyRateCents, locale)
        : undefined,
    kind: productKindLabel(product.category?.slug),
    heightFt: heightFromDimensions(product.dimensions),
    age: product.ageRange,
    space: (product.spaceRequired as { value?: string } | null)?.value ?? null,
    summary: getLocalized(product.shortDescription, locale),
  });
  const customTitle = product.metaTitle
    ? getLocalized(product.metaTitle, locale)
    : "";
  const customDesc = product.metaDescription
    ? getLocalized(product.metaDescription, locale)
    : "";
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
  if (!product) {
    // The rename changed every product URL. Old ones were indexed and are
    // still requested, so hand them to the renamed page instead of 404ing.
    const renamed = await getRenamedProductSlug(slug);
    if (renamed) permanentRedirect(`/${locale}/rent/${renamed}`);
    notFound();
  }

  const t = await getTranslations("RentalDetail");
  const tp = await getTranslations("Product");

  const name = getLocalized(product.name, locale);
  const shortDescription = getLocalized(product.shortDescription, locale);
  const description =
    getLocalized(product.description, locale) || shortDescription;
  const features = asList(product.features, locale);
  const unitsAvailable = product._count.rentalUnits;

  const gallery: GalleryItem[] = product.media.map((m) => ({
    type: m.type,
    url: m.url,
    alt: getLocalized(m.alt, locale, name),
  }));

  const dims =
    (product.dimensions as { size?: string; weight?: string } | null) ?? null;
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

  const related = await getRelatedRentals(product.id, product.categoryId);

  // Internal links out to the ranking location pages + a couple of blog guides,
  // seeded by slug so each product sends equity to a different mix.
  const seed = hashSeed(product.slug);
  const areas = serviceAreaLinks(seed, 8, 2);
  const guides = pickN(await getGuideLinks().catch(() => []), seed, 3);

  const trust = [
    { icon: ShieldCheck, label: t("trustInsured") },
    { icon: Sparkles, label: t("trustClean") },
    { icon: Truck, label: t("trustDelivery") },
  ];

  const faqs = rentalFaqs({
    name,
    price:
      product.dailyRateCents != null
        ? formatPrice(product.dailyRateCents, locale)
        : undefined,
    dims: dimText,
    age: product.ageRange,
  });

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
      <JsonLd data={faqLd(faqs)} />
      <Section spacing="compact" className="pt-6 sm:pt-10">
        <Container>
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t("breadcrumbRent"), href: "/rent" },
              { label: name },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            {/* A — Gallery */}
            <Reveal className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
              <ProductGallery items={gallery} title={name} />
            </Reveal>

            {/* C — Details accordion: under the gallery on desktop; on mobile it
                sits BELOW the buy box (specs/power) via order-3. */}
            <Reveal
              delay={0.05}
              className="order-3 lg:order-none lg:col-start-1 lg:row-start-2"
            >
              <Accordion
                type="multiple"
                defaultValue={["about"]}
                className="border-border rounded-[var(--radius-lg)] border"
              >
                {description ? (
                  <AccordionItem value="about" className="px-4 last:border-b-0">
                    <AccordionTrigger>{t("about")}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-[0.95rem] leading-relaxed whitespace-pre-line">
                        {description}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}

                {features.length > 0 ? (
                  <AccordionItem
                    value="features"
                    className="px-4 last:border-b-0"
                  >
                    <AccordionTrigger>{t("features")}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="text-foreground/80 flex items-start gap-2"
                          >
                            <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
              </Accordion>
            </Reveal>

            {/* B — Buy box (price + add to cart / rent now). Right column on
                desktop; on mobile it sits directly under the images. */}
            <Reveal
              delay={0.1}
              className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1"
            >
              <div className="flex flex-col lg:sticky lg:top-28">
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{tp("rentBadge")}</Badge>
                  {unitsAvailable > 0 ? (
                    <span className="text-muted-foreground text-xs">
                      {t("unitsAvailable", { count: unitsAvailable })}
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

                <p className="text-muted-foreground mt-4">{shortDescription}</p>

                {product.dailyRateCents != null ? (
                  <div className="mt-5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-primary text-[2.75rem] leading-none font-extrabold tracking-tight tabular-nums">
                        {formatPrice(product.dailyRateCents, locale)}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">
                        {tp("perDay")}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2.5 text-sm">
                      <span className="text-muted-foreground/60 tabular-nums line-through decoration-1">
                        {formatPrice(
                          compareAtCents(product.dailyRateCents),
                          locale,
                        )}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700 uppercase ring-1 ring-emerald-600/20 ring-inset">
                        {`Save ${savingsPercent(product.dailyRateCents)}%`}
                      </span>
                    </div>
                  </div>
                ) : null}

                {specs.length > 0 ? (
                  <ul className="mt-5 grid grid-cols-2 gap-3">
                    {specs.map((s) => {
                      const Icon = s.icon;
                      return (
                        <li
                          key={s.label}
                          className="border-border flex items-center gap-3 rounded-[var(--radius-lg)] border p-3"
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

                <div className="mt-6">
                  <ProductCardActions
                    productId={product.id}
                    mode="RENT"
                    labels={{
                      add: tp("addToCart"),
                      added: tp("added"),
                      primary: tp("rentNow"),
                    }}
                    // Straight to the one-page reservation, where the date is
                    // checked before anything else is asked for.
                    directHref={`/rent/checkout?product=${product.slug}`}
                  />
                </div>

                <div className="border-border mt-5 flex items-center justify-between gap-3 border-t pt-5">
                  <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {trust.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.label}
                          className="flex items-center gap-2"
                        >
                          <Icon className="text-primary size-4" />
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

      {/* FAQ — real on-page content + FAQPage schema (rich-result eligible). */}
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

      {/* Internal links: this product page sends equity to the ranking location
          pages and a couple of guides, tying the catalog into the rest of the
          site. */}
      {areas.length > 0 || guides.length > 0 ? (
        <Section spacing="compact" className="border-border border-t">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t("availableAcrossUsa")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="border-border bg-muted/40 hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <MapPin className="text-primary size-3.5" />
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>

              {guides.length > 0 ? (
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    {t("planningGuides")}
                  </p>
                  <ul className="divide-border mt-3 divide-y">
                    {guides.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/blog/${g.slug}`}
                          className="group hover:text-primary flex items-center justify-between gap-3 py-2.5 text-sm font-semibold transition-colors"
                        >
                          <span className="min-w-0">
                            {getLocalized(g.title, locale)}
                          </span>
                          <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
