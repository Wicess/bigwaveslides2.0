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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getBlogCategoryBySlug(slug);
  if (!category) return {};
  return { title: getLocalized(category.name, locale) };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const category = await getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const t = await getTranslations("Blog");
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);

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
