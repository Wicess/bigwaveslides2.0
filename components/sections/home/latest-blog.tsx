import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media-image";
import { Badge } from "@/components/ui/badge";

type Post = {
  slug: string;
  title: unknown;
  excerpt: unknown;
  coverImage: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { slug: string; name: unknown } | null;
};

export async function LatestBlog({
  posts,
  locale,
}: {
  posts: Post[];
  locale: string;
}) {
  const t = await getTranslations("Home");
  if (posts.length === 0) return null;

  return (
    <Section className="py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader eyebrow={t("blogEyebrow")} title={t("blogTitle")} />
          <Link
            href="/blog"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            {t("blogCta")} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <Link href={`/blog/${p.slug}`} className="group block">
                {p.coverImage ? (
                  <MediaImage
                    src={p.coverImage}
                    alt={getLocalized(p.title, locale)}
                    className="aspect-[16/10] w-full"
                    imgClassName="group-hover:scale-105"
                    sizes="(min-width:768px) 33vw, 100vw"
                  />
                ) : null}
                <div className="mt-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.category ? (
                      <Badge variant="primary">
                        {getLocalized(p.category.name, locale)}
                      </Badge>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {p.readingMinutes} min
                    </span>
                    {p.publishedAt ? (
                      <span>{formatDate(p.publishedAt, locale)}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                    {getLocalized(p.title, locale)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {getLocalized(p.excerpt, locale)}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
