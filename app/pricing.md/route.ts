import { buildPricingMd } from "@/lib/llms-content";
import { loadFactsInput } from "@/lib/facts-input";

// Machine-readable price list, rebuilt at most once a day from the live
// catalog (cached reads, no per-request DB work). See lib/business-facts.ts.
export const revalidate = 86400;

export async function GET() {
  const body = buildPricingMd(await loadFactsInput());
  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
