import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { MediaImage } from "@/components/ui/media-image";
import type { CardProduct } from "@/components/shop/product-card";

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/featured";

/** Curated water-slide imagery for the featured cards (served from R2). */
const FEATURED_IMAGES = [
  `${R2}/serengeti.jpg`,
  `${R2}/blaster.jpg`,
  `${R2}/rapids.jpg`,
  `${R2}/aquasplash.jpg`,
];

export async function FeaturedSlides({
  products,
  locale,
}: {
  products: CardProduct[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (products.length === 0) return null;

  return (
    <Section className="bg-muted">
      <Container className="max-w-[100rem]">
        {/* Centered header */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {t("featuredTitle")}
            </h2>
            <p className="mx-auto mt-4 text-pretty text-lg text-muted-foreground">
              {t("featuredDesc")}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {products.slice(0, 4).map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.1}>
              <FeaturedCard
                product={product}
                locale={locale}
                image={FEATURED_IMAGES[i]}
                priority={i < 4}
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
  const name = getLocalized(product.name, locale);
  const isRental = product.type === "RENTAL";
  const href = isRental ? `/rent/${product.slug}` : `/shop/${product.slug}`;
  const src = image ?? product.media[0]?.url;

  const price =
    product.type === "SALE"
      ? product.salePriceCents != null
        ? formatPrice(product.salePriceCents, locale)
        : null
      : product.dailyRateCents != null
        ? formatPrice(product.dailyRateCents, locale)
        : null;

  return (
    <Link
      href={href}
      className="group block rounded-[1.75rem] border border-border/70 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] sm:p-4"
    >
      <div className="overflow-hidden rounded-[1.25rem]">
        {src ? (
          <MediaImage
            src={src}
            alt={name}
            className="aspect-[4/3] w-full"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.05]"
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-background" />
        )}
      </div>

      <div className="px-2 pb-3 pt-5 sm:px-3">
        <h3 className="font-display text-lg font-bold tracking-tight text-accent transition-colors group-hover:text-primary sm:text-xl">
          {name}
        </h3>
        {price ? (
          <p className="mt-2 font-semibold text-primary">
            {price}
            {isRental ? (
              <span className="text-sm font-medium text-muted-foreground">
                {t("perDay")}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
