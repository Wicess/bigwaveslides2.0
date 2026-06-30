import { redirect } from "next/navigation";

/**
 * The standalone category page was retired — category browsing now happens on
 * the main, fully-styled /shop page filtered by `?category=`. We redirect here
 * so any existing links/bookmarks/SEO for the old path land on the right place.
 */
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ShopCategoryRedirect({ params }: Props) {
  const { locale, slug } = await params;
  redirect(`/${locale}/shop?category=${encodeURIComponent(slug)}`);
}
