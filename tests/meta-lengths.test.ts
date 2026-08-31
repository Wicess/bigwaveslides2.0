/**
 * Guards the meta that templates generate against silently growing past what
 * search engines render.
 *
 * This regressed three times by hand: a state description gained a season
 * window and went over, a shop title gained "bounce & slide combo", and a
 * use-case page reused visible hero copy as its snippet. Each was only caught
 * by crawling all 345 live URLs after deploying, which is a slow way to learn
 * you truncated your own call to action.
 *
 * Budgets are display limits, not spam thresholds — Google truncates rather
 * than penalises, and Bing flags short descriptions, not long ones. They are
 * deliberately a few characters under the real cut-off.
 */
import { describe, it, expect } from "vitest";
import { rentProductSeo, saleProductSeo } from "@/lib/seo";
import { USE_CASES } from "@/lib/use-cases";
import { STATE_PROFILES, lowerSeason } from "@/lib/state-profiles";

const TITLE_MAX = 62;
const DESC_MAX = 160;

/** The widest realistic product: long name, tall, expensive, big footprint. */
const WORST_PRODUCT = {
  name: "Grand Waterworks Combo",
  facts: {
    price: "$570",
    kind: "bounce & slide combo",
    heightFt: 18,
    age: "5+",
    space: "45 × 25 ft level area",
    summary:
      "Two tall slides, a climb wall, misting arches, a splash pool and a bounce zone — 45 × 25 ft of it.",
  },
};

describe("generated product meta stays within display width", () => {
  it("rental titles and descriptions fit", () => {
    const seo = rentProductSeo(WORST_PRODUCT.name, WORST_PRODUCT.facts);
    expect(seo.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(seo.description.length).toBeLessThanOrEqual(DESC_MAX);
  });

  it("sale titles and descriptions fit", () => {
    const seo = saleProductSeo(WORST_PRODUCT.name, WORST_PRODUCT.facts);
    expect(seo.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(seo.description.length).toBeLessThanOrEqual(DESC_MAX);
  });

  it("rent and sale differ, so /rent and /shop are never duplicates", () => {
    const rent = rentProductSeo(WORST_PRODUCT.name, WORST_PRODUCT.facts);
    const sale = saleProductSeo(WORST_PRODUCT.name, WORST_PRODUCT.facts);
    expect(rent.title).not.toBe(sale.title);
    expect(rent.description).not.toBe(sale.description);
  });

  it("descriptions never end on a dangling connective", () => {
    const dangling =
      /\b(rather|than|and|with|for|the|a|an|to|of|in|on|but|that|which|as|by|from|so)\.$/i;
    for (const name of [
      "Reefline 18",
      "Little Harbor Junior",
      "Thunderhead 28",
    ]) {
      const seo = rentProductSeo(name, WORST_PRODUCT.facts);
      expect(seo.description).not.toMatch(dangling);
    }
  });
});

describe("hand-written content fits its meta budget", () => {
  it("every use-case page has a snippet within budget", () => {
    for (const uc of USE_CASES) {
      const desc = uc.metaDescription ?? uc.heroDescription;
      expect(
        desc.length,
        `${uc.slug} description is ${desc.length} chars`,
      ).toBeLessThanOrEqual(DESC_MAX);
      expect(uc.heroTitle.length, uc.slug).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it("every state description fits once the season is inlined", () => {
    for (const [slug, profile] of Object.entries(STATE_PROFILES)) {
      const name = slug.replace(/-/g, " ");
      // Mirrors the state page template, with a generous two-city stand-in.
      const desc = `Water slide rentals across ${name} from $155/day. Season runs ${lowerSeason(profile.season)} — delivered, set up and insured in Springfield and Junction City.`;
      expect(
        desc.length,
        `${slug} is ${desc.length} chars`,
      ).toBeLessThanOrEqual(DESC_MAX + 12);
    }
  });
});
