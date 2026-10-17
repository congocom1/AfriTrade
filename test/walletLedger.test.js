import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../base44/shared/walletLedger.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { postWalletEntry, releasePending, MAX_WALLET_OPERATIONS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('$exists' in value) return (row[key] !== undefined) === value.$exists;
      if ('$ne' in value) return row[key] !== value.$ne;
    }
    return row[key] === value;
  });
}

// Models atomic increments, not the hosted database. No real money is touched.
function fixture(balance = 100, pending = 0) {
  const wallet = { id: 'wallet-1', balance_usd: balance, pending_usd: pending, lifetime_debit_usd: 0, lifetime_credit_usd: 0 };
  const rows = [];
  const db = { entities: {
    Wallet: {
      get: async () => structuredClone(wallet),
      updateMany: async (query, update) => {
        if (!matches(wallet, query)) return { updated: 0 };
        for (const [key, value] of Object.entries(update.$inc || {})) wallet[key] = (wallet[key] || 0) + value;
        Object.assign(wallet, update.$set || {});
        return { updated: 1 };
      },
    },
    WalletTransaction: {
      filter: async (query) => structuredClone(rows.filter(row => matches(row, query))),
      get: async (id) => structuredClone(rows.find(row => row.id === id)),
      updateMany: async (query, update) => {
        const matching = rows.filter(row => matches(row, query));
        matching.forEach(row => Object.assign(row, update.$set));
        return { updated: matching.length };
      },
      create: async (row) => { const saved = { id: `tx-${rows.length}`, ...row }; rows.push(saved); return saved; },
    },
  } };
  return { db, wallet, rows };
}
const entry = (amount, key = 'request-1', direction = 'debit') => ({ amount, idempotencyKey: key, direction, type: direction === 'debit' ? 'DEBIT' : 'CREDIT' });

