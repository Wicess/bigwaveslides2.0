// Geo + device helpers for analytics. Vercel's edge sets the request headers
// `x-vercel-ip-country`, `x-vercel-ip-country-region` and `x-vercel-ip-city`.
// We expand the ISO codes into full, human-readable names for the admin.

import type { DeviceType } from "@prisma/client";

/** Full US state names keyed by USPS code (+ DC / territories). */
const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
  PR: "Puerto Rico", GU: "Guam", VI: "U.S. Virgin Islands", AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

/** Full Canadian province/territory names keyed by code. */
const CA_PROVINCES: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
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
};

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
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless/.test(s)) {
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
