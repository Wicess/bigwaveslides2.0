import { getTranslations } from "next-intl/server";
import { Newspaper, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { PostCard } from "@/components/blog/post-card";
import { BlogSearch } from "@/components/blog/blog-search";
import { Pagination } from "@/components/shop/pagination";
import { Reveal } from "@/components/motion/reveal";
import type { BlogListing, PostCardData } from "@/server/data/blog";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: unknown;
  _count: { posts: number };
};
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

  // The full-width "magazine" hero only makes sense on the unfiltered first
  // page; on search results and category/tag pages we go straight to the grid.
  const showFeatured =
    !query &&
    !activeCategory &&
    !activeTag &&
    listing.page === 1 &&
    listing.items.length > 0;
  const featured = showFeatured ? listing.items[0] : undefined;
  const gridItems = featured ? listing.items.slice(1) : listing.items;

  return (
    <Section spacing="compact" className="bg-muted/30 pt-8 pb-20">
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-6 lg:px-8">
        {/* Toolbar: result count + search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm font-medium">
            {query
              ? t("resultsFor", { count: listing.total, query })
              : t("results", { count: listing.total })}
          </p>
          <div className="w-full sm:max-w-xs">
            <BlogSearch initialQuery={query} />
          </div>
        </div>

        {/* Category pills replace the old sidebar so articles use the full width. */}
        <div className="mb-8 flex flex-wrap gap-2">
          <CategoryPill
            href="/blog"
            active={!activeCategory && !activeTag}
            label={t("allPosts")}
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              href={`/blog/category/${c.slug}`}
              active={activeCategory === c.slug}
              label={getLocalized(c.name, locale)}
              count={c._count.posts}
            />
          ))}
        </div>

        {listing.items.length === 0 ? (
          <div className="border-border bg-background flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed p-16 text-center">
            <Newspaper className="text-muted-foreground size-10" />
            <p className="font-semibold">{t("emptyTitle")}</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t("emptyDesc")}
            </p>
          </div>
        ) : (
          <>
            {featured ? (
              <FeaturedCard
                post={featured}
                locale={locale}
                label={t("featured")}
                readingTime={(count: number) => t("readingTime", { count })}
                readMore={t("readMore")}
              />
            ) : null}

            {gridItems.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {gridItems.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 4) * 0.05}>
                    <PostCard
                      post={post}
                      locale={locale}
                      priority={!featured && i < 2}
                    />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </>
        )}

        <Pagination page={listing.page} pageCount={listing.pageCount} />

        {/* Popular tags moved to a clean footer row. */}
        {tags.length > 0 ? (
          <div className="border-border mt-16 border-t pt-8">
            <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
              {t("tags")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    activeTag === tag.slug
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  #{getLocalized(tag.name, locale)}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function CategoryPill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-white shadow-[0_6px_18px_-8px_rgba(0,153,255,0.8)]"
          : "border-border bg-background text-foreground hover:border-primary/50 hover:text-primary",
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span
          className={cn(
            "text-xs",
            active ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function FeaturedCard({
  post,
  locale,
  label,
  readingTime,
  readMore,
}: {
  post: PostCardData;
  locale: string;
  label: string;
  readingTime: (count: number) => string;
  readMore: string;
}) {
  const title = getLocalized(post.title, locale);
  const excerpt = getLocalized(post.excerpt, locale);

  return (
    <Reveal>
      <Link
        href={`/blog/${post.slug}`}
        className="group border-border bg-background hover:border-primary/30 mb-10 grid overflow-hidden rounded-3xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] lg:grid-cols-2"
      >
        <div className="relative">
          <MediaImage
            src={post.coverImage ?? ""}
            alt={title}
            rounded={false}
            priority
            className="aspect-[16/10] w-full lg:aspect-auto lg:h-full"
            imgClassName="group-hover:scale-[1.03]"
            sizes="(min-width:1024px) 50vw, 100vw"
          />
          <span className="bg-primary absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white uppercase shadow-[0_6px_18px_-8px_rgba(0,153,255,0.9)]">
            <Sparkles className="size-3.5" />
            {label}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {post.category ? (
              <Badge variant="primary">
                {getLocalized(post.category.name, locale)}
              </Badge>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {readingTime(post.readingMinutes)}
            </span>
          </div>

          <h3 className="font-display group-hover:text-primary text-2xl leading-tight font-bold tracking-tight transition-colors sm:text-3xl lg:text-[2rem]">
            {title}
          </h3>

          {excerpt ? (
            <p className="text-muted-foreground line-clamp-3 text-pretty">
              {excerpt}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {post.author?.name ? `${post.author.name} · ` : ""}
              {post.publishedAt ? formatDate(post.publishedAt, locale) : ""}
            </span>
            <span className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
              {readMore}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
