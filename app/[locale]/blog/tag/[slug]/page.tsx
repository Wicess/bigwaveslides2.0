import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  getPosts,
  getBlogCategories,
  getPopularTags,
  getTagBySlug,
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
  const tags = await getPopularTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

// ISR: surface admin content edits on the live site within this window.
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  const name = getLocalized(tag.name, locale);
  // Distinct from the same-named CATEGORY page: a tag is a cross-cutting
  // index, a category is the section a post lives in. Previously both emitted
  // the identical one-word title with no description and no canonical.
  return buildMetadata({
    locale,
    path: `/blog/tag/${slug}`,
    title: `Articles tagged "${name}" — Splash Republic`,
    description: `Posts tagged ${name.toLowerCase()}: water slide and bounce house rental advice covering cost, space, safety, weather and booking across the US.`,
  });
}

export default async function BlogTagPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const t = await getTranslations("Blog");
  const sp = await searchParams;
  const page = Math.max(
    1,
    Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1,
  );

  const [listing, categories, tags] = await Promise.all([
    getPosts({ tag: slug, page }),
    getBlogCategories(),
    getPopularTags(),
  ]);

  return (
    <main>
      <PageHeader
        eyebrow={t("tagEyebrow")}
        title={`#${getLocalized(tag.name, locale)}`}
        description={t("desc")}
      />
      <BlogView
        locale={locale}
        listing={listing}
        categories={categories}
        tags={tags}
        activeTag={slug}
      />
    </main>
  );
}
