import { test, expect } from '@playwright/test';
/* global localStorage */

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    const products = [{ id: 'test-product', slug: 'test-headphones', title: 'Test headphones',
      name: 'Test headphones', status: 'published', price_usd: 25, stock: 10 }];
    return route.fulfill({ json: path.endsWith('/entities/Product') ? products
      : path.includes('/entities/') ? [] : {} });
  });
});

test('profile recovers invalid saved data and saves usable fields', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  // DOMContentLoaded precedes the lazy route import. Let it finish before
  // reloading, otherwise WebKit reports the cancelled module as a page error.
  await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('afritrade:profile', 'null'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible();
  const inputs = page.locator('main form input:not([type="hidden"])');
  await inputs.nth(0).fill('Test buyer');
  await inputs.nth(1).fill('+243812345678');
  await page.locator('main [role="combobox"]').click();
  await page.getByRole('option', { name: 'Goma', exact: true }).click();
  await expect(page.locator('[data-webview-select-backdrop]')).toBeHidden();
  await page.locator('main button[type="submit"]').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(inputs.nth(0)).toHaveValue('Test buyer');
  await expect(inputs.nth(1)).toHaveValue('+243812345678');
  await expect(page.locator('main [role="combobox"]')).toHaveText('Goma');
  expect(errors).toEqual([]);
});

test('Explore the marketplace opens the catalogue and profile remains reachable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Explore the marketplace', exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.locator('main').getByText('Test headphones', { exact: true }).first()).toBeVisible();
  await page.locator('.bottom-nav-item[href="/profile"]').evaluate(link => link.click());
  await expect(page.getByRole('heading', { name: 'My profile', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});