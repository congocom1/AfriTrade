import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { round2, round2Cents, usdCentsToCdfCents, formatUSD, formatCDF } from '../src/lib/format.js';

describe('round2', () => {
  it('rounds half-up to cents', () => {
    assert.equal(round2(2.345), 2.35);
    assert.equal(round2(2.344), 2.34);
  });
  it('absorbs float dust (0.1 + 0.2)', () => {
    assert.equal(round2(0.1 + 0.2), 0.3);
  });
  it('treats non-numbers as zero', () => {
    assert.equal(round2(undefined), 0);
    assert.equal(round2('abc'), 0);
  });
});

describe('round2Cents', () => {
  it('returns integer cents unchanged', () => {
    assert.equal(round2Cents(123), 123);
    assert.equal(round2Cents(0), 0);
  });
  it('treats non-numbers as zero', () => {
    assert.equal(round2Cents(undefined), 0);
    assert.equal(round2Cents('abc'), 0);
  });
});

describe('usdCentsToCdfCents', () => {
  it('converts at the default 2800 rate (280000 cents per USD)', () => {
    // 1000 cents = $10 * 2800 = 28000 CDF = 2800000 CDF cents
    assert.equal(usdCentsToCdfCents(1000), 2800000);
    // 50 cents = $0.50 * 2800 = 1400 CDF = 140000 CDF cents
    assert.equal(usdCentsToCdfCents(50), 140000);
  });
});

describe('display formatters', () => {
  it('formats USD with cents', () => {
    assert.equal(formatUSD(1250), '$12.50');
  });
  it('formats CDF without decimals', () => {
    assert.ok(formatCDF(2800000).includes('28'));
  });
});
