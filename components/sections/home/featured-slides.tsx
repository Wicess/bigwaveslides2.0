/*
 * FeaturedSlides
 * A homepage section that shows a row of four highlighted products (water
 * slides) as image cards, with a centered title above them. Each card links to
 * that product's rent or shop page. Appears partway down the landing page.
 *
 * This is a Server Component, so it receives the product data and locale as
 * props and fetches translations on the server.
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { MediaImage } from "@/components/ui/media-image";
import type { CardProduct } from "@/components/shop/product-card";

export async function FeaturedSlides({
  products,
  locale,
}: {
  products: CardProduct[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  // Nothing to show? Render nothing instead of an empty section.
  if (products.length === 0) return null;

  return (
    // Vertical padding grows on larger screens (py-10 -> sm: -> lg:).
    <Section className="bg-muted py-10 sm:py-14 lg:py-16">
      <Container className="max-w-[100rem]">
        {/* Centered header */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t("featuredTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 text-lg text-pretty">
              {t("featuredDesc")}
            </p>
          </div>
        </Reveal>

        {/* Responsive grid: 1 column on phones, 2 on small screens, 4 on large. */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Only the first four products are shown. delay={i * 0.1} staggers
              each card's reveal animation so they appear one after another. */}
          {products.slice(0, 4).map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.1} scale>
              <FeaturedCard
                product={product}
                locale={locale}
                // Not above the fold, so these images load lazily, not eagerly.
                priority={false}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

async function FeaturedCard({
  product,
  locale,
  image,
  priority,
}: {
  product: CardProduct;
  locale: string;
  image?: string;
  priority?: boolean;
}) {
  const t = await getTranslations("Product");
  // Pick the product name in the current language.
  const name = getLocalized(product.name, locale);
  // "Our most-loved slides" is a rental section: anything rentable (type
  // RENTAL *or* BOTH) links to its /rent page ("Rent now"). Only pure SALE
  // products fall through to /shop. Nearly every slide is BOTH, so keying on
  // === "RENTAL" alone wrongly sent them to the Buy page.
  const isRental = product.type === "RENTAL" || product.type === "BOTH";
  const href = isRental ? `/rent/${product.slug}` : `/shop/${product.slug}`;
  // Use the curated featured image if given; otherwise fall back to the
  // product's own first photo.
  const src = image ?? product.media[0]?.url;

  // Show the sale price for items being sold, or the daily rate for rentals.
  // Either may be missing, in which case we show no price.
  const price =
    product.type === "SALE"
      ? product.salePriceCents != null
        ? formatPrice(product.salePriceCents, locale)
        : null
      : product.dailyRateCents != null
        ? formatPrice(product.dailyRateCents, locale)
        : null;

  return (
    // The whole card is one link. "group" lets child elements react to hover
    // on the card (see group-hover below). On hover the card lifts slightly.
    <Link
      href={href}
      className="group border-border/70 block rounded-[1.75rem] border bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] sm:p-4"
    >
      {/* overflow-hidden + rounded clips the zooming image to the rounded frame. */}
      <div className="overflow-hidden rounded-[1.25rem]">
        {src ? (
          <MediaImage
            src={src}
            alt={name}
            className="aspect-[4/3] w-full"
            // Image zooms in a touch when the card is hovered.
            imgClassName="transition-transform duration-500 group-hover:scale-[1.05]"
            // Tells the browser how wide the image will display at each
            // breakpoint so it can download the right-sized file (saves data).
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="bg-background aspect-[4/3] w-full" />
        )}
      </div>

      <div className="px-2 pt-5 pb-3 sm:px-3">
        <h3 className="font-display text-accent group-hover:text-primary text-lg font-bold tracking-tight transition-colors sm:text-xl">
          {name}
        </h3>
        {price ? (
          <p className="text-primary mt-2 font-semibold">
            {price}
            {isRental ? (
              <span className="text-muted-foreground text-sm font-medium">
                {t("perDay")}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
