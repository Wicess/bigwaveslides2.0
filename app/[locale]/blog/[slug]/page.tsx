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
      <h2 className="font-display text-lg font-bold leading-snug">{t("ctaTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{t("ctaText")}</p>
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
      <div className="rounded-2xl border border-border bg-background p-6">
        <h2 className="font-display text-base font-semibold">{t("furtherReading")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("furtherReadingDesc")}</p>
        <ul className="mt-3 divide-y divide-border">
          {resources.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-primary"
              >
                <span>
                  <span className="block text-sm font-semibold leading-snug">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.source}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/55 to-neutral-950/45"
          />
          <Container className="relative z-10 max-w-[84rem] pb-12 pt-[122px] sm:pb-14 sm:pt-[146px]">
            <Link
              href="/blog"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              {t("backToBlog")}
            </Link>
            <h1 className="mt-6 max-w-4xl text-balance font-display text-[2rem] font-bold leading-[1.07] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
          </Container>
        </header>

        {/* ── Body: TOC rail · prose · sticky CTA rail ── */}
        <Section spacing="default">
          <Container className="max-w-[84rem]">
            {/* Byline — refined, sits above the columns. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border pb-6">
              {post.author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt=""
                  className="size-10 rounded-full object-cover ring-1 ring-border"
                />
              ) : null}
              {post.author?.name ? (
                <span className="text-sm">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t("writtenBy")}
                  </span>
                  <span className="font-semibold">{post.author.name}</span>
                </span>
              ) : null}
              <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("onThisPage")}
                    </p>
                    <nav className="mt-3 border-l border-border">
                      {headings.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm leading-snug text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
