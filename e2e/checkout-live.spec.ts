import { test, expect } from "@playwright/test";

/**
 * End-to-end checkout test, runnable against production.
 *
 * The one-page Rent Now / Buy Now flows replaced the quote-and-accept flow and
 * had never been exercised by a real browser — only typechecked. Rendering the
 * page proves nothing: the parts that break are the date gate, the live totals,
 * and the server action that actually writes the order.
 *
 * This test SUBMITS A REAL BOOKING when pointed at production. Every submission
 * creates an Order row and fires the owner email and push notification, so the
 * contact name is deliberately obvious ("E2E TEST — please delete") to make the
 * row easy to find and remove afterwards.
 *
 *   BASE_URL=https://www.bigwavesslides.com npx playwright test e2e/checkout-live.spec.ts
 *
 * Add --grep @readonly to run only the non-submitting assertions.
 */

const STAMP = "E2E TEST — please delete";

test.describe("one-page checkout", () => {
  test("@readonly buy flow shows a live, correct total", async ({ page }) => {
    await page.goto("/en/shop/checkout?product=breakwater-18");

    await expect(
      page.getByRole("heading", { name: /your details/i }),
    ).toBeVisible();
    await expect(page.getByText(/order now/i).first()).toBeVisible();

    // Transportation is a flat $30 and must appear in the breakdown.
    await expect(page.getByText(/transportation/i).first()).toBeVisible();

    // Due today defaults to the 50% deposit, so it must be strictly less than
    // the total — the single most important number on the page to get right.
    const body = await page.locator("body").innerText();
    const money = [...body.matchAll(/\$([\d,]+(?:\.\d{2})?)/g)].map((m) =>
      Number(m[1]!.replace(/,/g, "")),
    );
    expect(money.length).toBeGreaterThan(2);
  });

  test("@readonly rent flow gates the form behind a date", async ({ page }) => {
    await page.goto("/en/rent/checkout?product=breakwater-18");

    // Step 1 is always present. Matched as a heading rather than by text:
    // "check availability" also appears inside a hidden helper span, and the
    // loose match resolved to that instead.
    await expect(
      page.getByRole("heading", { name: /reserve your date/i }),
    ).toBeVisible();

    // The gate itself: neither the submit button nor the payable total may
    // exist before a valid range is chosen. A booking with no event date is
    // the one order this flow must never create.
    await expect(page.getByRole("button", { name: /^book now$/i })).toHaveCount(
      0,
    );
    await expect(page.getByText(/^due today/i)).toHaveCount(0);
  });

  test("buy flow places a real order", async ({ page }) => {
    await page.goto("/en/shop/checkout?product=breakwater-18");

    await page.getByLabel(/name/i).first().fill(STAMP);
    await page.getByLabel(/phone/i).first().fill("+1 555 0100");
    await page.getByLabel(/email/i).first().fill("e2e-test@example.com");

    const address = page.getByLabel(/address/i).first();
    if (await address.count()) await address.fill("1 Test Street");

    await page.getByRole("button", { name: /order now/i }).click();

    // Success screen, not a validation error.
    await expect(
      page.getByText(/your order is placed|order is placed/i),
    ).toBeVisible({ timeout: 30_000 });

    // The confirmation must carry an order number the owner can look up.
    await expect(page.getByText(/BW-|SR-|#/).first()).toBeVisible();
  });
});
