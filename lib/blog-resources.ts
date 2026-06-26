// lib/blog-resources.ts
// Curated, authoritative external links shown in the "Further reading" block on
// blog articles. Linking out to trusted, independent sources (safety bodies,
// public-health orgs) builds credibility and helps SEO. Keyed by blog category
// slug, with a sensible default for anything unmapped.

export type ExternalResource = { label: string; href: string; source: string };

const DEFAULT_RESOURCES: ExternalResource[] = [
  {
    label: "Water safety basics",
    href: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/water-safety.html",
    source: "American Red Cross",
  },
  {
    label: "Drowning prevention",
    href: "https://www.cdc.gov/drowning/",
    source: "CDC",
  },
  {
    label: "Inflatable amusement safety",
    href: "https://www.cpsc.gov/",
    source: "U.S. CPSC",
  },
];

const RESOURCES_BY_CATEGORY: Record<string, ExternalResource[]> = {
  safety: [
    {
      label: "Inflatable amusement safety",
      href: "https://www.cpsc.gov/",
      source: "U.S. CPSC",
    },
    {
      label: "Amusement ride & device standards (F24)",
      href: "https://www.astm.org/",
      source: "ASTM International",
    },
    {
      label: "Water safety basics",
      href: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/water-safety.html",
      source: "American Red Cross",
    },
  ],
  planning: [
    {
      label: "Lightning & severe-weather safety",
      href: "https://www.weather.gov/safety/lightning",
      source: "U.S. National Weather Service",
    },
    {
      label: "Drowning prevention",
      href: "https://www.cdc.gov/drowning/",
      source: "CDC",
    },
    {
      label: "Sun & heat safety",
      href: "https://www.cdc.gov/heat-health/",
      source: "CDC",
    },
  ],
};

export function getExternalResources(categorySlug?: string): ExternalResource[] {
  if (categorySlug && RESOURCES_BY_CATEGORY[categorySlug]) {
    return RESOURCES_BY_CATEGORY[categorySlug];
  }
  return DEFAULT_RESOURCES;
}
