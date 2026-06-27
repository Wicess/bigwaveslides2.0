import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/ui/media-image";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { ProductCardActions } from "@/components/shop/product-card-actions";

export type CardProduct = {
  id: string;
  slug: string;
  type: "SALE" | "RENTAL" | "BOTH";
  name: unknown;
  salePriceCents: number | null;
  dailyRateCents: number | null;
  ratingAvg: number;
  ratingCount: number;
  media: { url: string; alt: unknown }[];
};

export async function ProductCard({
  product,
  locale,
  className,
  priority,
  query,
  context,
}: {
  product: CardProduct;
  locale: string;
  className?: string;
  priority?: boolean;
  /** Optional query string (without `?`) appended to the detail link. */
  query?: string;
  /** Which surface this card lives on — drives the link + primary action.
      Defaults to inferring from the product type. */
  context?: "rent" | "shop";
}) {
  const t = await getTranslations("Product");
  const name = getLocalized(product.name, locale);

  // On the rent page everything links to /rent and offers "Rent now"; on the
  // shop page everything links to /shop and offers "Buy now". For BOTH-type
  // products the page context decides.
  const surface: "rent" | "shop" =
    context ?? (product.type === "RENTAL" ? "rent" : "shop");
  const isRental = surface === "rent";

  const base = isRental ? `/rent/${product.slug}` : `/shop/${product.slug}`;
  const href = query ? `${base}?${query}` : base;
  const rentHref = `/rent/checkout?product=${product.slug}`;
  const image = product.media[0]?.url;

  const priceCents = isRental ? product.dailyRateCents : product.salePriceCents;
  const price = priceCents != null ? formatPrice(priceCents, locale) : null;

  return (
    // The whole card lifts on hover; the photo + text link to the detail page,
    // while the action buttons (a separate client component) sit below.
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-border/60 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <Link href={href} className="relative block overflow-hidden">
        {image ? (
          <MediaImage
            src={image}
            alt={name}
            rounded={false}
            className="aspect-[4/3] w-full"
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:440px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-muted" />
        )}
        <Badge
          variant={isRental ? "primary" : "accent"}
          className="absolute left-3 top-3 shadow-sm"
        >
          {isRental ? t("rentBadge") : t("saleBadge")}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Stars rating={product.ratingAvg} size="size-3.5" />
            <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
          </span>
          {price ? (
            <span className="font-display font-bold text-primary">
              {price}
              {isRental ? (
                <span className="text-xs font-medium text-muted-foreground">{t("perDay")}</span>
              ) : null}
            </span>
          ) : null}
        </div>

        {/* `mt-auto` pins the actions to the bottom so ragged titles still align. */}
        <div className="mt-auto pt-1">
          <ProductCardActions
            productId={product.id}
            context={surface}
            rentHref={rentHref}
            labels={{
              add: t("addToCart"),
              added: t("added"),
              primary: isRental ? t("rentNow") : t("buyNow"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
