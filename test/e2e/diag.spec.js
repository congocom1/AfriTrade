import { test } from '@playwright/test';

test('diag homepage', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 3000));
  console.log('DIAG TITLE:', await page.title());
  const lockup = page.locator('div.brand-lockup');
  console.log('DIAG LOCKUP COUNT:', await lockup.count());
  const h1 = page.locator('h1');
  console.log('DIAG H1 COUNT:', await h1.count());
  console.log('DIAG ROOT HTML:', JSON.stringify(await page.locator('#root').evaluate(el => el.innerHTML)));
  console.log('DIAG ERRORS:', JSON.stringify(errors, null, 2));
  await page.screenshot({ path: '/tmp/diag-home.png', fullPage: true });
});
