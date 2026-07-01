import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowUpRight } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/server/data/blog";
import { getLocalized } from "@/lib/localized";
import { buildMetadata } from "@/lib/seo";
import { optimizedSrc } from "@/lib/image-loader";
import { formatDate } from "@/lib/format";
import { getExternalResources } from "@/lib/blog-resources";
import { extractHeadings } from "@/lib/toc";
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
  // Keyword signal derived from the post's own taxonomy (tags + category).
  const keywords = [
    ...post.tags.map((tg) => getLocalized(tg.name, locale)),
    ...(post.category ? [getLocalized(post.category.name, locale)] : []),
  ].filter(Boolean) as string[];
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: getLocalized(post.metaTitle ?? post.title, locale),
    description: getLocalized(post.metaDescription ?? post.excerpt, locale),
    image: post.coverImage ?? null,
    type: "article",
    keywords,
  });
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
  const headings = extractHeadings(content);
  const dateLabel = post.publishedAt
    ? formatDate(post.publishedAt, locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const related = await getRelatedPosts(post.id, post.categoryId);
  const resources = getExternalResources(post.category?.slug);

  // CTA + resources cards are reused in the sticky right rail (desktop) and
  // stacked under the article (mobile) — defined once here.
  const ctaCard = (
    <div className="overflow-hidden rounded-2xl p-6 text-white [background:linear-gradient(135deg,#0a1a2f_0%,#0e2742_100%)]">
      <h2 className="font-display text-lg leading-snug font-bold">
        {t("ctaTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/75">
        {t("ctaText")}
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button asChild variant="gradient" size="md" className="w-full">
          <Link href="/contact">{t("ctaQuote")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="md"
          className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/rent">{t("ctaBrowse")}</Link>
        </Button>
      </div>
    </div>
  );

  const resourcesCard =
    resources.length > 0 ? (
      <div className="border-border bg-background rounded-2xl border p-6">
        <h2 className="font-display text-base font-semibold">
          {t("furtherReading")}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("furtherReadingDesc")}
        </p>
        <ul className="divide-border mt-3 divide-y">
          {resources.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group hover:text-primary flex items-center justify-between gap-3 py-2.5 transition-colors"
              >
                <span>
                  <span className="block text-sm leading-snug font-semibold">
                    {r.label}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {r.source}
                  </span>
                </span>
                <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

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
        {/* ── Compact hero: cover photo behind the nav + just the title. ── */}
        <header className="border-border relative -mt-[108px] overflow-hidden border-b bg-neutral-900 sm:-mt-[116px]">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizedSrc(post.coverImage, 1600)}
              alt={title}
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/55 to-neutral-950/45"
          />
          <Container className="relative z-10 max-w-[84rem] pt-[122px] pb-12 sm:pt-[146px] sm:pb-14">
            <Link
              href="/blog"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {t("backToBlog")}
            </Link>
            <h1 className="font-display mt-6 max-w-4xl text-[2rem] leading-[1.07] font-bold tracking-tight text-balance text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
          </Container>
        </header>

        {/* ── Body: TOC rail · prose · sticky CTA rail ── */}
        <Section spacing="default">
          <Container className="max-w-[84rem]">
            {/* Byline — refined, sits above the columns. */}
            <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-3 border-b pb-6">
              {post.author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt=""
                  className="ring-border size-10 rounded-full object-cover ring-1"
                />
              ) : null}
              {post.author?.name ? (
                <span className="text-sm">
                  <span className="text-muted-foreground block text-[11px] tracking-wide uppercase">
                    {t("writtenBy")}
                  </span>
                  <span className="font-semibold">{post.author.name}</span>
                </span>
              ) : null}
              <span
                aria-hidden
                className="bg-border hidden h-8 w-px sm:block"
              />
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
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
                    <span aria-hidden className="text-border">
                      •
                    </span>
                    <span>{dateLabel}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-10 lg:grid lg:grid-cols-[210px_minmax(0,1fr)_290px] lg:gap-10 xl:gap-14">
              {/* Left rail: sticky table of contents */}
              {headings.length > 1 ? (
                <aside className="hidden lg:block">
                  <div className="sticky top-28">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t("onThisPage")}
                    </p>
                    <nav className="border-border mt-3 border-l">
                      {headings.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className="text-muted-foreground hover:border-primary hover:text-primary -ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm leading-snug transition-colors"
                        >
                          {h.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              ) : (
                <div className="hidden lg:block" />
              )}

              {/* Center: the article */}
              <div className="min-w-0">
                <ArticleContent content={content} />

                {post.tags.length > 0 ? (
                  <div className="border-border mt-10 flex flex-wrap gap-2 border-t pt-6">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/blog/tag/${tag.slug}`}
                        className="border-border text-muted-foreground hover:border-primary hover:text-primary rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                      >
                        #{getLocalized(tag.name, locale)}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {/* Mobile/tablet: CTA + resources stacked under the article. */}
                <div className="mt-10 space-y-6 lg:hidden">
                  {ctaCard}
                  {resourcesCard}
                </div>
              </div>

              {/* Right rail: sticky CTA + further reading (desktop) */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-6">
                  {ctaCard}
                  {resourcesCard}
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section className="border-border bg-muted/40 border-t">
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
