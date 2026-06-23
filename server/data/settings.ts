import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export type SiteSettings = {
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
  };
  social?: { instagram?: string; facebook?: string; tiktok?: string };
  hours?: { mon_fri?: string; sat?: string; sun?: string };
  fees?: {
    deliveryBaseCents?: number;
    pickupCents?: number;
    freeRadiusMiles?: number;
    perMileCents?: number;
  };
};

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await withRetry(() =>
      prisma.siteSetting.findMany({ select: { key: true, value: true } }),
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as SiteSettings;
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 3600 },
);
