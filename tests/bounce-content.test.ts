import { describe, it, expect } from "vitest";
import { getBounceContent, bounceKeywords } from "@/lib/bounce-houses";
import { getAllCities, US_STATES } from "@/lib/locations";

describe("getBounceContent", () => {
  /**
   * Regression: `hashStr` returns an UNSIGNED 32-bit value, so a hash at or
   * above 2^31 goes negative under the signed `>>` operator. The rotation
   * helper then indexed the copy pools with a negative number, got `undefined`,
   * and threw "f(...) is not a function" when it tried to call it — which
   * failed the production build on roughly half of all 751 cities
   * (maryland/dundalk and nebraska/hastings were the two that surfaced).
   *
   * Exercising every real city is the only test that would have caught it:
   * texas/houston happens to land on -0, which indexes as 0 and works.
   */
  it("renders complete content for every city, state and hub key", () => {
    const keys: [
      string,
      string,
      string,
      (typeof US_STATES)[number]["region"],
    ][] = [
      ...getAllCities().map(
        (c) =>
          [
            `${c.state.slug}/${c.slug}`,
            c.name,
            c.state.name,
            c.state.region,
          ] as [string, string, string, (typeof US_STATES)[number]["region"]],
      ),
      ...US_STATES.map(
        (s) =>
          [s.slug, s.name, s.region, s.region] as [
            string,
            string,
            string,
            (typeof US_STATES)[number]["region"],
          ],
      ),
      ["usa-hub", "the U.S.", "the U.S.", "South"],
    ];

    expect(keys.length).toBeGreaterThan(750);

    for (const [slug, place, wider, region] of keys) {
      const c = getBounceContent(slug, place, wider, region);
      expect(c.hero, slug).toMatch(/^https:\/\/.+\.(jpe?g|webp|png)$/i);
      expect(c.heroDescription, slug).toContain(place);
      expect(c.intro, slug).toContain(place);
      expect(c.seasonal, slug).toBeTruthy();
      expect(c.faqs, slug).toHaveLength(8);
      for (const f of c.faqs) {
        expect(f.q, slug).toBeTruthy();
        expect(f.a, slug).toBeTruthy();
      }
    }
  });

  it("is deterministic — the same key always renders the same copy", () => {
    const a = getBounceContent("texas/houston", "Houston", "Texas", "South");
    const b = getBounceContent("texas/houston", "Houston", "Texas", "South");
    expect(a).toEqual(b);
  });

  it("varies copy across keys rather than emitting one template", () => {
    const intros = new Set(
      getAllCities()
        .slice(0, 200)
        .map(
          (c) =>
            getBounceContent(
              `${c.state.slug}/${c.slug}`,
              c.name,
              c.state.name,
              c.state.region,
            ).intro,
        ),
    );
    // 200 cities, 4 intro templates × distinct city names → far more than 1.
    expect(intros.size).toBeGreaterThan(100);
  });
});

describe("bounceKeywords", () => {
  it("includes the place in every place-specific keyword", () => {
    const kws = bounceKeywords("Houston", "TX");
    expect(kws).toContain("bounce house rentals Houston TX");
    expect(kws).toContain("bounce house rentals near me");
    expect(kws.length).toBeGreaterThan(8);
  });
});
