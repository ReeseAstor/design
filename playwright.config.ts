import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

/**
 * Some CI images ship a pinned Chromium that does not match this Playwright
 * build's expected revision. Point at it explicitly when the path is provided
 * rather than downloading a second copy.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/**
 * The suite runs against a production build with no Sanity, PostHog or Kit
 * credentials — the same seed-content mode a fresh clone boots into. That is
 * deliberate: the acceptance criteria must hold before any account exists.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'mobile-320',
      use: {
        ...devices['Desktop Chrome'],
        // The narrowest viewport the brief requires the page to work at.
        viewport: { width: 320, height: 640 },
        isMobile: false,
        hasTouch: true,
        launchOptions: { executablePath },
      },
    },
    {
      name: 'mobile-390',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        launchOptions: { executablePath },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        launchOptions: { executablePath },
      },
    },
  ],

  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_SANITY_PROJECT_ID: '',
      NEXT_PUBLIC_POSTHOG_KEY: '',
      KIT_API_KEY: '',
    },
  },
});
