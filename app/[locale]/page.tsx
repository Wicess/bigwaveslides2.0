/**
 * Homepage ("/" for each language).
 *
 * This is a Server Component: it runs on the server, fetches its data once,
 * then renders the finished HTML. Its only job is to assemble the homepage by
 * stacking the section components in visual order (top to bottom):
 *   Hero → TrustBand → FeaturedSlides → RentalCategories → WhyChooseUs →
 *   TestimonialsCarousel → LatestBlog → FinalCta.
 *
 * The folder name "[locale]" makes this a dynamic route segment: the URL's
 * language code (e.g. "en", "es") is captured and passed in via `params`, so
 * the same file serves every supported language.
 */
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getHomeData, type HomeData } from "@/server/data/home";
import { Hero } from "@/components/sections/home/hero";
import { TrustBand } from "@/components/sections/home/trust-band";
import { FeaturedSlides } from "@/components/sections/home/featured-slides";
import { RentalCategories } from "@/components/sections/home/rental-categories";
import { WhyChooseUs } from "@/components/sections/home/why-choose-us";
import { TestimonialsCarousel } from "@/components/sections/home/testimonials-carousel";
import { LatestBlog } from "@/components/sections/home/latest-blog";
import { FinalCta } from "@/components/sections/home/final-cta";

// In the App Router, `params` arrives as a Promise that we `await` below.
type Props = { params: Promise<{ locale: string }> };

// Safe default used when the data fetch fails (see getHomeData().catch below).
// The page still renders with empty lists instead of crashing.
const FALLBACK: HomeData = {
  featured: [],
  categories: [],
  services: [],
  testimonials: [],
  posts: [],
  stats: { reviewCount: 1200, ratingAvg: 4.9 },
};

export default async function HomePage({ params }: Props) {
  // Read the language code from the URL.
  const { locale } = await params;
  // If it is not a language we support, show the 404 page (not-found.tsx).
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Tell next-intl which language to use for this request. Required so that
  // translations work in Server Components and the page can be static.
  setRequestLocale(locale);

  // Fetch all homepage content. If anything goes wrong, fall back to FALLBACK
  // so the page still renders instead of throwing an error.
  const data: HomeData = await getHomeData().catch(() => FALLBACK);

  return (
    // Each child below is a section component. They render in this order and
    // receive only the slice of `data` (and the locale) they need.
    <main>
      <Hero
        rating={data.stats.ratingAvg}
        reviewCount={data.stats.reviewCount}
      />
      <TrustBand />
      <FeaturedSlides products={data.featured} locale={locale} />
      <RentalCategories categories={data.categories} locale={locale} />
      <WhyChooseUs />
      <TestimonialsCarousel testimonials={data.testimonials} locale={locale} />
      <LatestBlog posts={data.posts} locale={locale} />
      <FinalCta />
    </main>
  );
}
