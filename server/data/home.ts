import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/** All content for the homepage, fetched in parallel and cached. */
export const getHomeData = unstable_cache(
  async () => {
    const [featured, categories, services, testimonials, posts, stats] =
      await withRetry(() =>
        Promise.all([
          prisma.product.findMany({
            where: { featured: true, status: "ACTIVE" },
            include: {
              media: { where: { isPrimary: true }, take: 1 },
              category: { select: { slug: true, name: true } },
            },
            take: 6,
          }),
          prisma.productCategory.findMany({
            orderBy: { order: "asc" },
            take: 6,
          }),
          prisma.service.findMany({
            where: { featured: true },
            orderBy: { order: "asc" },
            take: 6,
          }),
          prisma.testimonial.findMany({
            where: { status: "APPROVED" },
            orderBy: [{ featured: "desc" }, { order: "asc" }],
            take: 8,
          }),
          prisma.blogPost.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            include: {
              author: { select: { name: true } },
              category: { select: { slug: true, name: true } },
            },
            take: 3,
          }),
          prisma.product.aggregate({
            where: { status: "ACTIVE" },
            _sum: { ratingCount: true },
            _avg: { ratingAvg: true },
          }),
        ]),
      );

    return {
      featured,
      categories,
      services,
      testimonials,
      posts,
      stats: {
        reviewCount: stats._sum.ratingCount ?? 0,
        // 0, not 4.9 — an empty aggregate means "no reviews yet", and defaulting
        // it to a flattering score invents one. The hero hides the whole rating
        // block when reviewCount is 0.
        ratingAvg: stats._avg.ratingAvg ?? 0,
      },
    };
  },
  ["home-data"],
  {
    tags: ["products", "categories", "services", "testimonials", "blog"],
    revalidate: 600,
  },
);

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

/** Site-wide review aggregate for the LocalBusiness schema (star ratings in
    search). Cached 1h; returns count 0 on error so no rating is ever faked. */
export const getRatingSummary = unstable_cache(
  async () => {
    const s = await withRetry(() =>
      prisma.product.aggregate({
        where: { status: "ACTIVE", ratingCount: { gt: 0 } },
        _sum: { ratingCount: true },
        _avg: { ratingAvg: true },
      }),
    ).catch(() => null);
    return { count: s?._sum.ratingCount ?? 0, value: s?._avg.ratingAvg ?? 0 };
  },
  ["rating-summary"],
  { tags: ["products", "reviews"], revalidate: 3600 },
);
