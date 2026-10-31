import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/pages/ShippingCalculator.jsx', 'utf8');
describe('shipping calculator amount display', () => {
  it('renders the computed home and zone values rather than undefined properties', () => {
    assert.match(source, /homeTotalCents:\s*round2Cents/);
    assert.match(source, /formatUSD\(result\.homeTotalCents\)/);
    assert.match(source, /formatUSD\(result\.zoneFeeCents\)/);
    assert.doesNotMatch(source, /formatUSD\(result\.homeTotal\)/);
  });
  it('clears stale quotes when the destination or weight changes', () => {
    assert.match(source, /setCity\(e\.target\.value\); setResult\(null\)/);
    assert.match(source, /setWeight\(e\.target\.value\); setResult\(null\)/);
  });
});
