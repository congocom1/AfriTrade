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
Received string:  "Discover | Congo Commerce"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "Discover | Congo Commerce"

```

```yaml
- banner:
  - link "AfriTrade — Home":
    - /url: /
    - text: AfriTrade
  - navigation "Main navigation":
    - link "Home":
      - /url: /
    - link "Discover":
      - /url: /discover
    - link "Categories":
      - /url: /categories
  - search:
    - text: Search products, shops…
    - searchbox "Search products, shops…"
  - button "More options":
    - img
  - link "Log in":
    - /url: /login
  - link "Sign up":
    - /url: /register
  - link "Cart":
    - /url: /cart
- main:
  - paragraph: No videos yet
  - paragraph: Creator content will appear here.
  - link "About":
    - /url: /about
  - link "Contact":
    - /url: /contact
  - link "Legal notice":
    - /url: /mentions-legales
  - link "Terms of sale":
    - /url: /cgv
  - link "Terms of use":
    - /url: /terms-of-service
  - link "Community rules":
    - /url: /platform-guidelines
  - link "Privacy & data":
    - /url: /confidentialite
  - link "Help center":
    - /url: /help-center
  - link "FAQ":
    - /url: /faq
  - link "Shipping & zones":
    - /url: /shipping-info
  - link "Buyer protection":
    - /url: /buyer-protection
  - link "My orders":
    - /url: /order-history
  - link "My wallet":
    - /url: /wallet
  - link "Loyalty & rewards":
    - /url: /customer-loyalty
  - link "Referral":
    - /url: /referral-program
  - link "Creators":
    - /url: /creator-showcase
  - link "Sell with us":
    - /url: /sell-with-us
  - link "Withdrawal requests":
    - /url: /payout-requests
  - link "Privacy settings":
    - /url: /privacy-settings
  - link "Delivery tracking":
    - /url: /order-tracking
  - link "Disputes & refunds":
    - /url: /dispute-center
  - link "Start a return":
    - /url: /returns
  - link "Support tickets":
    - /url: /support-tickets
  - link "Pickup points":
    - /url: /pickup-points
  - link "Sellers & reviews":
    - /url: /vendor-ratings
  - link "Shipping calculator":
    - /url: /shipping-calculator
  - link "Become a seller":
    - /url: /seller-application
  - link "Open a shop":
    - /url: /pricing
  - link "Subscription plans":
    - /url: /subscription-plans
  - paragraph: AfriTrade · RCCM — · NIF — · Lagos, Pan-African
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
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
