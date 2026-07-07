import { permanentRedirect } from "next/navigation";

/**
 * The standalone category page was retired — category browsing now happens on
 * the main, fully-styled /shop page filtered by `?category=`. A 308 permanent
 * redirect makes Google consolidate the old path into /shop and drop the stale
 * index entry (a temporary redirect would keep the retired URL indexed with its
 * outdated title/description).
 */
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ShopCategoryRedirect({ params }: Props) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/shop?category=${encodeURIComponent(slug)}`);
}
