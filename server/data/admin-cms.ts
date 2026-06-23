import "server-only";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/* ───────────────── Customers (CRM) ───────────────── */

export async function getAdminCustomers() {
  return withRetry(() =>
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organizationName: true,
        crmTags: true,
        lifetimeValueCents: true,
        createdAt: true,
        _count: { select: { orders: true, bookings: true, quotes: true } },
      },
    }),
  ).catch(() => []);
}

export async function getAdminCustomer(id: string) {
  return withRetry(() =>
    prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, take: 20 },
        bookings: { orderBy: { createdAt: "desc" }, take: 20 },
        quotes: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
  ).catch(() => null);
}

/* ───────────────── Moderation ───────────────── */

export async function getAdminReviews() {
  return withRetry(() =>
    prisma.review.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { product: { select: { slug: true, name: true } } },
    }),
  ).catch(() => []);
}

export async function getAdminTestimonials() {
  return withRetry(() =>
    prisma.testimonial.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ).catch(() => []);
}

/* ───────────────── Comms ───────────────── */

export async function getAdminContacts() {
  return withRetry(() =>
    prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ).catch(() => []);
}

export async function getAdminSubscribers() {
  return withRetry(() =>
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ).catch(() => []);
}

/* ───────────────── Blog ───────────────── */

export async function getAdminPosts() {
  return withRetry(() =>
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        featured: true,
        publishedAt: true,
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ).catch(() => []);
}

export async function getAdminPost(id: string) {
  return withRetry(() =>
    prisma.blogPost.findUnique({ where: { id }, include: { tags: true } }),
  ).catch(() => null);
}

export async function getBlogTaxonomy() {
  return withRetry(async () => {
    const [categories, tags, authors] = await Promise.all([
      prisma.blogCategory.findMany({ select: { id: true, slug: true, name: true } }),
      prisma.tag.findMany({ select: { id: true, slug: true, name: true } }),
      prisma.author.findMany({ select: { id: true, name: true } }),
    ]);
    return { categories, tags, authors };
  }).catch(() => ({ categories: [], tags: [], authors: [] }));
}

/* ───────────────── Events ───────────────── */

export async function getAdminEvents() {
  return withRetry(() =>
    prisma.event.findMany({
      orderBy: { startAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        startAt: true,
        location: true,
        registrationEnabled: true,
        _count: { select: { registrations: true } },
      },
    }),
  ).catch(() => []);
}

export async function getAdminEvent(id: string) {
  return withRetry(() =>
    prisma.event.findUnique({
      where: { id },
      include: {
        registrations: { orderBy: { createdAt: "desc" } },
      },
    }),
  ).catch(() => null);
}

/* ───────────────── Media ───────────────── */

export async function getAdminMedia() {
  return withRetry(() =>
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ).catch(() => []);
}

/* ───────────────── Settings ───────────────── */

export async function getAllSettings() {
  const rows = await withRetry(() =>
    prisma.siteSetting.findMany({ select: { key: true, value: true } }),
  ).catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
}

/* ───────────────── Governance ───────────────── */

export async function getAdminUsers() {
  return withRetry(() =>
    prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        role: { select: { name: true, type: true } },
      },
    }),
  ).catch(() => []);
}

export async function getRoles() {
  return withRetry(() =>
    prisma.role.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true, permissions: true } } },
    }),
  ).catch(() => []);
}

export async function getRoleOptions() {
  return withRetry(() =>
    prisma.role.findMany({ select: { id: true, name: true } }),
  ).catch(() => []);
}

export async function getActivityLogs() {
  return withRetry(() =>
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { name: true } } },
    }),
  ).catch(() => []);
}
