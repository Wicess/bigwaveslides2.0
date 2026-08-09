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

// ISR: surface admin content edits on the live site within this window.
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  return buildMetadata({
    locale,
    path: "/blog",
    title: fr
      ? "Guide des glissades d'eau — location, achat & idées de fête"
      : "Water Slide Rental Guides, Buying Tips & Party Ideas",
    description: fr
      ? "Conseils pour louer ou acheter des glissades d'eau gonflables, idées de fêtes, sécurité et planification d'événements — par les experts de la glissade."
      : "Expert guides on renting and buying inflatable water slides, plus party planning ideas, safety tips and event inspiration for your next water slide event.",
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
