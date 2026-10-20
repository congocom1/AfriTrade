import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

let sequence = 0;
async function sharedModule(name) {
  const source = fs.readFileSync(new URL(`../base44/shared/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const { postWalletEntry } = await sharedModule('walletLedger');

/** Loads the real handler with its imports injected, like settle-wallet-payout.test.js. */
async function handler(deps) {
  let source = fs.readFileSync(new URL('../base44/functions/request-withdrawal/entry.ts', import.meta.url), 'utf8');
  source = source.replace(/^import .*;$/gm, '');
  const name = `__withdrawalTest${sequence++}`;
  globalThis[name] = deps;
  source = `const { createClientFromRequest, requireAdmin, postWalletEntry, securityHeaders } = globalThis.${name};\nconst { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = securityHeaders;\n${source}`;
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  try { return (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)).default; }
  finally { delete globalThis[name]; }
}

// Atomic in-memory wallet storage: the real ledger runs against it, so the
// request-id contract is exercised end to end rather than mocked.
function setup({ balance = 100, owner = 'owner@example.test', caller = 'owner@example.test' } = {}) {
  const wallets = { 'wallet-1': { id: 'wallet-1', owner_type: 'customer', owner_email: owner, balance_usd: balance, pending_usd: 0, ledger_operations: [] } };
  const transactions = {};
  let seq = 0;
  const matches = (row, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
      if ('$ne' in value) return row[key] !== value.$ne;
    }
    return row[key] === value;
  });
  const entities = {
    Wallet: {
      get: async (id) => wallets[id] || null,
      updateMany: async (query, update) => {
        const row = wallets[query.id];
        if (!row || !matches(row, query)) return { updated: 0 };
        Object.assign(row, update.$set);
        return { updated: 1 };
      },
    },
    WalletTransaction: {
      create: async (values) => { const id = `tx-${++seq}`; transactions[id] = { id, ...values }; return transactions[id]; },
      get: async (id) => transactions[id] || null,
      updateMany: async (query, update) => {
        const row = transactions[query.id];
        if (!row || !matches(row, query)) return { updated: 0 };
        Object.assign(row, update.$set);
        return { updated: 1 };
      },
      filter: async (query) => Object.values(transactions).filter((row) => matches(row, query)),
    },
    AuditLog: { create: async () => ({}) },
  };
  return {
    wallets, transactions,
    deps: {
      createClientFromRequest: () => ({ auth: { me: async () => ({ id: 'u1', email: caller }) }, asServiceRole: { entities } }),
      postWalletEntry,
      securityHeaders: {
        addSecurityHeaders: (r) => r,
        getClientKey: () => '127.0.0.1',
        checkRateLimit: async () => ({ ok: true }),
        rateLimitErrorResponse: () => Response.json({ error: 'rate limited' }, { status: 429 }),
      },
    },
  };
}

const post = (body) => new Request('https://example.test/request-withdrawal', { method: 'POST', body: JSON.stringify(body) });

const run = (ctx, body) => handler(ctx.deps).then((fn) => fn(post(body)));

const base = { wallet_id: 'wallet-1', amount: 10, method: 'mpesa', account: '0812345678' };

describe('request-withdrawal request-id contract', () => {
  it('requires a caller-supplied request id', async () => {
    const ctx = setup();
    const res = await run(ctx, base);
    assert.equal(res.status, 400);
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 100);
  });

  it('debits once and replays the same request without a second debit', async () => {
    const ctx = setup();
    const body = { ...base, request_id: 'req-abcdef123456' };
    const first = await run(ctx, body);
    assert.equal(first.status, 200, await first.clone().text());
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 90);
    // A payout debit moves the money out of the balance; it is not a hold, so
    // pending stays untouched and the reduced balance is what caps the next one.
    assert.equal(ctx.wallets['wallet-1'].pending_usd, 0);

    const retry = await run(ctx, body);
    assert.equal(retry.status, 200);
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 90, 'a retry must not debit again');
  });

  it('treats the same amount twice under different ids as two real withdrawals', async () => {
    const ctx = setup();
    await run(ctx, { ...base, request_id: 'req-first-123456' });
    await run(ctx, { ...base, request_id: 'req-second-123456' });
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 80, 'identical amounts are separate intents');
  });

  it('refuses a withdrawal above the available balance', async () => {
    const ctx = setup({ balance: 5 });
    const res = await run(ctx, { ...base, amount: 10, request_id: 'req-overdraft-1234' });
    assert.equal(res.status, 409);
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 5);
  });

  it('refuses a wallet the caller does not own', async () => {
    const ctx = setup({ owner: 'someone@example.test' });
    const res = await run(ctx, { ...base, request_id: 'req-notowner-1234' });
    assert.equal(res.status, 403);
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 100);
  });

  it('caps a second withdrawal at what the first one left available', async () => {
    const ctx = setup();
    await run(ctx, { ...base, request_id: 'req-first-hold-12' });
    const res = await run(ctx, { ...base, amount: 91, request_id: 'req-second-hold-12' });
    assert.equal(res.status, 409);
    assert.equal(ctx.wallets['wallet-1'].balance_usd, 90);
  });
});
