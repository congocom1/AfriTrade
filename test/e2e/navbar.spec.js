import { test, expect } from '@playwright/test';
/* global document, MouseEvent */

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    return route.fulfill({ json: path.includes('/entities/') ? [] : {} });
  });
});

test('storefront navigation fits phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/cart');
    const header = page.locator('header').first();
    const search = header.getByRole('searchbox');
    await expect(search).toBeVisible();
    const searchBox = await search.boundingBox();
    expect(searchBox.width).toBeGreaterThan(width >= 768 ? 250 : 80);
    expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(width);
    expect(await header.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(page.locator('.bottom-nav-item[href="/cart"]')).toHaveAttribute('aria-current', 'page');
    if (width >= 768) {
      await expect(header.getByRole('button', { name: 'Account', exact: true })).toBeVisible();
      await expect(header.getByRole('link', { name: /^Cart/ })).toBeVisible();
    }
  }
});

test('desktop account menu supports keyboard dismissal and search submits', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/cart');
  const account = page.locator('header').getByRole('button', { name: 'Account', exact: true });
  await account.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(account).toBeFocused();
  await page.getByRole('searchbox').fill('coffee & tea');
  await page.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/\/search\?q=coffee%20%26%20tea$/);
});

test('modified tab clicks retain native browser behavior', async ({ page }) => {
  await page.goto('/cart');
  const prevented = await page.locator('.bottom-nav-item[href="/cart"]').evaluate(link => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    // Observe React's handler, then cancel native navigation for this synthetic test.
    let preventedByApp;
    const observe = event => { preventedByApp = event.defaultPrevented; event.preventDefault(); };
    document.addEventListener('click', observe, { once: true });
    link.dispatchEvent(event);
    return preventedByApp;
  });
  expect(prevented).toBe(false);
  await expect(page).toHaveURL(/\/cart$/);
});