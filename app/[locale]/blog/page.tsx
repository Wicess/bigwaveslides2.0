import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import {
  getPosts,
  getBlogCategories,
  getPopularTags,
} from "@/server/data/blog";
import { PageHeader } from "@/components/ui/page-header";
import { BlogView } from "@/components/blog/blog-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
};

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
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/blog",
    title: "Water Slide Rental Guides, Buying Tips & Party Ideas",
    description:
      "Expert guides on renting and buying inflatable water slides, plus party planning ideas, safety tips and event inspiration for your next water slide event.",
    keywords: [
      "water slide rental guide",
      "inflatable water slide tips",
      "backyard water slide party ideas",
      "buy water slides guide",
    ],
  });
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Blog");
  const sp = await searchParams;
  const q = one(sp.q);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [listing, categories, tags] = await Promise.all([
    getPosts({ q, page }),
    getBlogCategories(),
    getPopularTags(),
  ]);

  return (
    <main>
      <PageHeader
        title={t("title")}
        description={t("desc")}
        align="center"
        overlapHeader
        backgroundImage="https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog/1782479234273-ipwk85-overview-dream-space-water-park-chongqing-china-photo01-2048x1277.jpg"
      />
      <BlogView
        locale={locale}
        listing={listing}
        categories={categories}
        tags={tags}
        query={q}
      />
    </main>
  );
}
