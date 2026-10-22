import { test, expect } from '@playwright/test';

// These tests are READ ONLY. Never mint credentials or mutate production records.
const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:5174').replace(/\/$/, '');
const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);
if (!isLocal && (!/^https:\/\//.test(baseURL) || /^https:\/\/(?:www\.)?afritrade\.com$/i.test(baseURL))) {
  throw new Error('Route-guard tests require local or a dedicated HTTPS staging URL.');
}

// Every console is behind RequireLogin (and AdminOnly for the back-office ones).
const guarded = ['/admin', '/developers', '/backoffice', '/seller', '/courier', '/creator', '/employee'];

// Headings that only exist once a guarded console has actually rendered.
const consoleMarkers = [/Developer portal/i, /Portail développeurs/i, /Gérer les clés API/i];

test.describe('anonymous route access', () => {
  for (const path of guarded) {
    test(`redirects an anonymous visitor away from ${path}`, async ({ page }) => {
      const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' });
      expect(response).not.toBeNull();
      expect(response.status()).toBe(200);
      // The auth check runs after DOM load; give it time to redirect to login.
      await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
      // A guarded console must never render for a visitor without a session.
      for (const marker of consoleMarkers) {
        await expect(page.locator('body')).not.toContainText(marker, { timeout: 15_000 });
      }
    });
  }
});
