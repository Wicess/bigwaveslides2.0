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
    display: "standalone",
    background_color: "#ffffff",
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
