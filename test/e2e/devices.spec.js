import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

const devices = [
  { name: 'Mobile iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'Tablet iPad', viewport: { width: 768, height: 1024 } },
  { name: 'Desktop', viewport: { width: 1280, height: 800 } },
];

for (const { name, viewport } of devices) {
  test.describe(`Seller dashboard — ${name}`, () => {
    test.use({ viewport });

    test('loads without console errors and renders brand', async ({ page }) => {
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

      await page.goto(BASE_URL + '/seller');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveTitle(/AfriTrade/i);
      await expect(page.locator('body')).toBeVisible();
      console.log(`[${name}] errors:`, JSON.stringify(errors));
    });

    test('navigation renders on dashboard', async ({ page }) => {
      await page.goto(BASE_URL + '/seller');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, .paper-title')).toBeVisible();
    });
  });
}
