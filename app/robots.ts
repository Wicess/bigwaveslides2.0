import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Non-content areas kept out of every crawler.
const DISALLOW = ["/admin", "/account", "/api/", "/cart", "/checkout"];

// AI search + answer engines we explicitly welcome so they can read and CITE
// us (blocking these means the platform literally cannot mention us). Listed
// individually — a positive, explicit signal that also survives any future
// tightening of the wildcard rule.
const AI_BOTS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT browsing on a user's behalf
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live fetch
  "ClaudeBot", // Anthropic
  "anthropic-ai",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended", // Gemini + AI Overviews
  "Applebot-Extended", // Apple Intelligence
  "Bingbot", // Microsoft Copilot (via Bing)
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
