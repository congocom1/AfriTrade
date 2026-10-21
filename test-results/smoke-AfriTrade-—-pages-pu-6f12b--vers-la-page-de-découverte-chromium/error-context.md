# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> AfriTrade — pages publiques >> navigue vers la page de découverte
- Location: test/e2e/smoke.spec.js:14:3

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /AfriTrade/i
Received string:  "Base44"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "Base44"

```

```yaml
- region "Notifications alt+T"
- link "Base44":
  - /url: https://app.base44.com
  - img "Base44"
- heading "Congo Commerce isn't available yet" [level=1]
- paragraph: This app isn't available yet.
- paragraph: If you've been invited, you'll be able to access it once it's ready.
- paragraph: Want to build your own app?
- link "Start building":
  - /url: https://app.base44.com
- paragraph: If you're the app admin, publish the app in Builder.
- link "Open Base44 Builder":
  - /url: https://app.base44.com
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
  4  | 
  5  | test.describe('AfriTrade — pages publiques', () => {
  6  |   test('charge la page d\'accueil', async ({ page }) => {
  7  |     await page.goto(BASE_URL + '/');
  8  |     await page.waitForLoadState('networkidle');
  9  |     await expect(page).toHaveTitle(/AfriTrade/i);
  10 |     await expect(page.locator('div.brand-lockup')).toBeVisible();
  11 |     await expect(page.getByText(/AfriTrade/i).first()).toBeVisible();
  12 |   });
  13 | 
  14 |   test('navigue vers la page de découverte', async ({ page }) => {
  15 |     await page.goto(BASE_URL + '/discover');
  16 |     await page.waitForLoadState('networkidle');
> 17 |     await expect(page).toHaveTitle(/AfriTrade/i);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  18 |     // h1 may require backend data; ensure page loads without error
  19 |     await expect(page.locator('body')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('affiche la page Panier', async ({ page }) => {
  23 |     await page.goto(BASE_URL + '/cart');
  24 |     await page.waitForLoadState('networkidle');
  25 |     await expect(page).toHaveTitle(/AfriTrade/i);
  26 |     await expect(page.locator('body')).toBeVisible();
  27 |   });
  28 | 
  29 |   test('affiche les mentions légales', async ({ page }) => {
  30 |     await page.goto(BASE_URL + '/mentions-legales');
  31 |     await page.waitForLoadState('networkidle');
  32 |     await expect(page).toHaveTitle(/AfriTrade/i);
  33 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  34 |   });
  35 | 
  36 |   test('affiche la page À propos', async ({ page }) => {
  37 |     await page.goto(BASE_URL + '/about');
  38 |     await page.waitForLoadState('networkidle');
  39 |     await expect(page).toHaveTitle(/AfriTrade/i);
  40 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  41 |   });
  42 | });
  43 | 
```