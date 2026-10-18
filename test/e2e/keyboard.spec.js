import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('Seller dashboard — keyboard navigation', () => {
  test('focusable elements exist and focus-visible outlines are present in CSS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));
    await page.goto(BASE_URL + '/seller');
    await page.waitForLoadState('networkidle');

    // Count focusable interactive elements rendered on the dashboard
    const focusable = page.locator('a, button, select, input, [tabindex]:not([tabindex="-1"])');
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);

    // Press Tab and confirm focus moves to a focusable element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const focusedTag = await page.locator(':focus').evaluate(el => el ? el.tagName : null).catch(() => null);
    expect(['A', 'BUTTON', 'SELECT', 'INPUT']).toContain(focusedTag);

    // Confirm focus-visible outline CSS exists on paper interactive elements
    const hasFocusOutline = await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const sheet = Array.from(document.styleSheets);
      let found = false;
      for (const s of sheet) {
        try {
          const rules = Array.from(s.cssRules || []);
          for (const r of rules) {
            if (typeof r.selectorText === 'string' && /focus-visible/.test(r.selectorText) && /outline/.test(r.cssText || '')) {
              found = true;
            }
          }
        } catch { /* cross-origin stylesheet */ }
      }
      return found;
    });
    expect(hasFocusOutline).toBe(true);

    console.log('Focusable element count:', count, '| first focused tag:', focusedTag, '| errors:', errors);
  });
});
