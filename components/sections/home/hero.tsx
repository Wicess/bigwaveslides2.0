/*
 * Hero
 * The big, full-screen banner at the very top of the homepage (landing page).
 * It shows a rotating background (video + photos) with the brand logo, a short
 * pitch, the main call-to-action buttons, and a star rating. This is the first
 * thing visitors see.
 *
 * Note: this is a Server Component (no "use client"), so it can fetch
 * translations on the server. The moving background lives in <HeroCarousel>,
 * which is a separate client component.
 */
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/motion/reveal";
import { HeroCarousel, type HeroSlide } from "@/components/sections/home/hero-carousel";

// Images/videos are hosted on Cloudflare R2 (object storage) instead of the
// app's /public folder. This keeps the app bundle small and serves big media
// fast from a CDN. R2 is the base folder URL; we build full URLs from it.
const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/hero";
const WORDMARK = `${R2}/wordmark.png`;

// The background slides shown behind the hero text: one looping video first,
// then two high-res photos. Passed into <HeroCarousel> below.
const SLIDES: HeroSlide[] = [
  { type: "video", src: `${R2}/hero.mp4`, poster: `${R2}/aquatube.jpg` },
  {
    type: "image",
    src: `${R2}/aquatube.jpg`,
    alt: "AquaTube pool slider and AquaPlay tower water-play structure",
  },
  {
    type: "image",
    src: `${R2}/aquaforms.jpg`,
    alt: "AquaForms island waterpark splash play structure",
  },
];

export async function Hero({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  // Look up the translated text for the "Home" namespace (multi-language site).
  const t = await getTranslations("Home");

  return (
    // The negative top margin (-mt) pulls the hero up under the transparent
    // navbar so the background reaches the very top of the screen. min-h-svh
    // makes it fill the visible screen height. overflow-hidden clips the
    // zooming carousel images. The sm: value is the wider phone/desktop variant.
    <section className="relative -mt-[6.75rem] flex min-h-svh w-full items-center justify-center overflow-hidden bg-ink sm:-mt-[7.25rem]">
      <HeroCarousel slides={SLIDES} />

      {/* z-10 lifts this text/buttons above the background carousel (z-index).
          pt-[...] pushes content down clear of the navbar we tucked under. */}
      <Container className="relative z-10 flex flex-col items-center pt-[6.75rem] text-center sm:pt-[7.25rem]">
        {/* Designed brand wordmark (transparent PNG) */}
        {/* <Reveal> is a small wrapper that fades/slides the content in as it
            appears. y={18} starts it 18px lower and animates it up. */}
        <Reveal y={18}>
          {/* The logo is an image, so we add a screen-reader-only real heading
              for accessibility and SEO (sr-only hides it visually). */}
          <h1 className="sr-only">Big Wave Slides</h1>
          {/* Plain <img> (not next/image) because it's a transparent logo from
              R2; the eslint-disable just silences the next/image suggestion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WORDMARK}
            alt="Big Wave Slides"
            width={1949}
            height={741}
            // The logo is the most important visual, so tell the browser to
            // download it first (high priority) and not block rendering (async).
            fetchPriority="high"
            decoding="async"
            // Width scales with the viewport (86vw) but never exceeds 720px.
            className="h-auto w-[min(86vw,720px)]"
            // Two drop-shadows: a dark one for depth and a cyan glow so the
            // logo stays readable and on-brand over any background slide.
            style={{
              filter:
                "drop-shadow(0 8px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 48px rgba(127,233,255,0.35))",
            }}
          />
        </Reveal>

        {/* Subtitle. delay staggers each block so they appear one after another. */}
        <Reveal y={16} delay={0.15}>
          <p
            className="mx-auto mt-7 max-w-xl text-lg font-medium leading-relaxed text-white sm:text-xl"
            // textShadow keeps white text legible over busy/light photos.
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {t("subtitle")}{" "}
            <span className="font-semibold text-white">
              {t("rentNowAt")}{" "}
              <span className="font-extrabold text-secondary-400">$199</span>.
            </span>
          </p>
        </Reveal>

        {/* The two main call-to-action buttons: rent (primary) and buy. */}
        <Reveal y={16} delay={0.25}>
          {/* flex-wrap lets the buttons stack onto a second line on narrow phones. */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {/* asChild makes the Button render the inner <Link>, so it's a real
                navigation link styled as a button. */}
            <Button asChild variant="gradient" size="lg">
              <Link href="/rent">
                {t("ctaRentNow")} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20"
            >
              <Link href="/shop">
                <ShoppingBag className="size-4" /> {t("ctaBuyNow")}
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* Social proof: star rating + review count, for trust. */}
        <Reveal y={16} delay={0.35}>
          <div
            className="mt-8 flex items-center justify-center gap-3"
            // Drop-shadow keeps the stars/text readable over the photo.
            style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.55))" }}
          >
            <Stars rating={rating} />
            <span className="text-sm text-white/90">
              <span className="font-semibold text-white">{rating.toFixed(1)}</span> ·{" "}
              {t("trustReviews", { count: reviewCount })}
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
