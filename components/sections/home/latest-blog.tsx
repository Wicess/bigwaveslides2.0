import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLocalized } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media-image";

type Post = {
  slug: string;
  title: unknown;
  excerpt: unknown;
  coverImage: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { slug: string; name: unknown } | null;
};

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/blog";
/** Curated water-slide covers (served from R2), keyed by position. */
const BLOG_IMAGES = [`${R2}/backyard.jpg`, `${R2}/choose.jpg`, `${R2}/aqua.webp`];

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
    <div aria-hidden className="relative h-12 w-full overflow-hidden sm:h-16">
      <WaveLine color="#00d4ff" width={2} opacity={0.35} duration="20s" top="10px" />
      <WaveLine color="#0099ff" width={2.5} opacity={0.6} duration="15s" top="2px" />
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

      <Container className="pb-12 pt-6 sm:pb-16 sm:pt-8 lg:pb-20">
        {/* Centered header */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              {t("blogEyebrow")}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {t("blogTitle")}
            </h2>
            <Link
              href="/blog"
              className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {t("blogCta")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:gap-8">
          {posts.map((p, i) => {
            const cover = BLOG_IMAGES[i] ?? p.coverImage ?? undefined;
            return (
              <Reveal key={p.slug} delay={i * 0.1}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-border/60 shadow-[0_2px_12px_rgba(16,24,40,0.05)] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative overflow-hidden">
                    {cover ? (
                      <MediaImage
                        src={cover}
                        alt={getLocalized(p.title, locale)}
                        rounded={false}
                        className="aspect-[16/10] w-full"
                        imgClassName="transition-transform duration-[1100ms] ease-out group-hover:scale-110"
                        sizes="(min-width:768px) 33vw, 100vw"
                      />
                    ) : null}
                    {p.category ? (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
                        {getLocalized(p.category.name, locale)}
                      </span>
                    ) : null}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {p.readingMinutes} min
                      {p.publishedAt ? (
                        <>
                          <span className="text-muted-foreground/50">·</span>
                          {formatDate(p.publishedAt, locale)}
                        </>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                      {getLocalized(p.title, locale)}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {getLocalized(p.excerpt, locale)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("readMore")}
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
