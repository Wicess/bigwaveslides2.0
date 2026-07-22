import type { MetadataRoute } from "next";

// Web app manifest — makes the site installable as a PWA. Next serves this at
// /manifest.webmanifest and links it from every page automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Big Wave Slides — Water Slide Rentals",
    short_name: "Big Wave",
    description:
      "Rent premium inflatable water slides & bounce houses — delivered, set up, sanitized & fully insured, nationwide.",
    id: "/",
    start_url: "/",
    // `standalone` = app-like (no browser address bar) but KEEPS the OS status
    // bar and the Android navigation bar (back / home / recents). We used
    // `fullscreen` before, which hid the nav bar entirely — users lost the back
    // button and it only reappeared on an edge-swipe. standalone is the right
    // default for a content/commerce site.
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#0a1a2f",
    theme_color: "#0a1a2f",
    orientation: "portrait",
    // Lets an installed instance be detected from the browser tab via
    // navigator.getInstalledRelatedApps(), so we can hide the install button
    // once the app is installed. Uses the real deployed origin in production.
    prefer_related_applications: false,
    related_applications: [
      {
        platform: "webapp",
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bigwaveslides.com"}/manifest.webmanifest`,
      },
    ],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/pwa/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
