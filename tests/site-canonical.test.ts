import { describe, it, expect } from "vitest";
import {
  CANONICAL_HOST,
  CANONICAL_ORIGIN,
  isAliasHost,
  canonicalSiteUrl,
} from "@/lib/site";
import { USE_CASES, getUseCaseBySlug } from "@/lib/use-cases";

describe("isAliasHost", () => {
  it("flags the one-'s' duplicate domain and its www form", () => {
    expect(isAliasHost("bigwaveslides.com")).toBe(true);
    expect(isAliasHost("www.bigwaveslides.com")).toBe(true);
  });

  it("flags the apex so it folds into www", () => {
    expect(isAliasHost("bigwavesslides.com")).toBe(true);
  });

  it("does not flag the canonical host", () => {
    expect(isAliasHost(CANONICAL_HOST)).toBe(false);
  });

  it("leaves local and preview hosts alone", () => {
    // Redirecting these would break `npm run dev` and every Vercel preview.
    expect(isAliasHost("localhost:3000")).toBe(false);
    expect(isAliasHost("big-wave-slides-abc123.vercel.app")).toBe(false);
  });

  it("ignores case and port", () => {
    expect(isAliasHost("BigWaveSlides.com:443")).toBe(true);
  });

  it("handles missing headers", () => {
    expect(isAliasHost(null)).toBe(false);
    expect(isAliasHost(undefined)).toBe(false);
    expect(isAliasHost("")).toBe(false);
  });
});

describe("canonicalSiteUrl", () => {
  it("folds every production alias onto one origin", () => {
    for (const raw of [
      "https://bigwavesslides.com",
      "https://www.bigwavesslides.com/",
      "https://bigwaveslides.com",
      "https://www.bigwaveslides.com/en",
    ]) {
      expect(canonicalSiteUrl(raw)).toBe(CANONICAL_ORIGIN);
    }
  });

  it("passes localhost through, minus any path", () => {
    expect(canonicalSiteUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("strips a trailing slash from an unparseable value", () => {
    expect(canonicalSiteUrl("not-a-url//")).toBe("not-a-url");
  });
});

describe("use cases", () => {
  it("has unique slugs", () => {
    const slugs = USE_CASES.map((u) => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves the fall cluster by slug", () => {
    for (const slug of [
      "fall-festivals",
      "trunk-or-treat",
      "school-carnivals",
      "halloween-parties",
      "harvest-festivals",
      "corporate-fall-family-day",
    ]) {
      expect(getUseCaseBySlug(slug), slug).toBeDefined();
    }
  });

  it("gives every seasonal page a booking deadline and planning notes", () => {
    const seasonal = USE_CASES.filter((u) => u.season);
    expect(seasonal.length).toBeGreaterThan(0);
    for (const u of seasonal) {
      expect(u.season!.deadline.length, u.slug).toBeGreaterThan(0);
      expect(u.season!.planning.length, u.slug).toBeGreaterThan(2);
      expect(u.season!.catalogHeading.length, u.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every page's FAQ set distinct — shared answers would make these doorway pages", () => {
    const seen = new Map<string, string>();
    for (const u of USE_CASES) {
      for (const f of u.faqs) {
        const prior = seen.get(f.a);
        expect(
          prior,
          `"${f.q}" duplicated between ${prior} and ${u.slug}`,
        ).toBe(undefined);
        seen.set(f.a, u.slug);
      }
    }
  });
});
