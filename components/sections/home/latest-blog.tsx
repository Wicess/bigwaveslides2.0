import * as React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
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

/** Two identical wave tiles + the flow animation = a seamless ripple. */
const WAVE_PATH =
  "M0,32 Q120,8 240,32 T480,32 T720,32 T960,32 T1200,32 T1440,32";

function WaveLine({
  color,
  width,
  opacity,
  duration,
  top,
}: {
  color: string;
  width: number;
  opacity: number;
  duration: string;
  top: string;
}) {
  return (
    <div
      className="animate-wave absolute left-0 flex w-[200%]"
      style={{ top, ["--wave-duration" as string]: duration }}
    >
      {[0, 1].map((i) => (
        <svg
          key={i}
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          className="h-12 w-1/2 shrink-0 sm:h-16"
          fill="none"
        >
          <path
            d={WAVE_PATH}
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            opacity={opacity}
          />
        </svg>
      ))}
    </div>
  );
}

function WaveDivider() {
  return (
    <div
      aria-hidden
      className="relative h-12 w-full overflow-hidden sm:h-16"
    >
      {/* back ripple — slow + faint */}
      <WaveLine color="#00d4ff" width={2} opacity={0.35} duration="20s" top="10px" />
      {/* mid ripple */}
      <WaveLine color="#0099ff" width={2.5} opacity={0.6} duration="15s" top="2px" />
      {/* front ripple — bright + quicker */}
      <WaveLine color="#33abff" width={3} opacity={0.9} duration="11s" top="-4px" />
    </div>
  );
}

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
    <section className="relative overflow-hidden bg-muted">
      <WaveDivider />

      <Container className="pb-10 pt-6 sm:pb-14 sm:pt-8 lg:pb-16">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader eyebrow={t("blogEyebrow")} title={t("blogTitle")} />
          <Link
            href="/blog"
            className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            {t("blogCta")}{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <Link
                href={`/blog/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-soft)]"
              >
                {p.coverImage ? (
                  <MediaImage
                    src={p.coverImage}
                    alt={getLocalized(p.title, locale)}
                    rounded={false}
                    className="aspect-[16/10] w-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width:768px) 33vw, 100vw"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                  <h3 className="mt-2.5 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                    {getLocalized(p.title, locale)}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {getLocalized(p.excerpt, locale)}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
