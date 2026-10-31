import { describe, expect, it } from "vitest";
import {
  rentalCostFaq,
  summarizeCatalog,
  type CatalogProduct,
} from "@/lib/business-facts";
import { buildLlmsTxt, buildPricingMd } from "@/lib/llms-content";
import { saleFaqs } from "@/lib/product-faq";
import { allQA } from "@/lib/qa";

const p = (
  slug: string,
  category: string,
  daily: number | null,
  sale: number | null,
): CatalogProduct => ({
  slug,
  name: slug.toUpperCase(),
  category,
  dailyRateCents: daily,
  salePriceCents: sale,
  capacity: 6,
  ageRange: "5+",
  power: "One 20A / 110V outlet",
  space: "33 × 18 ft level area",
});

const products = [
  p("a", "bounce-houses", 16500, 229000),
  p("b", "tall-slides", 50000, 821500),
  p("c", "party-attractions", 41500, null),
];

const input = {
  site: "https://www.splashrep.com",
  products,
  paymentMethods: [
    { method: "zelle", label: "Zelle" },
    { method: "crypto", label: "Bitcoin" },
  ],
  posts: [],
  contact: { email: "sales@splashrep.com", phone: "+1 (614) 302-5899" },
  transportEnabled: true,
  asOf: "2026-10-30",
};

describe("business facts", () => {
  it("derives ranges from the catalog, not from hand-typed numbers", () => {
    const s = summarizeCatalog(products);
    expect(s.daily).toEqual({ min: 16500, max: 50000, count: 3 });
    expect(s.sale).toEqual({ min: 229000, max: 821500, count: 2 });
    expect(s.forSale).toBe(2);
  });

  it("llms.txt and pricing.md carry the live numbers and no rating", () => {
    for (const body of [buildLlmsTxt(input), buildPricingMd(input)]) {
      expect(body).toContain("$165");
      expect(body).toContain("$8,215");
      expect(body).toContain("$30 transportation fee");
      expect(body).toContain("Bitcoin 7.5%");
      expect(body).not.toMatch(/\d(\.\d)?\s*(stars?|★)|reviews? \(\d/i);
      expect(body).not.toMatch(/nothing (is )?charged online/i);
    }
  });

  it("degrades to facts without prices when the catalog is unavailable", () => {
    const body = buildLlmsTxt({ ...input, products: null });
    expect(body).not.toContain("$165");
    expect(body).toContain("sales@splashrep.com");
  });

  it("drops the transport fee when the owner switches it off", () => {
    const body = buildPricingMd({ ...input, transportEnabled: false });
    expect(body).not.toContain("$30 transportation fee");
  });

  it("use-case cost answer names the event and the real range", () => {
    const f = rentalCostFaq("church picnic", summarizeCatalog(products), {
      transportCents: 3000,
    });
    expect(f?.q).toContain("church picnic");
    expect(f?.a).toContain("$165 to $500");
  });

  it("sale FAQs only state what the product row supports", () => {
    const faqs = saleFaqs({ name: "Surge 20", price: "$4,370" });
    const text = JSON.stringify(faqs);
    expect(text).not.toMatch(/PVC|welded|pays for itself/i);
    expect(text).toContain("$4,370");
  });

  it("/answers no longer quotes the retired per-mile delivery fees", () => {
    const text = JSON.stringify(allQA());
    expect(text).not.toMatch(/\$49|\$2\.50 per mile|\$29 pickup/);
  });

  it("/answers cost answers quote the live catalog range", () => {
    const text = JSON.stringify(allQA({ rentFrom: "$155", rentTo: "$570" }));
    expect(text).toContain("$155 to $570");
    expect(text).toContain("Should I rent a water slide or a bounce house?");
  });
});
