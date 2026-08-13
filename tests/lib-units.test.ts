import { describe, it, expect } from "vitest";
import { getLocalized, localized } from "@/lib/localized";
import { statusLabel, statusTone } from "@/lib/status-labels";
import {
  orderNumber,
  quoteNumber,
  bookingNumber,
  contractNumber,
} from "@/lib/ref-number";
import { faqLd, productLd, breadcrumbLd } from "@/lib/structured-data";

describe("getLocalized", () => {
  it("resolves a legacy bilingual row to English", () => {
    // Rows written while the site was bilingual still carry an `fr` key. The
    // site is English-only now, so they must always render the English half.
    expect(getLocalized({ en: "Hello", fr: "Bonjour" }, "en")).toBe("Hello");
  });
  it("falls back to English, then first value", () => {
    expect(getLocalized({ en: "Hello" }, "fr")).toBe("Hello");
    expect(getLocalized({ es: "Hola" }, "en")).toBe("Hola");
  });
  it("passes through plain strings and uses fallback for null", () => {
    expect(getLocalized("plain", "en")).toBe("plain");
    expect(getLocalized(null, "en", "x")).toBe("x");
  });
  it("localized() builds an English value", () => {
    expect(localized("a")).toEqual({ en: "a" });
  });
});

describe("statusLabel / statusTone", () => {
  it("localizes known statuses", () => {
    expect(statusLabel("PAID_IN_FULL")).toBe("Paid in full");
  });
  it("returns the token for unknown statuses", () => {
    expect(statusLabel("WAT")).toBe("WAT");
  });
  it("maps tones", () => {
    expect(statusTone("PAID_IN_FULL")).toBe("success");
    expect(statusTone("CANCELLED")).toBe("danger");
    expect(statusTone("ZZZ")).toBe("neutral");
  });
});

describe("reference numbers", () => {
  it("match their prefixes and shape", () => {
    expect(orderNumber()).toMatch(/^BW-\d{6}-[A-Z0-9]{5}$/);
    expect(quoteNumber()).toMatch(/^Q-\d{6}-[A-Z0-9]{5}$/);
    expect(bookingNumber()).toMatch(/^BK-\d{6}-[A-Z0-9]{5}$/);
    expect(contractNumber()).toMatch(/^CT-\d{6}-[A-Z0-9]{7}$/);
  });
  it("are reasonably unique", () => {
    const set = new Set(Array.from({ length: 200 }, () => orderNumber()));
    expect(set.size).toBeGreaterThan(190);
  });
});

describe("structured data", () => {
  it("builds FAQ schema", () => {
    const ld = faqLd([{ q: "Q?", a: "A." }]) as Record<string, unknown>;
    expect(ld["@type"]).toBe("FAQPage");
    expect((ld.mainEntity as unknown[]).length).toBe(1);
  });
  it("builds Product schema with offers + rating", () => {
    const ld = productLd({
      name: "Slide",
      url: "https://x/y",
      priceCents: 12999,
      ratingAvg: 4.6,
      ratingCount: 12,
    }) as Record<string, unknown>;
    expect(ld["@type"]).toBe("Product");
    expect((ld.offers as Record<string, unknown>).price).toBe("129.99");
    expect((ld.aggregateRating as Record<string, unknown>).reviewCount).toBe(
      12,
    );
  });
  it("numbers breadcrumb positions from 1", () => {
    const ld = breadcrumbLd([
      { name: "Shop", url: "u1" },
      { name: "Item", url: "u2" },
    ]) as Record<string, unknown>;
    const items = ld.itemListElement as Record<string, unknown>[];
    expect(items[0]?.position).toBe(1);
    expect(items[1]?.position).toBe(2);
  });
});
