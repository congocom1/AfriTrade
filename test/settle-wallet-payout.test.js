import { it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

let sequence = 0;
async function sharedModule(name) {
  const source = fs.readFileSync(new URL(`../base44/shared/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const { postWalletEntry: realPostWalletEntry } = await sharedModule('walletLedger');
const { requireAdmin: realRequireAdmin } = await sharedModule('security');
async function handler(deps) {
  let source = fs.readFileSync(new URL('../base44/functions/settle-wallet-payout/entry.ts', import.meta.url), 'utf8');
  source = source.replace(/^import .*;$/gm, '');
  const name = `__payoutTest${sequence++}`;
  globalThis[name] = deps;
  source = `const { createClientFromRequest, requireAdmin, postWalletEntry, addSecurityHeaders, checkRateLimit, rateLimitErrorResponse } = globalThis.${name};\n${source}`;
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  try { return (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)).default; }
  finally { delete globalThis[name]; }
}
function setup(role = 'admin') {
  const tx = { id: 'payout-1', type: 'PAYOUT', direction: 'debit', status: 'pending', wallet_id: 'wallet-1', amount_usd: 12.34 };
  let refunds = 0;
  const entities = {
    WalletTransaction: {
      get: async () => ({ ...tx }),
      updateMany: async (query, update) => {
        const matches = Object.entries(query).every(([key, value]) =>
          value && typeof value === 'object' ? (tx[key] !== undefined) === value.$exists : tx[key] === value);
        if (!matches) return { updated: 0 };
        Object.assign(tx, update.$set);
        return { updated: 1 };
      },
    },
    Wallet: { get: async () => ({ id: 'wallet-1' }) },
    AuditLog: { create: async () => ({}) },
  };
  return {
    tx, entities, refunds: () => refunds,
    deps: {
      createClientFromRequest: () => ({ asServiceRole: { entities } }),
      requireAdmin: async () => role === 'admin' ? { ok: true, user: { id: 'admin-1', email: 'admin@example.test' } } :
        { ok: false, response: Response.json({}, { status: 403 }) },
      postWalletEntry: async (_db, _wallet, entry) => { assert.equal(entry.amount, 12.34); refunds++; return { ok: true }; },
      addSecurityHeaders: response => response,
      checkRateLimit: async () => ({ ok: true }),
      rateLimitErrorResponse: () => Response.json({}, { status: 429 }),
    },
  };
}
const request = approve => new Request('https://example.test/settle-wallet-payout', {
  method: 'POST', body: JSON.stringify({ transactionId: 'payout-1', approve }),
});

// Atomic in-memory storage model: exercises real ledger/auth code, not hosted guarantees.
function integratedSetup(role = 'admin') {
  const state = setup();
  const wallet = { id: 'wallet-1', balance_usd: 87.66, pending_usd: 0 };
  const rows = [state.tx];
  const matches = (row, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
      if ('$ne' in value) return row[key] !== value.$ne;
    }
    return row[key] === value;
  });
  state.entities.Wallet = {
    get: async () => structuredClone(wallet),
    updateMany: async (query, update) => {
      if (!matches(wallet, query)) return { updated: 0 };
      Object.assign(wallet, update.$set);
      return { updated: 1 };
    },
  };
  state.entities.WalletTransaction = {
    get: async id => structuredClone(rows.find(row => row.id === id)),
    filter: async query => structuredClone(rows.filter(row => matches(row, query))),
    create: async data => {
      const row = { ...data, id: `refund-${rows.length}` };
      rows.push(row);
      return structuredClone(row);
    },
    updateMany: async (query, update) => {
      const found = rows.filter(row => matches(row, query));
      found.forEach(row => Object.assign(row, update.$set));
      return { updated: found.length };
    },
  };
  state.deps.createClientFromRequest = () => ({
    auth: { me: async () => role ? { id: 'admin-1', email: 'admin@example.test', role } : null },
    asServiceRole: { entities: state.entities },
  });
  state.deps.requireAdmin = realRequireAdmin;
  state.deps.postWalletEntry = realPostWalletEntry;
  return { ...state, wallet, rows };
}

it('uses real authorization to reject anonymous and ordinary users', async () => {
  for (const [role, status] of [[null, 401], ['user', 403]]) {
    const state = integratedSetup(role);
    const run = await handler(state.deps);
    assert.equal((await run(request(false))).status, status);
    assert.equal(state.wallet.balance_usd, 87.66);
    assert.equal(state.tx.payout_decision, undefined);
  }
});

it('credits once for concurrent identical rejections using the real ledger', async () => {
  const state = integratedSetup();
  const run = await handler(state.deps);
  const responses = await Promise.all(Array.from({ length: 8 }, () => run(request(false))));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(state.wallet.balance_usd, 100);
  assert.equal(state.wallet.ledger_operations.length, 1);
  assert.equal(state.rows.filter(row => row.type === 'REFUND' && row.status === 'posted').length, 1);
  assert.equal(state.tx.status, 'reversed');
});

for (const failure of ['audit', 'finalize', 'claim-timeout', 'claim-unknown', 'wallet-timeout', 'projection']) {
  it(`recovers ${failure} without a second refund`, async () => {
    const state = integratedSetup();
    let fail = true;
    const txUpdate = state.entities.WalletTransaction.updateMany;
    const walletUpdate = state.entities.Wallet.updateMany;
    state.entities.WalletTransaction.updateMany = async (query, update) => {
      if (fail && failure === 'finalize' && update.$set.status === 'reversed') throw new Error('finalize unavailable');
      if (fail && failure === 'projection' && query.status === 'preparing') throw new Error('projection unavailable');
      const result = await txUpdate(query, update);
      if (fail && update.$set.payout_decision) {
        if (failure === 'claim-timeout') throw new Error('claim timeout');
        if (failure === 'claim-unknown') return {};
      }
      return result;
    };
    state.entities.Wallet.updateMany = async (...args) => {
      const result = await walletUpdate(...args);
      if (fail && failure === 'wallet-timeout') throw new Error('wallet timeout');
      return result;
    };
    state.entities.AuditLog.create = async () => {
      if (fail && failure === 'audit') throw new Error('audit unavailable');
      return {};
    };
    const run = await handler(state.deps);
    assert.equal((await run(request(false))).status, 500);
    assert.equal((await run(request(true))).status, 409);
    fail = false;
    assert.equal((await run(request(false))).status, 200);
    assert.equal((await run(request(false))).status, 200);
    assert.equal(state.wallet.balance_usd, 100);
    assert.equal(state.wallet.ledger_operations.length, 1);
    assert.equal(state.tx.status, 'reversed');
  });
}

it('rejects malformed payout input before claiming a decision', async () => {
  const state = integratedSetup();
  const run = await handler(state.deps);
  for (const body of ['null', '{', '{}', '{"transactionId":" ","approve":false}']) {
    assert.equal((await run(new Request('https://example.test', { method: 'POST', body }))).status, 400);
  }
  assert.equal(state.tx.payout_decision, undefined);
});

it('denies non-admin payout mutations', async () => {
  const state = setup('user');
  const run = await handler(state.deps);
  assert.equal((await run(request(false))).status, 403);
  assert.equal(state.refunds(), 0);
  assert.equal(state.tx.status, 'pending');
});
it('rejects a payout through the ledger once and preserves cents', async () => {
  const state = setup();
  const run = await handler(state.deps);
  assert.equal((await run(request(false))).status, 200);
  assert.equal((await run(request(false))).status, 200);
  assert.equal(state.refunds(), 1);
  assert.equal(state.tx.status, 'reversed');
  assert.equal((await run(request(true))).status, 409);
});
it('allows only one of competing approve/reject decisions', async () => {
  const state = setup();
  const run = await handler(state.deps);
  const responses = await Promise.all([run(request(true)), run(request(false))]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal(state.tx.status, 'posted');
  assert.equal(state.refunds(), 0);
});
it('retains a recoverable rejection intent after a failed credit', async () => {
  const state = setup();
  let fail = true;
  const post = state.deps.postWalletEntry;
  state.deps.postWalletEntry = async (...args) => {
    if (fail) throw new Error('ledger temporarily unavailable');
    return post(...args);
  };
  const run = await handler(state.deps);
  assert.equal((await run(request(false))).status, 500);
  assert.equal(state.tx.status, 'pending');
  assert.equal((await run(request(true))).status, 409);
  fail = false;
  assert.equal((await run(request(false))).status, 200);
  assert.equal(state.refunds(), 1);
});