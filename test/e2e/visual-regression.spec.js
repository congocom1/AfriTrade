/**
 * Visual Regression Tests
 * 
 * Run with: npx playwright test test/e2e/visual-regression.spec.js
 * Update baselines: UPDATE_BASELINE=1 npx playwright test test/e2e/visual-regression.spec.js
 */

import { test, expect } from '@playwright/test';
import { compareScreenshot, compareResponsive, compareThemes, compareLocales } from './visual-regression/visual-regression.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === '1';

// Test viewports for responsive testing
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },      // iPhone 12
  { name: 'tablet', width: 768, height: 1024 },     // iPad
  { name: 'desktop', width: 1280, height: 800 },    // Desktop
  { name: 'desktop-lg', width: 1920, height: 1080 }, // Large desktop
];

// Supported locales
const LOCALES = ['en', 'fr', 'ln', 'sw'];

test.describe('Visual Regression — Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Homepage — visual regression', async ({ page }) => {
    const result = await compareScreenshot(page, 'homepage', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05  // 5% tolerance
    });
    expect(result.passed).toBe(true);
  });

  test('Homepage — responsive', async ({ page }) => {
    const results = await compareResponsive(page, 'homepage', VIEWPORTS, { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    for (const r of results) {
      expect(r.passed).toBe(true);
    }
  });

  test('Homepage — themes (light/dark)', async ({ page }) => {
    const results = await compareThemes(page, 'homepage', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    for (const r of results) {
      expect(r.passed).toBe(true);
    }
  });

  test('Homepage — i18n locales', async ({ page }) => {
    const results = await compareLocales(page, 'homepage', LOCALES, { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    for (const r of results) {
      expect(r.passed).toBe(true);
    }
  });
});

test.describe('Visual Regression — Auth Pages', () => {
  test('Login page', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'login-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });

  test('Register page', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'register-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });
});

test.describe('Visual Regression — Seller Dashboard', () => {
  test('Seller Dashboard', async ({ page }) => {
    await page.goto(BASE_URL + '/seller');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'seller-dashboard', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });

  test('Seller Products', async ({ page }) => {
    await page.goto(BASE_URL + '/seller/products');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'seller-products', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });

  test('Seller Dashboard — themes', async ({ page }) => {
    await page.goto(BASE_URL + '/seller');
    await page.waitForLoadState('networkidle');
    
    const results = await compareThemes(page, 'seller-dashboard', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    for (const r of results) {
      expect(r.passed).toBe(true);
    }
  });
});

test.describe('Visual Regression — Discover & Categories', () => {
  test('Discover page', async ({ page }) => {
    await page.goto(BASE_URL + '/discover');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'discover-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });

  test('Categories page', async ({ page }) => {
    await page.goto(BASE_URL + '/categories');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'categories-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });
});

test.describe('Visual Regression — Cart & Checkout', () => {
  test('Cart page', async ({ page }) => {
    await page.goto(BASE_URL + '/cart');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'cart-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });

  test('Checkout page', async ({ page }) => {
    await page.goto(BASE_URL + '/checkout');
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'checkout-page', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });
});

test.describe('Visual Regression — UI Components', () => {
  test('Button variants', async ({ page }) => {
    await page.goto(BASE_URL + '/storybook'); // If storybook exists, otherwise use a test page
    await page.waitForLoadState('networkidle');
    
    const result = await compareScreenshot(page, 'button-variants', { 
      updateBaseline: UPDATE_BASELINE,
      threshold: 0.05
    });
    expect(result.passed).toBe(true);
  });
});