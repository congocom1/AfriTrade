/**
 * Visual Regression Testing Utility for Playwright
 * 
 * Compares screenshots against baseline images using pixelmatch.
 * Usage:
 *   const { compareScreenshot } = require('./visual-regression');
 *   await compareScreenshot(page, 'my-test-name', { threshold: 0.1 });
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASELINE_DIR = path.join(__dirname, 'baseline');
export const DIFF_DIR = path.join(__dirname, 'diff');

/**
 * Ensure directories exist
 */
function ensureDirs() {
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DIFF_DIR)) {
    fs.mkdirSync(DIFF_DIR, { recursive: true });
  }
}

/**
 * Compare a screenshot against baseline
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} testName - Unique test identifier
 * @param {Object} options - Comparison options
 * @param {number} options.threshold - Pixel difference threshold (0-1), default 0.1 (10%)
 * @param {boolean} options.updateBaseline - If true, update baseline instead of comparing
 * @param {Object} options.screenshotOptions - Additional options passed to page.screenshot()
 * @returns {Promise<{passed: boolean, diffPixels: number, totalPixels: number, diffRatio: number}>}
 */
export async function compareScreenshot(page, testName, options = {}) {
  const {
    threshold = 0.1,
    updateBaseline = false,
    screenshotOptions = { fullPage: true, animations: 'disabled' },
  } = options;

  ensureDirs();

  const baselinePath = path.join(BASELINE_DIR, `${testName}.png`);
  const currentPath = path.join(DIFF_DIR, `${testName}-current.png`);
  const diffPath = path.join(DIFF_DIR, `${testName}-diff.png`);

  // Take current screenshot
  await page.screenshot({ ...screenshotOptions, path: currentPath });

  // If updating baseline or no baseline exists, save as baseline and pass
  if (updateBaseline || !fs.existsSync(baselinePath)) {
    fs.copyFileSync(currentPath, baselinePath);
    console.log(`✅ Baseline ${updateBaseline ? 'updated' : 'created'}: ${testName}`);
    return { passed: true, diffPixels: 0, totalPixels: 0, diffRatio: 0 };
  }

  // Compare images
  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const currentImg = PNG.sync.read(fs.readFileSync(currentPath));

  // Ensure same dimensions
  if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
    console.error(`❌ Dimension mismatch for ${testName}: baseline ${baselineImg.width}x${baselineImg.height} vs current ${currentImg.width}x${currentImg.height}`);
    return { passed: false, diffPixels: -1, totalPixels: -1, diffRatio: -1 };
  }

  const diffImg = new PNG({ width: baselineImg.width, height: baselineImg.height });

  const diffPixels = pixelmatch(
    baselineImg.data,
    currentImg.data,
    diffImg.data,
    baselineImg.width,
    baselineImg.height,
    { threshold: 0.1, includeAA: true }
  );

  const totalPixels = baselineImg.width * baselineImg.height;
  const diffRatio = diffPixels / totalPixels;

  // Save diff image if there are differences
  if (diffPixels > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diffImg));
  }

  const passed = diffRatio <= threshold;

  if (passed) {
    console.log(`✅ Visual regression passed: ${testName} (diff: ${(diffRatio * 100).toFixed(2)}%)`);
  } else {
    console.error(`❌ Visual regression failed: ${testName} (diff: ${(diffRatio * 100).toFixed(2)}%, threshold: ${(threshold * 100).toFixed(2)}%)`);
    console.error(`   Baseline: ${baselinePath}`);
    console.error(`   Current:  ${currentPath}`);
    console.error(`   Diff:     ${diffPath}`);
  }

  return { passed, diffPixels, totalPixels, diffRatio };
}

/**
 * Compare multiple viewports for responsive visual regression
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} testName - Base test name
 * @param {Array<{name: string, width: number, height: number}>} viewports - Viewport configs
 * @param {Object} options - Same as compareScreenshot options
 */
export async function compareResponsive(page, testName, viewports, options = {}) {
  const results = [];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500); // Allow layout to settle
    
    const result = await compareScreenshot(page, `${testName}-${viewport.name}`, options);
    results.push({ viewport: viewport.name, ...result });
  }
  
  return results;
}

/**
 * Test both light and dark themes
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} testName - Base test name
 * @param {Object} options - Same as compareScreenshot options
 */
export async function compareThemes(page, testName, options = {}) {
  const results = [];
  
  // Light theme
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(500);
  results.push(await compareScreenshot(page, `${testName}-light`, options));
  
  // Dark theme
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(500);
  results.push(await compareScreenshot(page, `${testName}-dark`, options));
  
  return results;
}

/**
 * Test multiple languages for i18n visual regression
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} testName - Base test name
 * @param {string[]} locales - Locale codes (e.g., ['en', 'fr', 'ln', 'sw'])
 * @param {Object} options - Same as compareScreenshot options
 */
export async function compareLocales(page, testName, locales, options = {}) {
  const results = [];
  const baseUrl = page.url().split('?')[0]; // Remove query params
  
  for (const locale of locales) {
    await page.goto(`${baseUrl}?lang=${locale}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    results.push(await compareScreenshot(page, `${testName}-${locale}`, options));
  }
  
  return results;
}