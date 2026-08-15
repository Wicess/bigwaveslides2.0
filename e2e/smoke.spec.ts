import { test, expect } from "@playwright/test";

/**
 * Smoke tests + screenshot capture. Run against a live app (see BASE_URL in
 * playwright.config.ts). Screenshots land in e2e/__screenshots__/ and are great
 * for eyeballing the design across desktop + mobile.
 */
test("home page loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveTitle(/Splash Republic/i);
  await page.screenshot({
    path: `e2e/__screenshots__/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("admin login renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await page.screenshot({
    path: `e2e/__screenshots__/admin-login-${test.info().project.name}.png`,
    fullPage: true,
  });
});
