import { test, expect } from '@playwright/test';
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5174';
const target = new URL(baseURL);
if (!['http:', 'https:'].includes(target.protocol) || (target.protocol === 'http:' && !['localhost','127.0.0.1'].includes(target.hostname))) {
  throw new Error('Deployment verification requires a secure staging URL or localhost.');
}

test('serves the committed category artwork from its public path', async ({request}) => {
  const response = await request.get(new URL('/assets/marketplace/categories/electronics.svg', target).toString());
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/<svg[\s>]/i);
});

test('exposes a healthy API function, not a provider error page', async ({request}) => {
  const response = await request.post(new URL('/functions/health', target).toString(), {data: {}});
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.status).toBe('ok');
});

test('public storefront data requests are not blocked by Content Security Policy', async ({ page }) => {
  // Only published builds inject the CSP meta tag; local dev is verified by unit tests.
  test.skip(['localhost', '127.0.0.1'].includes(target.hostname), 'Production CSP is only embedded in built HTML');
  const blocked = [];
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('https://base44.app/') && request.failure()?.errorText === 'csp') {
      blocked.push(request.url());
    }
  });
  const productResponse = page.waitForResponse((response) =>
    response.url().startsWith('https://base44.app/api/apps/') &&
    response.url().includes('/entities/Product?'), { timeout: 30_000 });
  await page.goto(target.origin + '/', { waitUntil: 'domcontentloaded' });
  const response = await productResponse;
  expect(response.status(), 'Public Product feed must load from the real Base44 API').toBe(200);
  expect(blocked, 'The browser must be allowed to call the Base44 apex API origin').toEqual([]);
  await expect(page.getByText(/Some information could not be loaded|Certaines informations n’ont pas pu être chargées/i)).toHaveCount(0);
});
