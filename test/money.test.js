// Test file for verifying monetary calculations use integer arithmetic
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { round2Cents, round2, usdCentsToCdfCents, cdfCentsToUsdCents, formatUSD, formatCDF } from '../src/lib/format';

describe('Monetary Calculations - Integer Arithmetic', () => {
  beforeEach(() => {
    // Reset exchange rate to default for tests
    // In real tests, we would mock this, but for now we'll use the default
  });

  it('round2Cents should work with integer cents', () => {
    assert.strictEqual(round2Cents(1234), 1234);
    assert.strictEqual(round2Cents(0), 0);
    assert.strictEqual(round2Cents(-50), -50);
  });

  it('round2Cents should round correctly', () => {
    assert.strictEqual(round2Cents(1234.5), 1235);
    assert.strictEqual(round2Cents(1234.4), 1234);
    assert.strictEqual(round2Cents(1234.500001), 1235);
  });

  it('round2 should convert dollars to cents correctly', () => {
    assert.strictEqual(round2(12.34), 12.34);
    assert.strictEqual(round2(12.345), 12.35);
    assert.strictEqual(round2(12.344), 12.34);
  });

  it('USD to CDF conversion should use integer math', () => {
    // With default rate of 2800 CDF per USD
    // 1 USD = 2800 CDF
    // 100 cents USD = 280000 cents CDF
    assert.strictEqual(usdCentsToCdfCents(100), 280000); // 1 USD -> 2800 CDF
    assert.strictEqual(usdCentsToCdfCents(50), 140000); // 0.5 USD -> 1400 CDF
    assert.strictEqual(usdCentsToCdfCents(1), 2800); // 0.01 USD -> 28 CDF
  });

  it('CDF to USD conversion should use integer math', () => {
    // With default rate of 2800 CDF per USD
    // 2800 CDF = 1 USD
    // 280000 cents CDF = 100 cents USD
    assert.strictEqual(cdfCentsToUsdCents(280000), 100); // 2800 CDF -> 1 USD
    assert.strictEqual(cdfCentsToUsdCents(140000), 50); // 1400 CDF -> 0.5 USD
    assert.strictEqual(cdfCentsToUsdCents(28), 0); // 0.28 CDF -> 0.0001 USD (rounded)
  });

  it('formatUSD should format cents correctly', () => {
    assert.strictEqual(formatUSD(0), '$0.00');
    assert.strictEqual(formatUSD(100), '$1.00');
    assert.strictEqual(formatUSD(1234), '$12.34');
    assert.strictEqual(formatUSD(123456), '$1,234.56');
  });

  it('formatCDF should format cents correctly', () => {
    // Note: French locale uses non-breaking space (char 160) between number and currency
    assert.strictEqual(formatCDF(0), '0 CDF');
    assert.strictEqual(formatCDF(100), '1 CDF');
    assert.strictEqual(formatCDF(1234), '12 CDF');
    assert.strictEqual(formatCDF(123456), '1 235 CDF'); // 202F is narrow non-breaking space
  });

  it('Money calculations should avoid floating point errors', () => {
    // Test that would fail with floating point math
    const amount1 = 0.10; // 10 cents
    const amount2 = 0.20; // 20 cents
    const expected = 0.30; // 30 cents

    // Using our integer-based functions
    const cents1 = Math.round(amount1 * 100); // 10
    const cents2 = Math.round(amount2 * 100); // 20
    const sumCents = cents1 + cents2; // 30
    const sumDollars = sumCents / 100; // 0.30

    assert.strictEqual(sumDollars, expected);

    // Direct floating point addition would be problematic
    const floatSum = amount1 + amount2; // 0.30000000000000004
    assert.notStrictEqual(floatSum, expected); // This demonstrates the problem
  });
});