import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export const POST_PAGE_SIZE = 9;

export type BlogQuery = {
  category?: string;
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  readingMinutes: true,
  publishedAt: true,
  featured: true,
  author: { select: { name: true, avatar: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.BlogPostSelect;

/** Paginated, filterable list of published posts. */
export async function getPosts(query: BlogQuery = {}) {
  const { category, tag, q, page = 1, pageSize = POST_PAGE_SIZE } = query;

  const where: Prisma.BlogPostWhereInput = {
    status: "PUBLISHED",
    ...(category ? { category: { slug: category } } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
    ...(q && q.trim()
      ? {
          OR: [
            { title: { path: ["en"], string_contains: q.trim() } },
            { title: { path: ["fr"], string_contains: q.trim() } },
            { excerpt: { path: ["en"], string_contains: q.trim() } },
          ],
        }
      : {}),
  };

  const [items, total] = await withRetry(() =>
    Promise.all([
      prisma.blogPost.findMany({
        where,
        select: cardSelect,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]),
  ).catch(() => [[], 0] as const);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type BlogListing = Awaited<ReturnType<typeof getPosts>>;
export type PostCardData = BlogListing["items"][number];

export async function getPostBySlug(slug: string) {
  return withRetry(() =>
    prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        author: true,
        category: { select: { slug: true, name: true } },
        tags: { select: { slug: true, name: true } },
      },
    }),
  ).catch(() => null);
}

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

export async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  limit = 3,
) {
  return withRetry(async () => {
    // Prefer posts from the same category…
    const sameCategory = categoryId
      ? await prisma.blogPost.findMany({
          where: { status: "PUBLISHED", id: { not: postId }, categoryId },
          select: cardSelect,
          orderBy: { publishedAt: "desc" },
          take: limit,
        })
      : [];
    if (sameCategory.length >= limit) return sameCategory;

    // …then top up with the latest posts from anywhere so every article shows
    // a full "keep reading" row (e.g. categories with only one post).
    const exclude = [postId, ...sameCategory.map((p) => p.id)];
    const fillers = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED", id: { notIn: exclude } },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take: limit - sameCategory.length,
    });
    return [...sameCategory, ...fillers];
  }).catch(() => []);
}

export async function getPostSlugs() {
  return withRetry(() =>
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    }),
  ).catch(() => []);
}

/**
 * Lightweight {slug, title} list of every published post, newest first.
 * Cached (tag "blog") so the location pages can each link a rotating handful of
 * guides without adding a per-page DB read — spreading internal-link equity
 * from the ranking location pages across the whole blog.
 */
export const getGuideLinks = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true },
      }),
    ).catch(() => []),
  ["guide-links"],
  { tags: ["blog"], revalidate: 3600 },
);

export const getBlogCategories = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.blogCategory.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
        },
      }),
    ).catch(() => []),
  ["blog-categories"],
  { tags: ["blog"], revalidate: 3600 },
);

export async function getBlogCategoryBySlug(slug: string) {
  return withRetry(() =>
    prisma.blogCategory.findUnique({ where: { slug } }),
  ).catch(() => null);
}

export async function getTagBySlug(slug: string) {
  return withRetry(() => prisma.tag.findUnique({ where: { slug } })).catch(
    () => null,
  );
}

export const getPopularTags = unstable_cache(
  async () =>
    withRetry(() =>
      prisma.tag.findMany({
        select: { id: true, slug: true, name: true },
        take: 20,
      }),
    ).catch(() => []),
  ["blog-tags"],
  { tags: ["blog"], revalidate: 3600 },
);
