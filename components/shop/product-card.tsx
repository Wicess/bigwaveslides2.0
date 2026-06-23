import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/ui/media-image";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/components/shop/wishlist-button";

export type CardProduct = {
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
}: {
  product: CardProduct;
  locale: string;
  className?: string;
  priority?: boolean;
}) {
  const t = await getTranslations("Product");
  const name = getLocalized(product.name, locale);
  const isRental = product.type === "RENTAL";
  const href = isRental ? `/rent/${product.slug}` : `/shop/${product.slug}`;
  const image = product.media[0]?.url;

  const price =
    product.type === "SALE"
      ? product.salePriceCents != null
        ? formatPrice(product.salePriceCents, locale)
        : null
      : product.dailyRateCents != null
        ? formatPrice(product.dailyRateCents, locale)
        : null;

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative">
        {image ? (
          <MediaImage
            src={image}
            alt={name}
            className="aspect-[4/3] w-full"
            imgClassName="group-hover:scale-[1.04]"
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="aspect-[4/3] w-full rounded-[var(--radius-lg)] bg-muted" />
        )}
        <Badge
          variant={isRental ? "primary" : "accent"}
          className="absolute left-3 top-3"
        >
          {isRental ? t("rentBadge") : t("saleBadge")}
        </Badge>
        <WishlistButton
          slug={product.slug}
          name={name}
          className="absolute right-3 top-3"
        />
      </div>

      <div className="mt-3 px-0.5">
        <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
          {name}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Stars rating={product.ratingAvg} size="size-3.5" />
            <span className="text-xs text-muted-foreground">
              ({product.ratingCount})
            </span>
          </span>
          {price ? (
            <span className="font-display font-bold text-primary">
              {price}
              {isRental ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {t("perDay")}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
