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
    // Immersive install: hide the OS status bar (battery/clock/network) AND the
    // bottom navigation bar so the site paints edge-to-edge like a native app.
    // display_override is the progressive-enhancement list Android reads first;
    // `display` is the fallback for engines that don't support it.
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    background_color: "#0a1a2f",
    theme_color: "#0a1a2f",
    orientation: "portrait",
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
