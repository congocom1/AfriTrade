import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, networkForPhone, validateMobileMoneyNumber } from '../src/lib/mobileMoney.js';

describe('normalizePhone', () => {
  it('accepts local, international and spaced CD forms', () => {
    assert.equal(normalizePhone('0812345678'), '+243812345678');
    assert.equal(normalizePhone('+243812345678'), '+243812345678');
    assert.equal(normalizePhone('243 81 234 5678'), '+243812345678');
    assert.equal(normalizePhone('081 234 5678'), '+243812345678');
  });
  it('accepts Nigerian numbers, which the checkout also offers', () => {
    assert.equal(normalizePhone('08031234567'), '+2348031234567');
    assert.equal(normalizePhone('+2348031234567'), '+2348031234567');
    assert.equal(normalizePhone('0903 123 4567'), '+2349031234567');
  });
  it('rejects wrong lengths and non-mobile prefixes', () => {
    assert.equal(normalizePhone('081234567'), '');
    assert.equal(normalizePhone('0712345678'), '');
    assert.equal(normalizePhone('0803123456'), '');
    assert.equal(normalizePhone(''), '');
    assert.equal(normalizePhone(null), '');
  });
});

describe('networkForPhone', () => {
  it('maps prefixes to operators', () => {
    assert.equal(networkForPhone('0812345678')?.providerId, 'mpesa');
    assert.equal(networkForPhone('0991234567')?.providerId, 'airtel');
    assert.equal(networkForPhone('0891234567')?.providerId, 'orange');
    assert.equal(networkForPhone('08031234567')?.providerId, 'mpesa');
    assert.equal(networkForPhone('+2349031234567')?.providerId, 'airtel');
  });
  it('returns null for unknown input', () => {
    assert.equal(networkForPhone('not a number'), null);
  });
});

describe('validateMobileMoneyNumber', () => {
  it('accepts a matching operator number', () => {
    const r = validateMobileMoneyNumber('mpesa', '0812345678');
    assert.equal(r.ok, true);
    assert.equal(r.phone, '+243812345678');
  });
  it('rejects a number from another operator', () => {
    const r = validateMobileMoneyNumber('mpesa', '0991234567');
    assert.equal(r.ok, false);
    assert.match(r.error, /Airtel/);
  });
  it('rejects garbage with a hint', () => {
    const r = validateMobileMoneyNumber('orange', 'abc');
    assert.equal(r.ok, false);
    assert.ok(r.hint.length > 0);
  });
});
