import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/retry";

export type SiteSettings = {
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    /** Full, human-readable address (used for display). */
    address?: string;
    /** Structured parts (used for PostalAddress schema). */
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    /** Public reviews profile (Google Business / Trustpilot). When set, the
        payment page turns the rating into a clickable "verified reviews" link
        for external, checkable proof. */
    reviewsUrl?: string;
  };
  hours?: { mon_fri?: string; sat?: string; sun?: string };
  fees?: {
    deliveryBaseCents?: number;
    pickupCents?: number;
    freeRadiusMiles?: number;
    perMileCents?: number;
    /** $30 transportation line on quotes/invoices — owner can toggle it off. */
    transportEnabled?: boolean;
  };
};

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await withRetry(() =>
      prisma.siteSetting.findMany({ select: { key: true, value: true } }),
    );
    return Object.fromEntries(
      rows.map((r) => [r.key, r.value]),
    ) as SiteSettings;
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 3600 },
);
