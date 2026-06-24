import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getHomeData, type HomeData } from "@/server/data/home";
import { Hero } from "@/components/sections/home/hero";
import { TrustBand } from "@/components/sections/home/trust-band";
import { FeaturedSlides } from "@/components/sections/home/featured-slides";
import { RentalCategories } from "@/components/sections/home/rental-categories";
import { ServicesOverview } from "@/components/sections/home/services-overview";
import { HowItWorks } from "@/components/sections/home/how-it-works";
import { WhyChooseUs } from "@/components/sections/home/why-choose-us";
import { TestimonialsCarousel } from "@/components/sections/home/testimonials-carousel";
import { LatestBlog } from "@/components/sections/home/latest-blog";
import { FinalCta } from "@/components/sections/home/final-cta";

type Props = { params: Promise<{ locale: string }> };

const FALLBACK: HomeData = {
  featured: [],
  categories: [],
  services: [],
  testimonials: [],
  posts: [],
  stats: { reviewCount: 1200, ratingAvg: 4.9 },
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const data: HomeData = await getHomeData().catch(() => FALLBACK);

  return (
    <main>
      <Hero
        rating={data.stats.ratingAvg}
        reviewCount={data.stats.reviewCount}
      />
      <TrustBand />
      <FeaturedSlides products={data.featured} locale={locale} />
      <RentalCategories categories={data.categories} locale={locale} />
      <ServicesOverview services={data.services} locale={locale} />
      <HowItWorks />
      <WhyChooseUs />
      <TestimonialsCarousel testimonials={data.testimonials} locale={locale} />
      <LatestBlog posts={data.posts} locale={locale} />
      <FinalCta />
    </main>
  );
}
