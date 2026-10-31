import { defineConfig, devices } from "@playwright/test";
import { getDevelopmentSettings } from "./tooling/dev-services.mjs";

const port = 3100;
const services = getDevelopmentSettings();

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Production build, όχι dev server: ελέγχουμε ό,τι θα τρέξει πραγματικά.
  webServer: {
    command: `npm run services:up && npm run auth:migrate && npm run build && npm run start -- -p ${port}`,
    env: {
      DATABASE_URL: services.testDatabaseUrl,
      AUTH_SECRET: services.authSecret,
      AUTH_URL: `http://localhost:${port}`,
      SMTP_URL: services.smtpUrl,
      SMTP_FROM: "Webapp <no-reply@example.test>",
    },
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 360_000,
  },
});
