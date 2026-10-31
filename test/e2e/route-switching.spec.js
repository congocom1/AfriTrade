import { test, expect } from '@playwright/test';

// Deterministic, read-only route tests: never send requests to business APIs.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    return route.fulfill({ json: path.includes('/entities/') ? [] : {} });
  });
});

test('a route mounts once while the previous page exits', async ({ page }) => {
  let categoryLoads = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/entities/Category')) categoryLoads++;
  });
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  // DOM click also exercises the bottom nav on desktop, where it is hidden.
  await page.locator('.bottom-nav-item[href="/categories"]').evaluate(link => link.click());
  await expect(page.locator('main h1')).toHaveText('All departments');
  await expect(page.locator('main > div').first()).toHaveCSS('opacity', '1');
  expect(categoryLoads).toBe(1);
});

test('rapid tab switches, history and window focus retain the final page', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  for (const path of ['/categories', '/cart', '/categories', '/cart', '/categories']) {
    await page.locator(`.bottom-nav-item[href="${path}"]`).evaluate(link => link.click());
  }
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.locator('main h1')).toHaveText('All departments');
  await page.goBack();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  await page.goForward();
  await expect(page.locator('main h1')).toHaveText('All departments');
  const other = await context.newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  await page.bringToFront();
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main > div').first()).toHaveCSS('opacity', '1');
  await other.close();
  expect(errors).toEqual([]);
});