import { buildLlmsTxt } from "@/lib/llms-content";
import { loadFactsInput } from "@/lib/facts-input";

// Rebuilt at most once a day from the live catalog + settings (cached reads,
// no per-request DB work). Replaces the hand-written public/llms.txt, which
// had drifted from the business. See lib/business-facts.ts.
export const revalidate = 86400;

export async function GET() {
  const body = buildLlmsTxt(await loadFactsInput());
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
