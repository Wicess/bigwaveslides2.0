// Geo + device helpers for analytics. Vercel's edge sets the request headers
// `x-vercel-ip-country`, `x-vercel-ip-country-region` and `x-vercel-ip-city`.
// We expand the ISO codes into full, human-readable names for the admin.

import type { DeviceType } from "@prisma/client";

/** Full US state names keyed by USPS code (+ DC / territories). */
const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

/** Full Canadian province/territory names keyed by code. */
const CA_PROVINCES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

/** ISO-3166-1 alpha-2 country code → English country name. */
export function countryName(code?: string | null): string | null {
  if (!code) return null;
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Region/state code → full name (US + CA mapped; others returned as-is). */
export function regionName(
  regionCode?: string | null,
  countryCode?: string | null,
): string | null {
  if (!regionCode) return null;
  const cc = (countryCode ?? "").toUpperCase();
  const rc = regionCode.toUpperCase();
  if (cc === "US" && US_STATES[rc]) return US_STATES[rc];
  if (cc === "CA" && CA_PROVINCES[rc]) return CA_PROVINCES[rc];
  return regionCode;
}

export type GeoInfo = {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  /**
   * IP belongs to a hosting/cloud provider rather than a consumer ISP. Crawlers
   * and preview bots increasingly ship a stock Chrome user-agent, so the UA is
   * no longer enough to spot them — but they still run from AWS/GCP/Azure
   * ranges, which is what this flags. Undefined when unknown.
   */
  datacenter?: boolean;
};

/** Cloud/hosting ASNs & orgs — matched against the provider's org/ASN string. */
const HOSTING_ORG =
  /\b(amazon|aws|google|gcp|microsoft|azure|digitalocean|linode|akamai|fastly|cloudflare|ovh|hetzner|vultr|scaleway|oracle|alibaba|tencent|leaseweb|contabo|rackspace|equinix|choopa|quadranet|hostinger|godaddy|namecheap|datacamp|m247|zscaler)\b/i;

/** Pull and expand geo from a request's edge headers. */
export function geoFromHeaders(headers: Headers): GeoInfo {
  const countryCode = headers.get("x-vercel-ip-country");
  const regionCode = headers.get("x-vercel-ip-country-region");
  const cityRaw = headers.get("x-vercel-ip-city");
  const city = cityRaw ? safeDecode(cityRaw) : null;
  return {
    country: countryName(countryCode),
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    region: regionName(regionCode, countryCode),
    regionCode: regionCode ? regionCode.toUpperCase() : null,
    city,
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** True when geo is missing or the region is still an unexpanded code. */
export function needsGeoEnrichment(geo: GeoInfo): boolean {
  if (!geo.country) return true;
  if (geo.regionCode && (!geo.region || geo.region === geo.regionCode))
    return true;
  return false;
}

function isPublicIp(ip: string | null | undefined): ip is string {
  if (!ip) return false;
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("10."))
    return false;
  if (ip.startsWith("192.168.") || ip.startsWith("172.")) return false;
  return true;
}

// Small per-instance cache so we don't re-query the same IP repeatedly.
const ipCache = new Map<string, GeoInfo>();

/**
 * Resolve full, human-readable geo (full country + region/state name + city)
 * from an IP via ipapi.co. Best-effort: returns null on any failure/timeout so
 * tracking and checkout never break. Edge headers only spell out US/CA states,
 * so this expands region names worldwide (e.g. Cameroon).
 */
export async function geoFromIp(
  ip: string | null | undefined,
): Promise<GeoInfo | null> {
  if (!isPublicIp(ip)) return null;
  const cached = ipCache.get(ip);
  if (cached) return cached;
  // Try ipapi.co (https) first, then ip-api.com as a fallback. Both return
  // fully-expanded region/state names worldwide.
  const info = (await fromIpapiCo(ip)) ?? (await fromIpApiCom(ip));
  if (info) ipCache.set(ip, info);
  return info;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fromIpapiCo(ip: string): Promise<GeoInfo | null> {
  const d = await fetchJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!d || d.error) return null;
  const country = (d.country_name as string) ?? null;
  if (!country) return null;
  // ipapi.co has no explicit hosting flag; the org/ASN string is the next-best
  // signal (e.g. "AS15169 Google LLC" for a Council Bluffs crawler).
  const org = `${(d.org as string) ?? ""} ${(d.asn as string) ?? ""}`.trim();
  return {
    country,
    countryCode: ((d.country_code as string) ?? "").toUpperCase() || null,
    region: (d.region as string) ?? null,
    regionCode: ((d.region_code as string) ?? "").toUpperCase() || null,
    city: (d.city as string) ?? null,
    ...(org ? { datacenter: HOSTING_ORG.test(org) } : {}),
  };
}

async function fromIpApiCom(ip: string): Promise<GeoInfo | null> {
  // `hosting` is ip-api's datacenter/colo flag and `proxy` covers VPN/proxy
  // exits — both free-tier fields, so this costs nothing extra.
  const d = await fetchJson(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,region,city,hosting,proxy,org,as`,
  );
  if (!d || d.status !== "success") return null;
  const country = (d.country as string) ?? null;
  if (!country) return null;
  return {
    country,
    countryCode: ((d.countryCode as string) ?? "").toUpperCase() || null,
    region: (d.regionName as string) ?? null, // full name, e.g. "Littoral"
    regionCode: ((d.region as string) ?? "").toUpperCase() || null,
    city: (d.city as string) ?? null,
    datacenter:
      d.hosting === true ||
      d.proxy === true ||
      HOSTING_ORG.test(`${(d.org as string) ?? ""} ${(d.as as string) ?? ""}`),
  };
}

/** Read the client IP from a request's edge/proxy headers. */
export function ipFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}

export type UaInfo = {
  device: DeviceType;
  browser: string | null;
  os: string | null;
};

/** Lightweight user-agent parsing — enough for an analytics breakdown. */
export function parseUserAgent(ua?: string | null): UaInfo {
  if (!ua) return { device: "UNKNOWN", browser: null, os: null };
  const s = ua.toLowerCase();

  let device: DeviceType = "DESKTOP";
  if (
    /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|monitoring|curl|wget|python-requests|httpx|axios|node-fetch|go-http-client|java\/|okhttp|libwww|scrapy|preview|fetcher|validator|whatsapp|telegrambot|discordbot|slackbot|embedly|quora link|vercelbot|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baidu|sogou|duckduck/.test(
      s,
    )
  ) {
    device = "BOT";
  } else if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) {
    device = "TABLET";
  } else if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(s)) {
    device = "MOBILE";
  }

  let browser: string | null = null;
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/chrome\//.test(s) && !/chromium/.test(s)) browser = "Chrome";
  else if (/firefox\//.test(s)) browser = "Firefox";
  else if (/safari\//.test(s) && /version\//.test(s)) browser = "Safari";

  let os: string | null = null;
  if (/windows nt/.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod/.test(s)) os = "iOS";
  else if (/mac os x/.test(s)) os = "macOS";
  else if (/android/.test(s)) os = "Android";
  else if (/linux/.test(s)) os = "Linux";

  return { device, browser, os };
}
