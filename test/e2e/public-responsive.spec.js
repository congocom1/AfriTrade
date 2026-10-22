import { test, expect } from '@playwright/test';
/* global document, window, location */

// Read-only launch gate. Use dedicated staging in CI; no payments, no logins,
// no writes to business records. A public Base44 URL may be used for audit.
const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:5174').replace(/\/$/, '');
const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);
if (!isLocal && (!baseURL.startsWith('https://') || /^https:\/\/(?:www\.)?afritrade\.com$/i.test(baseURL))) {
  throw new Error('Responsive tests require local or HTTPS staging, not the custom production domain.');
}

for (const width of [390, 1280]) {
  for (const path of ['/', '/search', '/categories', '/cart', '/checkout', '/shipping-calculator', '/seller-application', '/faq', '/about']) {
    test(`public page ${path} has responsive, usable layout at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      const response = await page.goto(`${baseURL}${path}`, {waitUntil:'domcontentloaded'});
      expect(response?.status(), `${path} document HTTP status`).toBe(200);
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.locator('main')).toBeVisible();
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        brokenLocalImages: [...document.images].filter((image) =>
          image.complete && image.naturalWidth === 0 && image.currentSrc &&
          new URL(image.currentSrc).origin === location.origin
        ).map((image) => image.currentSrc),
      }));
      expect(audit.overflow, `${path} horizontal layout overflow`).toBeLessThanOrEqual(10);
      expect(audit.brokenLocalImages, `${path} broken same-origin image`).toEqual([]);
      expect(errors, `${path} unhandled JS errors`).toEqual([]);
    });
  }
}
