import { getTranslations } from "next-intl/server";
import { Newspaper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PostCard } from "@/components/blog/post-card";
import { BlogSearch } from "@/components/blog/blog-search";
import { Pagination } from "@/components/shop/pagination";
import { Reveal } from "@/components/motion/reveal";
import type { BlogListing } from "@/server/data/blog";
import { cn } from "@/lib/utils";

type Category = { id: string; slug: string; name: unknown; _count: { posts: number } };
type TagItem = { id: string; slug: string; name: unknown };

export async function BlogView({
  locale,
  listing,
  categories,
  tags,
  activeCategory,
  activeTag,
  query,
}: {
  locale: string;
  listing: BlogListing;
  categories: Category[];
  tags: TagItem[];
  activeCategory?: string;
  activeTag?: string;
  query?: string;
}) {
  const t = await getTranslations("Blog");

  return (
    <Section spacing="compact" className="bg-muted/40 pt-8 pb-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          {/* Main */}
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {query
                  ? t("resultsFor", { count: listing.total, query })
                  : t("results", { count: listing.total })}
              </p>
            </div>

            {listing.items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border p-12 text-center">
                <Newspaper className="size-10 text-muted-foreground" />
                <p className="font-semibold">{t("emptyTitle")}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{t("emptyDesc")}</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {listing.items.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 2) * 0.05}>
                    <PostCard post={post} locale={locale} priority={i < 2} />
                  </Reveal>
                ))}
              </div>
            )}

            <Pagination page={listing.page} pageCount={listing.pageCount} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <BlogSearch initialQuery={query} />

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("categories")}
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/blog"
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                      !activeCategory && !activeTag && "bg-primary-50 font-semibold text-primary",
                    )}
                  >
                    {t("allPosts")}
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/blog/category/${c.slug}`}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                        activeCategory === c.slug && "bg-primary-50 font-semibold text-primary",
                      )}
                    >
                      <span>{getLocalized(c.name, locale)}</span>
                      <span className="text-xs text-muted-foreground">{c._count.posts}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {tags.length > 0 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("tags")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tag/${tag.slug}`}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        activeTag === tag.slug
                          ? "border-primary bg-primary text-white"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      {getLocalized(tag.name, locale)}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
