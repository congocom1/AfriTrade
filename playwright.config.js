import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5174';
const parsedURL = new URL(baseURL);
const isLocal = ['localhost', '127.0.0.1'].includes(parsedURL.hostname);

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  // BASE_URL selects the target; it must not disable server startup for localhost.
  // Playwright starts Vite for local smoke tests, but never starts a server for hosted staging.
  webServer: isLocal ? {
    // API-mocked navigation tests need only the frontend, not a live backend.
    command: process.env.E2E_MOCK_API === '1'
      ? `npm run dev -- --host 127.0.0.1 --port ${parsedURL.port || '5174'} --strictPort`
      : `npx base44 dev --port ${parsedURL.port || '5174'}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-regression',
      use: { 
        ...devices['Desktop Chrome'],
        // Visual regression specific settings
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: 'tablet-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
