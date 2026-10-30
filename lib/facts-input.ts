import "server-only";
import { env } from "@/lib/env";
import { canonicalSiteUrl } from "@/lib/site";
import { CURATED_POST_SLUGS, type FactsInput } from "@/lib/llms-content";
import { getFactsData, type FactsData } from "@/server/data/catalog-facts";
import { getSettings, type SiteSettings } from "@/server/data/settings";

/**
 * Everything /llms.txt and /pricing.md render from. Both routes are ISR'd for
 * a day and the reads are cached (unstable_cache), so this is no per-request
 * DB work. If the DB is unreachable the files degrade to the static facts
 * (no prices) instead of failing the build or inventing a catalog.
 */
export async function loadFactsInput(): Promise<FactsInput> {
  const [data, settings] = await Promise.all([
    getFactsData(CURATED_POST_SLUGS).catch((): FactsData | null => null),
    getSettings().catch((): SiteSettings => ({})),
  ]);
  return {
    site: canonicalSiteUrl(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    products: data?.products ?? null,
    paymentMethods: data?.paymentMethods ?? [],
    posts: data?.posts ?? [],
    contact: settings.contact,
    hours: settings.hours,
    facebook: settings.social?.facebook || undefined,
    transportEnabled: settings.fees?.transportEnabled !== false,
    asOf: new Date().toISOString().slice(0, 10),
  };
}
