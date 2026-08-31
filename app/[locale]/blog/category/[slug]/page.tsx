import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  getPosts,
  getBlogCategories,
  getPopularTags,
  getBlogCategoryBySlug,
} from "@/server/data/blog";
import { getLocalized } from "@/lib/localized";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { BlogView } from "@/components/blog/blog-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: SearchParams;
};

export async function generateStaticParams() {
  const categories = await getBlogCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

// Neon bills by how long the database stays awake and only suspends after ~5
// minutes with zero queries. Every ISR regeneration runs server queries, and
// this site has 345 indexable pages being crawled steadily — at a 10-minute
// window the staggered regenerations alone were enough to keep the database
// from ever getting a quiet 5 minutes.
//
// Widened deliberately, not blindly: correctness comes from explicit
// invalidation, not from a short timer. Publishing or editing a post calls
// revalidateTag("blog") (server/actions/admin-blog.ts) and catalog edits call
// revalidateTag("products"), so an edit is live immediately regardless of this
// number. A deploy busts everything as well. The window is now only a backstop
// for changes made straight in the database by a script.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getBlogCategoryBySlug(slug);
  if (!category) return {};
  const name = getLocalized(category.name, locale);
  // Was `{ title: name }` alone — which produced a four-character title
  // ("Guides"), no description, and no canonical, on 7 pages. Worse, the tag
  // of the same name produced a byte-identical title, so Search Console saw
  // two URLs competing with one title. Both now say which surface they are.
  return buildMetadata({
    locale,
    path: `/blog/category/${slug}`,
    title: `${name} — Water Slide Rental Guides & Advice`,
    description: `Every ${name.toLowerCase()} article from Splash Republic — practical, US-specific guidance on renting inflatable water slides, bounce houses and combo units.`,
  });
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const category = await getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const t = await getTranslations("Blog");
  const sp = await searchParams;
  const page = Math.max(
    1,
    Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1,
  );

  const [listing, categories, tags] = await Promise.all([
    getPosts({ category: slug, page }),
    getBlogCategories(),
    getPopularTags(),
  ]);

  return (
    <main>
      <PageHeader
        eyebrow={t("categoryEyebrow")}
        title={getLocalized(category.name, locale)}
        description={getLocalized(category.description, locale) || t("desc")}
      />
      <BlogView
        locale={locale}
        listing={listing}
        categories={categories}
        tags={tags}
        activeCategory={slug}
      />
    </main>
  );
}
