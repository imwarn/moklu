/**
 * [INPUT]: depends on @playwright/test and MOKLU_DEPLOY_URL (default https://moklu.app)
 * [OUTPUT]: Playwright configuration for live production reliability, acceptance, and CSP suites
 * [POS]: live test runner configuration in tests/live
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: /(?:production|reliability|acceptance|csp)\.spec\.mjs$/,
  // Production may lag behind a just-merged PR; CSP is configured separately
  // in Coolify/Cloudflare. Require an explicit gate for either release stage.
  testIgnore: [
    ...(process.env.MOKLU_LIVE_ACCEPTANCE === '1' ? [] : ['**/acceptance.spec.mjs']),
    ...(process.env.MOKLU_REQUIRE_CSP === '1' ? [] : ['**/csp.spec.mjs']),
  ],
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.MOKLU_DEPLOY_URL || 'https://moklu.app',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-tablet', use: { ...devices['iPad (gen 7)'] } },
  ],
})
