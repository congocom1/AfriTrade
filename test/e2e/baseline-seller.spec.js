import { test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('Seller pages — baseline screenshots', () => {
  test('SellerDashboard baseline', async ({ page }) => {
    await page.goto(BASE_URL + '/seller');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/baseline-seller-dashboard.png', fullPage: true });
  });

  test('SellerProducts baseline', async ({ page }) => {
    await page.goto(BASE_URL + '/seller/products');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/baseline-seller-products.png', fullPage: true });
  });
});
