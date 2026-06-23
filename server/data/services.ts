import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export const getAllServices = unstable_cache(
  async () => withRetry(() => prisma.service.findMany({ orderBy: { order: "asc" } })),
  ["all-services"],
  { tags: ["services"], revalidate: 3600 },
);

export async function getServiceBySlug(slug: string) {
  const cached = unstable_cache(
    () => withRetry(() => prisma.service.findUnique({ where: { slug } })),
    ["service", slug],
    { tags: ["services", `service:${slug}`], revalidate: 3600 },
  );
  return cached();
}

export async function getServiceSlugs() {
  return withRetry(() =>
    prisma.service.findMany({ select: { slug: true } }),
  ).catch(() => []);
}
