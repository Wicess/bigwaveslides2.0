import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getPostBySlug, getPostSlugs, getRelatedPosts } from "@/server/data/blog";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/ui/media-image";
import { PostCard } from "@/components/blog/post-card";
import { Reveal } from "@/components/motion/reveal";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: getLocalized(post.metaTitle ?? post.title, locale),
    description: getLocalized(post.metaDescription ?? post.excerpt, locale),
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const title = getLocalized(post.title, locale);
  const content = getLocalized(post.content, locale) || getLocalized(post.excerpt, locale);
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  const related = await getRelatedPosts(post.id, post.categoryId);

  return (
    <main>
      <article>
        <Section className="pt-28 sm:pt-32" spacing="compact">
          <Container className="max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="size-4" />
              {t("backToBlog")}
            </Link>

            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              {post.category ? (
                <Link href={`/blog/category/${post.category.slug}`}>
                  <Badge variant="primary">
                    {getLocalized(post.category.name, locale)}
                  </Badge>
                </Link>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {t("readingTime", { count: post.readingMinutes })}
              </span>
            </div>

            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.1] sm:text-5xl">
              {title}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              {post.author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : null}
              <div className="text-sm">
                {post.author?.name ? (
                  <p className="font-semibold">{post.author.name}</p>
                ) : null}
                {post.publishedAt ? (
                  <p className="text-muted-foreground">
                    {formatDate(post.publishedAt, locale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </Container>
        </Section>

        {post.coverImage ? (
          <Container className="max-w-4xl">
            <Reveal>
              <MediaImage
                src={post.coverImage}
                alt={title}
                priority
                className="aspect-[16/9]"
                sizes="(min-width:1024px) 896px, 100vw"
              />
            </Reveal>
          </Container>
        ) : null}

        <Section spacing="compact">
          <Container className="max-w-3xl">
            <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>

            {post.tags.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    #{getLocalized(tag.name, locale)}
                  </Link>
                ))}
              </div>
            ) : null}
          </Container>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section className="bg-muted/40">
          <Container>
            <SectionHeader title={t("relatedTitle")} />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 0.05}>
                  <PostCard post={p} locale={locale} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}
