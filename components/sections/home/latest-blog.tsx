/**
 * LatestBlog
 * ----------
 * The "from our blog" section near the bottom of the homepage. It renders a
 * decorative animated wave at the top, a heading, and a grid of the three most
 * recent blog post cards. Each card links through to the full article.
 *
 * `posts` and `locale` are passed in by the homepage. If there are no posts,
 * the whole section renders nothing.
 */
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

// Base URL of the R2 storage folder holding our blog cover images.
const R2 = "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev/blog";
/**
 * Hand-picked water-slide cover images (stored in R2), one per card position.
 * BLOG_IMAGES[0] is used for the first card, [1] for the second, and so on.
 * Using a fixed list keeps the section looking polished regardless of which
 * posts come back from the database.
 */
const BLOG_IMAGES = [
  `${R2}/backyard.jpg`,
  `${R2}/choose.jpg`,
  `${R2}/aqua.webp`,
];

/**
 * The shape of a single wavy line, written in SVG path syntax. "Q" and "T" are
 * SVG curve commands; together they draw a smooth up-and-down ripple that is
 * 1440 units wide. We draw this same path twice side by side (see WaveLine) and
 * slide the pair leftward — when the first copy scrolls fully out of view the
 * identical second copy is already in its place, so the motion looks like one
 * endless, seamless wave with no visible jump.
 */
const WAVE_PATH =
  "M0,32 Q120,8 240,32 T480,32 T720,32 T960,32 T1200,32 T1440,32";

// One animated horizontal wave line. We stack several of these (with different
// colors/speeds) to build the full divider, which creates a layered, parallax
// feel where each line drifts at its own pace.
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
    // The track is 200% wide because it holds two copies of the wave laid out
    // in a row. "animate-wave" is the CSS animation that slides it left, and
    // the --wave-duration CSS variable lets each line set its own speed.
    <div
      className="animate-wave absolute left-0 flex w-[200%]"
      style={{ top, ["--wave-duration" as string]: duration }}
    >
      {/* Render the wave SVG twice (the two tiles) so the loop is seamless. */}
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

// The full decorative divider: three wave lines stacked on top of each other.
// They use slightly different shades of blue and DIFFERENT durations (20s, 15s,
// 11s) so the lines drift at different speeds. That mismatch is what makes the
// water look alive and three-dimensional instead of one flat moving line.
// `aria-hidden` hides it from screen readers since it is purely decorative.
function WaveDivider() {
  return (
    <div aria-hidden className="relative h-12 w-full overflow-hidden sm:h-16">
      {/* Back line: faintest, slowest. */}
      <WaveLine
        color="#00d4ff"
        width={2}
        opacity={0.35}
        duration="20s"
        top="10px"
      />
      {/* Middle line. */}
      <WaveLine
        color="#0099ff"
        width={2.5}
        opacity={0.6}
        duration="15s"
        top="2px"
      />
      {/* Front line: boldest, fastest. */}
      <WaveLine
        color="#33abff"
        width={3}
        opacity={0.9}
        duration="11s"
        top="-4px"
      />
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
    <section className="bg-muted relative overflow-hidden">
      <WaveDivider />

      <Container className="pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pb-20">
        {/* Centered header */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t("blogTitle")}
            </h2>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:gap-8">
          {posts.map((p, i) => {
            // Pick the cover image: prefer our curated image for this slot,
            // otherwise fall back to the post's own image, otherwise nothing.
            const cover = BLOG_IMAGES[i] ?? p.coverImage ?? undefined;
            return (
              // <Reveal> fades each card in as you scroll. The growing `delay`
              // (0s, 0.1s, 0.2s...) makes the cards appear one after another.
              <Reveal key={p.slug} delay={i * 0.1}>
                {/*
                  The whole card is a link. "group" lets child elements animate
                  when the card is hovered: here the card lifts up
                  (hover:-translate-y-2) and gains a softer shadow, while inside
                  the image zooms and the title turns blue (see group-hover
                  classes below).
                */}
                <Link
                  href={`/blog/${p.slug}`}
                  className="group ring-border/60 flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.05)] ring-1 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative overflow-hidden">
                    {/* Cover image. On card hover it slowly zooms to 110%. */}
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
                    {/* Category badge, shown only if the post has a category. */}
                    {p.category ? (
                      <span className="text-primary-700 absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur">
                        {getLocalized(p.category.name, locale)}
                      </span>
                    ) : null}
                    {/* Subtle dark gradient along the bottom of the image so
                        any text sitting near it stays readable. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    {/* Meta row: estimated reading time and (if set) publish date. */}
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Clock className="size-3.5" />
                      {p.readingMinutes} min
                      {p.publishedAt ? (
                        <>
                          <span className="text-muted-foreground/50">·</span>
                          {formatDate(p.publishedAt, locale)}
                        </>
                      ) : null}
                    </div>
                    <h3 className="group-hover:text-primary mt-3 text-lg leading-snug font-bold tracking-tight transition-colors">
                      {getLocalized(p.title, locale)}
                    </h3>
                    <p className="text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm leading-relaxed">
                      {getLocalized(p.excerpt, locale)}
                    </p>
                    {/* "Read more" call-to-action. On hover the arrow nudges
                        right to hint that the card is clickable. */}
                    <span className="text-primary-700 mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
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
