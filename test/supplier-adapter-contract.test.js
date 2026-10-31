import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../src/lib/suppliers.js', import.meta.url), 'utf8');

describe('supplier integration architecture', () => {
  it('does not expose supplier credentials through client-side VITE variables', () => {
    assert.doesNotMatch(source, /VITE_SUPPLIER_[A-Z_]+/);
  });
  it('explicitly labels demonstration suppliers as mock adapters', () => {
    assert.match(source, /SUPPLIER_REGISTRY\.mock_supplier_a = createMockProvider/);
    assert.match(source, /SUPPLIER_REGISTRY\.mock_supplier_b = createMockProvider/);
    assert.match(source, /isMock: true/);
  });
});
