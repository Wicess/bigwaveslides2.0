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

// Commercial SEO/marketing crawlers and content scrapers. None of them can
// send us a customer, none of them rank us, and none of them are answer
// engines — they exist to resell our content as competitor-intelligence data.
// What they DO produce is a stream of hits from datacenters all over the world,
// which is most of the "traffic from random countries" showing up in analytics.
//
// Deliberately NOT in this list: every crawler in AI_BOTS above (they cite us),
// Googlebot/Bingbot/DuckDuckBot/Applebot (they rank us), and the social
// unfurlers (facebookexternalhit, Twitterbot, LinkedInBot, Slackbot,
// WhatsApp) that render our Open Graph cards when a customer shares a link.
const BLOCKED_SCRAPERS = [
  "AhrefsBot",
  "SemrushBot",
  "DotBot", // Moz
  "rogerbot", // Moz
  "MJ12bot", // Majestic
  "BLEXBot",
  "DataForSeoBot",
  "Barkrowler",
  "serpstatbot",
  "SeekportBot",
  "ZoominfoBot",
  "PetalBot", // Huawei/Petal Search — no US search share
  "Bytespider", // ByteDance scraper, ignores most conventions
  "ImagesiftBot",
  "magpie-crawler",
  "Scrapy",
  "CCBot", // Common Crawl: training-only, never cites a source
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
      { userAgent: BLOCKED_SCRAPERS, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
