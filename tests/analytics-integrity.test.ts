/**
 * Guards the visitor/geo data that the cost work must never degrade.
 *
 * recordEvent was batched from 5-7 sequential database round trips down to 2-3
 * to stop it holding the Neon compute awake on every pageview. Batching is only
 * safe if the SAME data still gets written, so this pins the fields that would
 * silently disappear if someone "optimised" further: the geolocation resolved
 * from the x-vercel-ip-* edge headers, and the rollup counters the admin
 * visitor list reads.
 */
import { describe, it, expect } from "vitest";
import { geoFromHeaders, ipFromHeaders } from "@/lib/analytics/geo";

const edge = (h: Record<string, string>) => new Headers(h);

describe("geolocation survives from edge headers", () => {
  it("expands a US state code into a full region name", () => {
    const geo = geoFromHeaders(
      edge({
        "x-vercel-ip-country": "US",
        "x-vercel-ip-country-region": "GA",
        "x-vercel-ip-city": "Atlanta",
      }),
    );
    expect(geo.country).toBe("United States");
    expect(geo.countryCode).toBe("US");
    expect(geo.region).toBe("Georgia");
    expect(geo.regionCode).toBe("GA");
    expect(geo.city).toBe("Atlanta");
  });

  it("decodes percent-encoded city names", () => {
    const geo = geoFromHeaders(
      edge({ "x-vercel-ip-country": "US", "x-vercel-ip-city": "New%20York" }),
    );
    expect(geo.city).toBe("New York");
  });

  it("returns nulls rather than throwing when headers are absent", () => {
    const geo = geoFromHeaders(edge({}));
    expect(geo.country).toBeNull();
    expect(geo.city).toBeNull();
  });

  it("reads the client IP from the proxy chain", () => {
    expect(
      ipFromHeaders(edge({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })),
    ).toBe("203.0.113.9");
    expect(ipFromHeaders(edge({ "x-real-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
    expect(ipFromHeaders(edge({}))).toBeNull();
  });
});

describe("the tracked write set is still complete", () => {
  it("recordEvent writes every field the admin visitor list depends on", async () => {
    // Static assertion against the source: batching must not have dropped a
    // column. Cheaper and more durable than standing up a database here.
    const src = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/analytics/track.ts", "utf8"),
    );
    for (const field of [
      "country",
      "countryCode",
      "region",
      "regionCode",
      "city",
      "device",
      "browser",
      "os",
      "userAgent",
      "firstReferrer",
      "landingPath",
      "visitCount",
      "pageViewCount",
      "eventCount",
      "pageViews",
      "exitPath",
      "durationMs",
    ]) {
      expect(src, `recordEvent no longer writes ${field}`).toContain(field);
    }
  });
});
