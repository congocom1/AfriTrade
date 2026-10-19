// test/http-errors.test.js
// Unit test for base44/shared/httpErrors.ts — the 400/500 classification used
// by function entry-point catch blocks (place-order first consumer).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../base44/shared/httpErrors.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { ClientInputError, errorStatus } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

describe('httpErrors', () => {
  it('maps ClientInputError to 400', () => {
    assert.equal(errorStatus(new ClientInputError('Cart is empty')), 400);
  });

  it('maps plain errors to 500', () => {
    assert.equal(errorStatus(new Error('Failed to create Order')), 500);
  });

  it('maps non-Error throws to 500', () => {
    assert.equal(errorStatus('boom'), 500);
    assert.equal(errorStatus(null), 500);
    assert.equal(errorStatus(undefined), 500);
  });

  it('ClientInputError subclasses Error and keeps the message', () => {
    const err = new ClientInputError('Product not found: abc');
    assert.ok(err instanceof Error);
    assert.equal(err.message, 'Product not found: abc');
  });
});
