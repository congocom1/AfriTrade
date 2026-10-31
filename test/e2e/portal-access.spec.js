import { test, expect } from '@playwright/test';

// Local, deterministic anonymous coverage. Authenticated operations require
// dedicated staging accounts and are deliberately outside this suite.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
});

for (const path of ['/pro', '/logistics']) {
  test(`public portal ${path} renders without a session`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const path of ['/seller', '/courier', '/creator', '/employee', '/admin', '/developers', '/backoffice']) {
  test(`anonymous visitors cannot enter ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
}