import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

/** Navigation + footer data, cached and revalidated when admin edits content. */
export const getNavData = unstable_cache(
  async () => {
    const [categories, rentals, services, settingRows] = await withRetry(() =>
      Promise.all([
        prisma.productCategory.findMany({
          orderBy: { order: "asc" },
          select: { slug: true, name: true },
        }),
        prisma.product.findMany({
          where: { type: { in: ["RENTAL", "BOTH"] }, status: "ACTIVE" },
          orderBy: [{ featured: "desc" }, { ratingCount: "desc" }],
          take: 5,
          select: { slug: true, name: true },
        }),
        prisma.service.findMany({
          orderBy: { order: "asc" },
          select: { slug: true, title: true, category: true },
        }),
        prisma.siteSetting.findMany({
          where: { key: { in: ["contact", "social"] } },
          select: { key: true, value: true },
        }),
      ]),
    );

    const settings = Object.fromEntries(
      settingRows.map((s) => [s.key, s.value]),
    ) as {
      contact?: {
        email?: string;
        phone?: string;
        whatsapp?: string;
        address?: string;
      };
      social?: { instagram?: string; facebook?: string; tiktok?: string };
    };

    return { categories, rentals, services, settings };
  },
  ["nav-data"],
  {
    tags: ["categories", "products", "services", "settings"],
    revalidate: 3600,
  },
);

export type NavData = Awaited<ReturnType<typeof getNavData>>;
