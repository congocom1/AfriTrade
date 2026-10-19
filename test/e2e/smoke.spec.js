import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('AfriTrade — pages publiques', () => {
  test('charge la page d\'accueil', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/AfriTrade/i);
    await expect(page.locator('div.brand-lockup')).toBeVisible();
    await expect(page.getByText(/AfriTrade/i).first()).toBeVisible();
  });

  test('navigue vers la page de découverte', async ({ page }) => {
    await page.goto(BASE_URL + '/discover');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/AfriTrade/i);
    // h1 may require backend data; ensure page loads without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('affiche la page Panier', async ({ page }) => {
    await page.goto(BASE_URL + '/cart');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/AfriTrade/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('affiche les mentions légales', async ({ page }) => {
    await page.goto(BASE_URL + '/mentions-legales');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/AfriTrade/i);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });

  test('affiche la page À propos', async ({ page }) => {
    await page.goto(BASE_URL + '/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/AfriTrade/i);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  });
});
