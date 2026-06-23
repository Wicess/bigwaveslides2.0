import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export const getApprovedTestimonials = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.testimonial.findMany({
        where: { status: "APPROVED" },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          authorName: true,
          authorRole: true,
          organization: true,
          rating: true,
          quote: true,
          avatar: true,
          videoUrl: true,
          featured: true,
        },
      }),
    ).catch(() => []),
  ["testimonials-approved"],
  { tags: ["testimonials"], revalidate: 1800 },
);

export type TestimonialCardData = Awaited<
  ReturnType<typeof getApprovedTestimonials>
>[number];
