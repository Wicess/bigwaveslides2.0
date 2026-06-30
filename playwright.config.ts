import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — end-to-end tests and screenshots.
 * Tests live in ./e2e (kept separate from the Vitest unit tests in ./tests).
 * Point BASE_URL at a running app (default the local prod server on 3210).
 *
 *   npm run dev            # or: npm run build && PORT=3210 npm start
 *   npx playwright test    # run e2e
 *   npx playwright test --ui   # interactive
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3210",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
});
