import { defineConfig, devices } from "@playwright/test";
import type { TestOptions } from "./e2e/fixtures";
import { BASE_URL, E2E_DATABASE_FILE, E2E_DATABASE_URL, PORT } from "./e2e/env";

export default defineConfig<TestOptions>({
  testDir: "./e2e",
  // All tests share one SQLite database and reset it before each test, so
  // they run one at a time.
  fullyParallel: false,
  workers: 1,
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
    // A fresh database with the current schema, then a production build.
    command: [
      `node -e "require('fs').rmSync('${E2E_DATABASE_FILE}', { force: true })"`,
      "npx prisma db push",
      "npm run build",
      `npm run start -- --port ${PORT}`,
    ].join(" && "),
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: "e2e-only-secret-not-for-production",
      // No real Gemini calls from tests: the rule-based summary is returned
      // instead, and an empty key makes any missed call fail instead of
      // spending quota.
      AI_INSIGHTS_MODE: "mock",
      GEMINI_API_KEY: "",
    },
    // The login page renders without a session, so it signals readiness.
    url: `${BASE_URL}/hu/login`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
