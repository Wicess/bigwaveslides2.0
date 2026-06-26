import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowUpRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getPostBySlug, getPostSlugs, getRelatedPosts } from "@/server/data/blog";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { getExternalResources } from "@/lib/blog-resources";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/post-card";
import { ArticleContent } from "@/components/blog/article-content";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { articleLd, absoluteUrl } from "@/lib/structured-data";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

// ISR: surface admin content edits on the live site within this window.
export const revalidate = 600;

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
  const excerpt = getLocalized(post.excerpt, locale);
  const content = getLocalized(post.content, locale) || excerpt;
  const dateLabel = post.publishedAt
    ? formatDate(post.publishedAt, locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const related = await getRelatedPosts(post.id, post.categoryId);
  const resources = getExternalResources(post.category?.slug);

  return (
    <main>
      <JsonLd
        data={articleLd({
          title,
          description: excerpt,
          image: post.coverImage,
          url: absoluteUrl(locale, `/blog/${post.slug}`),
          datePublished: post.publishedAt?.toISOString(),
          author: post.author?.name,
        })}
      />

      <article>
        {/* ── Hero: compact full-bleed cover photo running up behind the nav.
            The photo sits in normal stacking order (absolute, no negative z) so
            it always paints above the fallback background; a gradient scrim —
            darker at the bottom where the text sits — keeps the title legible
            while still letting the picture show through. ── */}
        <header className="relative -mt-[108px] overflow-hidden border-b border-border bg-neutral-900 sm:-mt-[116px]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/88 via-neutral-950/45 to-neutral-950/35"
          />
          <Container className="relative z-10 max-w-4xl pb-10 pt-[124px] sm:pb-12 sm:pt-[150px]">
            <Link
              href="/blog"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {t("backToBlog")}
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/90">
              {post.category ? (
                <Link href={`/blog/category/${post.category.slug}`}>
                  <Badge variant="primary">
                    {getLocalized(post.category.name, locale)}
                  </Badge>
                </Link>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {t("readingTime", { count: post.readingMinutes })}
              </span>
              {dateLabel ? (
                <>
                  <span aria-hidden className="text-white/40">
                    •
                  </span>
                  <span>{dateLabel}</span>
                </>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.06] text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {excerpt ? (
              <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                {excerpt}
              </p>
            ) : null}

            {post.author?.name ? (
              <div className="mt-6 flex items-center gap-3">
                {post.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.avatar}
                    alt=""
                    className="size-10 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : null}
                <div className="text-sm text-white/85">
                  <p className="text-[11px] uppercase tracking-wide text-white/55">
                    {t("writtenBy")}
                  </p>
                  <p className="font-semibold text-white">{post.author.name}</p>
                </div>
              </div>
            ) : null}
          </Container>
        </header>

        {/* ── Article body ── */}
        <Section spacing="default">
          <Container className="max-w-3xl">
            <ArticleContent content={content} />

            {post.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
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

            {/* Conversion CTA — the whole point of these posts. */}
            <div className="mt-12 overflow-hidden rounded-3xl px-6 py-10 text-center text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)] sm:px-10 sm:py-12">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/75">
                {t("ctaText")}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild variant="gradient" size="lg">
                  <Link href="/contact">{t("ctaQuote")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/rent">{t("ctaBrowse")}</Link>
                </Button>
              </div>
            </div>

            {/* Further reading — authoritative external sources. */}
            {resources.length > 0 ? (
              <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 sm:p-7">
                <h2 className="font-display text-lg font-semibold">
                  {t("furtherReading")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("furtherReadingDesc")}
                </p>
                <ul className="mt-4 divide-y divide-border">
                  {resources.map((r) => (
                    <li key={r.href}>
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
                      >
                        <span>
                          <span className="block text-sm font-semibold">
                            {r.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {r.source}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Container>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section className="border-t border-border bg-muted/40">
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
