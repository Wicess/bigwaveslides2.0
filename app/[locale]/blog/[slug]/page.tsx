import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Clock,
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Waves,
  BookOpen,
  Sparkles,
} from "lucide-react";
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
import { serviceAreaLinks, hashSeed } from "@/lib/internal-links";
import { getLandingRentals } from "@/server/data/rentals";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
  const tn = await getTranslations("Nav");
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

  // Internal links that tie this post into the rest of the site so equity flows
  // both ways: a deterministic-per-post spread of ranking location pages, plus
  // a few real rentals. Seeded by slug → same set every render (cache-safe).
  const seed = hashSeed(post.slug);
  const areas = serviceAreaLinks(seed, 6, 2);
  const rentals = await getLandingRentals().catch(() => []);
  const featured = rentals.length
    ? Array.from(
        { length: Math.min(4, rentals.length) },
        (_, i) => rentals[(seed + i * 3) % rentals.length]!,
      )
    : [];

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
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: tn("blog"), href: "/blog" },
                { label: title },
              ]}
            />

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

                {/* Mobile/tablet: quote CTA + further reading under the
                    article. The main onward funnel is the full-width "Keep
                    exploring" band below — seen the moment the reader finishes. */}
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

      {/* Keep exploring — the primary onward funnel, full-width so it's the
          first thing a reader (especially on mobile) meets when the article
          ends. Directly targets the high blog bounce. */}
      <Section spacing="compact" className="border-border bg-muted/30 border-t">
        <Container className="max-w-[84rem]">
          <SectionHeader title={t("keepExploring")} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {/* Browse the catalog */}
            <Link
              href="/rent"
              className="group border-border bg-background hover:border-primary flex flex-col rounded-2xl border p-6 transition-colors"
            >
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                <Waves className="size-5" />
              </span>
              <h3 className="font-display mt-4 text-lg font-bold">
                {t("popularRentalsTitle")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {featured.length > 0
                  ? featured
                      .slice(0, 3)
                      .map((p) => getLocalized(p.name, locale))
                      .join(" · ")
                  : t("ctaText")}
              </p>
              <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                {t("ctaBrowse")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Rentals near you */}
            <div className="border-border bg-background flex flex-col rounded-2xl border p-6">
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                <MapPin className="size-5" />
              </span>
              <h3 className="font-display mt-4 text-lg font-bold">
                {t("serviceAreasTitle")}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {areas.slice(0, 6).map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="border-border bg-muted/40 hover:border-primary hover:text-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Read next / free quote */}
            {related[0] ? (
              <Link
                href={`/blog/${related[0].slug}`}
                className="group border-border bg-background hover:border-primary flex flex-col rounded-2xl border p-6 transition-colors"
              >
                <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                  <BookOpen className="size-5" />
                </span>
                <p className="text-muted-foreground mt-4 text-[11px] font-bold tracking-[0.14em] uppercase">
                  {t("readNext")}
                </p>
                <h3 className="font-display mt-1 text-lg leading-snug font-bold">
                  {getLocalized(related[0].title, locale)}
                </h3>
                <span className="text-primary mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold">
                  {t("ctaBrowse")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ) : (
              <Link
                href="/contact"
                className="group flex flex-col justify-between rounded-2xl p-6 text-white [background:var(--gradient-wave)]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-white/15">
                  <Sparkles className="size-5" />
                </span>
                <div className="mt-4">
                  <h3 className="font-display text-lg font-bold">
                    {t("ctaTitle")}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                    {t("ctaQuote")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        </Container>
      </Section>

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
