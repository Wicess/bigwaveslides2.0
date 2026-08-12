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
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
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

// Conversion-first homepage metadata. Leads with the highest-intent keyword
// ("Water Slide Rentals Near You"), stacks the buying signals (delivery, setup,
// insurance, free quote), and adds a clear CTA — for a brand-new brand this
// wins clicks far better than putting the unknown brand name first.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fr = locale === "fr";
  return buildMetadata({
    locale,
    path: "/",
    title: fr
      ? "Location de glissades d'eau dès 199 $/jour — livrées & assurées"
      : "Water Slide Rentals Near You, USA — From $199/Day",
    description: fr
      ? "Louez ou achetez des glissades d'eau gonflables partout aux États-Unis dès 199 $/jour — livraison, installation et assurance comprises. Devis gratuit en quelques minutes — les week-ends d'été partent vite !"
      : "Rent or buy inflatable water slides anywhere in the USA from $199/day — delivery, setup & insurance included. Free quote in minutes; summer books fast.",
    og: {
      eyebrow: "Nationwide USA",
      subtitle: "Delivered, set up, sanitized & fully insured — free quote",
      badge: "All 50 states",
      price: "From $199/day",
    },
    keywords: fr
      ? [
          "location glissade d'eau",
          "location glissade d'eau près de moi",
          "location glissade d'eau gonflable",
          "glissade d'eau gonflable à vendre",
          "location de fête",
        ]
      : [
          "water slide rentals",
          "water slide rental near me",
          "inflatable water slide rentals",
          "commercial water slides for sale",
          "buy water slides",
          "party water slide rentals",
          "backyard water slide rentals",
          "birthday party water slide rentals",
        ],
  });
}

// Safe default used when the data fetch fails (see getHomeData().catch below).
// The page still renders with empty lists instead of crashing.
const FALLBACK: HomeData = {
  featured: [],
  categories: [],
  services: [],
  testimonials: [],
  posts: [],
  // Zero, not a flattering guess. This fallback renders whenever the DB read
  // fails, and a hardcoded "1,200 reviews · 4.9" would then be shown to every
  // visitor as real social proof for reviews that don't exist. The hero omits
  // the rating block entirely at 0.
  stats: { reviewCount: 0, ratingAvg: 0 },
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
