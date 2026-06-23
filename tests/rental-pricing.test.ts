import { describe, it, expect } from "vitest";
import {
  rentalDays,
  eachDate,
  parseISODate,
  toISODate,
  computeQuote,
} from "@/lib/rental-pricing";

describe("rentalDays", () => {
  it("counts a single day as 1 (inclusive)", () => {
    expect(rentalDays("2026-07-01", "2026-07-01")).toBe(1);
  });
  it("counts a range inclusively", () => {
    expect(rentalDays("2026-07-01", "2026-07-03")).toBe(3);
  });
  it("returns 0 for a reversed range", () => {
    expect(rentalDays("2026-07-05", "2026-07-01")).toBe(0);
  });
  it("returns 0 for invalid input", () => {
    expect(rentalDays("nope", "2026-07-01")).toBe(0);
  });
});

describe("eachDate", () => {
  it("lists every day inclusive", () => {
    expect(eachDate("2026-07-01", "2026-07-03")).toEqual([
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
    ]);
  });
  it("returns [] for reversed ranges", () => {
    expect(eachDate("2026-07-03", "2026-07-01")).toEqual([]);
  });
});

describe("parseISODate / toISODate", () => {
  it("round-trips a valid date", () => {
    const d = parseISODate("2026-07-04");
    expect(d).not.toBeNull();
    expect(toISODate(d!)).toBe("2026-07-04");
  });
  it("rejects malformed strings", () => {
    expect(parseISODate("2026/07/04")).toBeNull();
    expect(parseISODate("")).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });
});

describe("computeQuote", () => {
  it("computes rental + delivery, keeps deposit separate", () => {
    const q = computeQuote({
      dailyRateCents: 10000,
      depositCents: 5000,
      deliveryBaseCents: 4900,
      pickupCents: 2900,
      days: 3,
    });
    expect(q.rentalCents).toBe(30000);
    expect(q.deliveryCents).toBe(7800);
    expect(q.depositCents).toBe(5000);
    // total excludes the refundable deposit
    expect(q.totalCents).toBe(37800);
  });
  it("handles missing optional fees", () => {
    const q = computeQuote({ dailyRateCents: 10000, days: 2 });
    expect(q.rentalCents).toBe(20000);
    expect(q.deliveryCents).toBe(0);
    expect(q.totalCents).toBe(20000);
  });
  it("never produces negative days", () => {
    const q = computeQuote({ dailyRateCents: 10000, days: -5 });
    expect(q.days).toBe(0);
    expect(q.rentalCents).toBe(0);
  });
});
