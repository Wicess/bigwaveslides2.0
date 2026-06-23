import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/** All content for the homepage, fetched in parallel and cached. */
export const getHomeData = unstable_cache(
  async () => {
    const [featured, categories, services, events, testimonials, posts, stats] =
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
          prisma.event.findMany({
            where: { status: "UPCOMING" },
            orderBy: { startAt: "asc" },
            take: 3,
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
      events,
      testimonials,
      posts,
      stats: {
        reviewCount: stats._sum.ratingCount ?? 0,
        ratingAvg: stats._avg.ratingAvg ?? 4.9,
      },
    };
  },
  ["home-data"],
  {
    tags: ["products", "categories", "services", "events", "testimonials", "blog"],
    revalidate: 600,
  },
);

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