describe('wallet ledger regression tests', () => {
  it('allows an exact available-balance debit without consuming existing pending credits', async () => {
    const { db, wallet } = fixture(100, 20);
    assert.equal((await postWalletEntry(db, wallet, entry(80))).ok, true);
    assert.equal(wallet.balance_usd, 20);
    assert.equal(wallet.pending_usd, 20);
  });
  it('releases an insufficient-funds hold', async () => {
    const { db, wallet, rows } = fixture(100, 20);
    assert.equal((await postWalletEntry(db, wallet, entry(81))).reason, 'insufficient_funds');
    assert.equal(wallet.balance_usd, 100);
    assert.equal(wallet.pending_usd, 20);
    assert.equal(rows.length, 0);
  });
  it('fails closed when the idempotency lookup fails', async () => {
    const { db, wallet } = fixture();
    db.entities.WalletTransaction.filter = async () => { throw new Error('lookup unavailable'); };
    await assert.rejects(postWalletEntry(db, wallet, entry(10)), /lookup unavailable/);
    assert.equal(wallet.balance_usd, 100);
    assert.equal(wallet.pending_usd, 0);
  });
  it('rejects non-finite amounts and whitespace keys without mutation', async () => {
    const { db, wallet } = fixture();
    assert.equal((await postWalletEntry(db, wallet, entry(Infinity))).reason, 'invalid_amount');
    assert.equal((await postWalletEntry(db, wallet, entry(10, ' '))).reason, 'missing_idempotency_key');
    assert.equal(wallet.balance_usd, 100);
  });
  it('does not repeat a sequentially completed request', async () => {
    const { db, wallet, rows } = fixture();
    await postWalletEntry(db, wallet, entry(10));
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'duplicate');
    assert.equal(wallet.balance_usd, 90);
    assert.equal(rows.length, 1);
  });
  it('does not overspend under concurrent distinct debits in the increment model', async () => {
    const { db, wallet, rows } = fixture();
    await Promise.all([postWalletEntry(db, wallet, entry(70, 'a')), postWalletEntry(db, wallet, entry(70, 'b'))]);
    assert.ok(wallet.balance_usd >= 0);
    assert.equal(wallet.pending_usd, 0);
    assert.equal(wallet.balance_usd, 30);
    assert.equal(rows.filter(row => row.status === 'posted').length, 1);
  });

  it('claims concurrent identical credits exactly once', async () => {
    const { db, wallet, rows } = fixture();
    await Promise.all([postWalletEntry(db, wallet, entry(10, 'same', 'credit')), postWalletEntry(db, wallet, entry(10, 'same', 'credit'))]);
    assert.equal(wallet.balance_usd, 110);
    assert.equal(rows.filter(row => row.status === 'posted').length, 1);
  });
  it('recovers a failed ledger insert without charging a retry twice', async () => {
    const { db, wallet } = fixture();
    const create = db.entities.WalletTransaction.create;
    db.entities.WalletTransaction.create = async () => { throw new Error('ledger unavailable'); };
    await assert.rejects(postWalletEntry(db, wallet, entry(10)), /ledger unavailable/);
    db.entities.WalletTransaction.create = create;
    await postWalletEntry(db, wallet, entry(10));
    assert.equal(wallet.balance_usd, 90);
  });
  it('repairs a failed projection after the balance committed', async () => {
    const { db, wallet, rows } = fixture();
    const update = db.entities.WalletTransaction.updateMany;
    db.entities.WalletTransaction.updateMany = async () => { throw new Error('projection failed'); };
    await assert.rejects(postWalletEntry(db, wallet, entry(10)), /projection failed/);
    assert.equal(wallet.balance_usd, 90);
    db.entities.WalletTransaction.updateMany = update;
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'duplicate');
    assert.equal(wallet.balance_usd, 90);
    assert.equal(rows[0].status, 'posted');
  });
  it('resolves an ambiguous wallet write without a second debit', async () => {
    const { db, wallet } = fixture();
    const update = db.entities.Wallet.updateMany;
    db.entities.Wallet.updateMany = async (...args) => { await update(...args); throw new Error('timeout'); };
    await assert.rejects(postWalletEntry(db, wallet, entry(10)), /timeout/);
    db.entities.Wallet.updateMany = update;
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'duplicate');
    assert.equal(wallet.balance_usd, 90);
  });
  it('rejects reuse of a key for a different amount or direction', async () => {
    const { db, wallet } = fixture();
    await postWalletEntry(db, wallet, entry(10));
    assert.equal((await postWalletEntry(db, wallet, entry(11))).reason, 'idempotency_conflict');
    assert.equal((await postWalletEntry(db, wallet, entry(10, 'request-1', 'credit'))).reason, 'idempotency_conflict');
    assert.equal(wallet.balance_usd, 90);
  });
  it('releases pending funds once even with concurrent retries', async () => {
    const { db, wallet } = fixture(100, 40);
    await Promise.all([releasePending(db, wallet, 20, 'release:1'), releasePending(db, wallet, 20, 'release:1')]);
    assert.equal(wallet.pending_usd, 20);
    assert.equal(wallet.balance_usd, 100);
    await assert.rejects(releasePending(db, wallet, 21, 'release:1'), /idempotency_conflict/);
    await assert.rejects(releasePending(db, wallet, 30, 'release:2'), /insufficient_pending/);
  });
  it('fails closed at receipt capacity without evicting replay protection', async () => {
    const { db, wallet, rows } = fixture();
    wallet.ledger_operations = Array.from({ length: MAX_WALLET_OPERATIONS }, (_, i) => ({ key: `old:${i}` }));
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'ledger_capacity');
    assert.equal(wallet.balance_usd, 100);
    assert.equal(rows.length, 0);
  });
  it('retries contention using the fresh balance without losing a concurrent credit', async () => {
    const { db, wallet } = fixture();
    const update = db.entities.Wallet.updateMany;
    let first = true;
    db.entities.Wallet.updateMany = async (...args) => {
      if (first) { first = false; wallet.balance_usd += 20; return { updated: 0 }; }
      return update(...args);
    };
    assert.equal((await postWalletEntry(db, wallet, entry(100))).ok, true);
    assert.equal(wallet.balance_usd, 20);
  });
  it('bounds contention retries without changing money', async () => {
    const { db, wallet, rows } = fixture();
    db.entities.Wallet.updateMany = async () => ({ updated: 0 });
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'wallet_busy');
    assert.equal(wallet.balance_usd, 100);
    assert.equal(rows.filter(row => row.status !== 'preparing').length, 0);
  });
  it('does not guess whether an unknown update result committed', async () => {
    const { db, wallet } = fixture();
    const update = db.entities.Wallet.updateMany;
    db.entities.Wallet.updateMany = async (...args) => { await update(...args); return {}; };
    await assert.rejects(postWalletEntry(db, wallet, entry(10)), /wallet_update_unknown/);
    db.entities.Wallet.updateMany = update;
    assert.equal((await postWalletEntry(db, wallet, entry(10))).reason, 'duplicate');
    assert.equal(wallet.balance_usd, 90);
  });
  it('never re-posts a transaction that was later reversed', async () => {
    const { db, wallet, rows } = fixture();
    await postWalletEntry(db, wallet, entry(10));
    rows[0].status = 'reversed';
    await postWalletEntry(db, wallet, entry(10));
    assert.equal(rows[0].status, 'reversed');
    assert.equal(wallet.balance_usd, 90);
  });
});