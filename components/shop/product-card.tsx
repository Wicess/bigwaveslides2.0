import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/ui/media-image";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";

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
  query,
}: {
  product: CardProduct;
  locale: string;
  className?: string;
  priority?: boolean;
  /** Optional query string (without `?`) appended to the card link. */
  query?: string;
}) {
  const t = await getTranslations("Product");
  const name = getLocalized(product.name, locale);
  const isRental = product.type === "RENTAL";
  const base = isRental ? `/rent/${product.slug}` : `/shop/${product.slug}`;
  const href = query ? `${base}?${query}` : base;
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
    // White rounded card matching the landing-page card style: a subtle ring +
    // soft shadow, the whole card lifts on hover, and the photo gently zooms.
    // `overflow-hidden` clips the zooming image to the rounded corners.
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-border/60 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="relative overflow-hidden">
        {image ? (
          <MediaImage
            src={image}
            alt={name}
            rounded={false}
            className="aspect-[4/3] w-full"
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            priority={priority}
          />
        ) : (
          <div className="aspect-[4/3] w-full bg-muted" />
        )}
        {/* Floating "Rent" / "Sale" chip, like the category/blog cards. */}
        <Badge
          variant={isRental ? "primary" : "accent"}
          className="absolute left-3 top-3 shadow-sm"
        >
          {isRental ? t("rentBadge") : t("saleBadge")}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">
          {name}
        </h3>
        {/* `mt-auto` pins this row to the bottom so cards of different title
            lengths still line up their price/rating. */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
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
