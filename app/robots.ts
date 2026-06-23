import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api/", "/cart", "/checkout"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
