import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('Accessibility — WCAG axe audits', () => {
  test('Seller dashboard passes axe WCAG2AA', async ({ page }) => {
    await page.goto(BASE_URL + '/seller');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const violations = results.violations;
    console.log('Axe violations on /seller:', violations.length);
    for (const v of violations) {
      console.log(`- ${v.id}: ${v.description} (${v.impact}) — ${v.nodes.length} node(s)`);
    }

    // Log pass counts for visibility but fail on violations
    expect(violations).toEqual([]);
  });

  test('Public homepage passes axe WCAG2AA', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const violations = results.violations;
    console.log('Axe violations on /:', violations.length);
    for (const v of violations) {
      console.log(`- ${v.id}: ${v.description} (${v.impact}) — ${v.nodes.length} node(s)`);
    }

    expect(violations).toEqual([]);
  });
});
