import { getTranslations } from "next-intl/server";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { MediaImage } from "@/components/ui/media-image";
import { Badge } from "@/components/ui/badge";
import type { PostCardData } from "@/server/data/blog";

export async function PostCard({
  post,
  locale,
  priority,
}: {
  post: PostCardData;
  locale: string;
  priority?: boolean;
}) {
  const t = await getTranslations("Blog");
  const title = getLocalized(post.title, locale);
  const excerpt = getLocalized(post.excerpt, locale);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.coverImage ? (
          <MediaImage
            src={post.coverImage}
            alt={title}
            className="aspect-[16/9] w-full"
            imgClassName="group-hover:scale-[1.04]"
            sizes="(min-width:1024px) 33vw, 100vw"
            priority={priority}
            rounded={false}
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-muted" />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.category ? (
            <Badge variant="primary">{getLocalized(post.category.name, locale)}</Badge>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {t("readingTime", { count: post.readingMinutes })}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors group-hover:text-primary"
          >
            {title}
          </Link>
        </h3>
        {excerpt ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
            {excerpt}
          </p>
        ) : (
          <span className="flex-1" />
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {post.author?.name ? `${post.author.name} · ` : ""}
            {post.publishedAt ? formatDate(post.publishedAt, locale) : ""}
          </span>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            {t("readMore")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
