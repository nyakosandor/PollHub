import { defineConfig, devices } from "@playwright/test";
import type { TestOptions } from "./e2e/fixtures";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig<TestOptions>({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  // The whole suite runs once per locale: under /hu/... with a Hungarian
  // browser and under /en/... with an English one.
  projects: [
    {
      name: "chromium-hu",
      use: { ...devices["Desktop Chrome"], appLocale: "hu", locale: "hu-HU" },
    },
    {
      name: "chromium-en",
      use: { ...devices["Desktop Chrome"], appLocale: "en", locale: "en-US" },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    // The root path only redirects, so wait for a real page.
    url: `${BASE_URL}/hu`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
