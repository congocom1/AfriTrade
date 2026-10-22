import { test, expect } from '@playwright/test';

// These tests are READ ONLY. Never use credentials, place orders or mutate
// production records. They should run against a separate staging deployment.
const baseURL = (process.env.BASE_URL || 'http://localhost:5174').replace(/\/$/, '');
const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);
// Allow Base44-hosted staging URL (afritrade-1.base44.app) for smoke tests
// Production would be a custom domain like afritrade.com
const isProduction = /^https:\/\/afritrade\.com$/i.test(baseURL);

if (!isLocal && (!/^https:\/\//.test(baseURL) || isProduction)) {
  throw new Error('Staging smoke requires an HTTPS staging URL (never the AfriTrade production domain).');
}

async function visit(page, path) {
  // Check the actual document response: a Base44 503 page often contains a
  // visible body and title, so body-only assertions can give false passes.
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response, `${path} returned no document response`).not.toBeNull();
  expect(response.status(), `${path} returned HTTP ${response.status()}`).toBe(200);
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  await expect(page).toHaveTitle(/AfriTrade/i);
  await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  return response;
}

test.describe('AfriTrade staging — public read-only smoke', () => {
  test('serves the real storefront, not the provider error page', async ({ page }) => {
    await visit(page, '/');
    await expect(page.locator('header a[href="/"]').first()).toBeVisible();
    await expect(page.locator('.brand-home')).toBeVisible();
  });

  test('renders the discovery feed or its legitimate empty/retry state', async ({ page }) => {
    await visit(page, '/discover');
    await expect(page.locator('main .animate-pulse')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('main')).toContainText(/./);
  });

  test('renders the cart with a real empty-state or cart content', async ({ page }) => {
    await visit(page, '/cart');
    await expect(page.locator('main')).toContainText(/./);
    await expect(page.locator('main .animate-pulse')).toHaveCount(0, { timeout: 15000 });
  });

  test('renders the legal notice', async ({ page }) => {
    await visit(page, '/mentions-legales');
    await expect(page.locator('main h1').first()).toBeVisible();
  });

  test('renders the about page', async ({ page }) => {
    await visit(page, '/about');
    await expect(page.locator('main h1').first()).toBeVisible();
  });
});
