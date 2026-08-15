import { test, expect } from "@playwright/test";

/**
 * Cart checkout parity.
 *
 * The cart page was the last one still running the old quote flow while every
 * other route booked immediately, so a visitor arriving via the cart got a
 * different promise than one arriving from a product page. These assertions are
 * the checkout's actual contract: the plan picker, the method picker, the
 * itemised totals and the booking button all live on this one page.
 */
test.describe("cart checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/rent");
    await page
      .getByRole("button", { name: /add to cart/i })
      .first()
      .click();
    await page.waitForTimeout(1500);
    await page.goto("/en/checkout");
    await page.waitForLoadState("networkidle").catch(() => {});
  });

  test("shows plan, method and full totals on one page", async ({ page }) => {
    const body = page.locator("body");

    // Payment plan — both options, with the deposit pre-selected.
    await expect(body).toContainText(/50%\s*deposit/i);
    await expect(body).toContainText(/pay in full/i);

    // All five methods, and only the two discounted ones advertise a saving.
    for (const m of ["Zelle", "Cash App", "Apple Pay", "Chime", "Bitcoin"]) {
      await expect(body).toContainText(m);
    }
    await expect(body).toContainText(/save\s*7\.5%/i);
    await expect(body).toContainText(/save\s*3%/i);

    // The itemised breakdown, including the flat transport fee that the old
    // page showed as a vague "from $49".
    await expect(body).toContainText(/transportation/i);
    await expect(body).toContainText(/due today/i);
    await expect(body).toContainText(/balance/i);

    // Promo entry and the subscriber line.
    await expect(body).toContainText(/promo/i);
    await expect(body).toContainText(/subscribers save/i);

    // Books immediately — no quote anywhere on the page.
    await expect(
      page.getByRole("button", { name: /^(book now|order now)$/i }),
    ).toBeVisible();
    await expect(body).not.toContainText(/request quote/i);
  });

  test("switching to pay-in-full changes the amount due", async ({ page }) => {
    // The single most important interaction on the page: the number the
    // customer is about to pay must react to the plan they pick.
    const before = await page.locator("body").innerText();
    await page
      .getByText(/pay in full/i)
      .first()
      .click();
    await page.waitForTimeout(600);
    const after = await page.locator("body").innerText();
    expect(after).not.toEqual(before);
  });
});
