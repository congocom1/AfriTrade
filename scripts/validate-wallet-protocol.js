#!/usr/bin/env node
/**
 * Wallet Protocol Staging Validation
 *
 * Runs the WALLET_PROTOCOL.md rollout steps against a live Base44 staging app.
 * Requires: BASE44_APP_ID, BASE44_API_KEY, STAGING_BASE_URL environment variables.
 *
 * Usage:
 *   BASE44_APP_ID=xxx BASE44_API_KEY=yyy STAGING_BASE_URL=https://staging.base44.app node scripts/validate-wallet-protocol.js
 */

import { createClient } from '@base44/sdk';

const REQUIRED_ENV = ['BASE44_APP_ID', 'BASE44_API_KEY', 'STAGING_BASE_URL'];
for (const env of REQUIRED_ENV) {
  if (!process.env[env]) {
    console.error(`Missing required env: ${env}`);
    process.exit(1);
  }
}

const base44 = createClient({
  appId: process.env.BASE44_APP_ID,
  apiKey: process.env.BASE44_API_KEY,
  baseUrl: process.env.STAGING_BASE_URL,
});

const _db = base44.asServiceRole;
const _EPSILON = 0.005;
function _round2(v) { return Math.round((Number(v) || 0) * 100) / 100; }

async function runValidation() {
  console.log('Starting Wallet Protocol Validation on Staging');
  console.log('='.repeat(60));

  const results = {
    schemaCheck: false,
    atomicUpdateMany: false,
    concurrentDebits: false,
    concurrentCredits: false,
    competingPayouts: false,
    interruptedProjection: false,
    reconciliation: false,
  };

  try {
    // Step 1: Schema verification
    console.log('\nStep 1: Verify Wallet & WalletTransaction schema');
    const wallet = await _db.entities.Wallet.create({
      owner_type: 'test',
      owner_id: 'validation-' + Date.now(),
      owner_name: 'Validation Wallet',
      owner_email: 'validation@test.local',
      balance_usd: 1000,
      pending_usd: 0,
      currency: 'USD',
      status: 'active',
    });
    console.log(`  Wallet created: ${wallet.id}`);

    const tx = await _db.entities.WalletTransaction.create({
      wallet_id: wallet.id,
      type: 'TEST',
      direction: 'credit',
      amount_usd: 10,
      amount_cdf: 0,
      balance_after_usd: 1010,
      currency: 'USD',
      description: 'Schema test',
      reference: 'schema-test',
      order_id: '',
      order_number: '',
      idempotency_key: 'schema-test-key',
      status: 'posted',
    });
    console.log(`  WalletTransaction created: ${tx.id}`);
    results.schemaCheck = true;

    // Step 2: Verify atomic updateMany predicate evaluation
    console.log('\nStep 2: Verify atomic updateMany on single wallet');
    const current = await _db.entities.Wallet.get(wallet.id);
    const query = { id: wallet.id, balance_usd: current.balance_usd };
    const update = { $set: { balance_usd: _round2(current.balance_usd + 50), ledger_revision: (current.ledger_revision || 0) + 1 } };
    const result = await _db.entities.Wallet.updateMany(query, update);
    if (result.updated === 1) {
      console.log('  updateMany with predicate succeeded atomically');
      results.atomicUpdateMany = true;
    } else {
      console.log('  updateMany predicate failed (expected updated=1)');
    }

    // Step 3: Simultaneous exact-balance debits
    console.log('\nStep 3: Concurrent exact-balance debits (race test)');
    const raceWallet = await _db.entities.Wallet.create({
      owner_type: 'test',
      owner_id: 'race-' + Date.now(),
      owner_name: 'Race Wallet',
      owner_email: 'race@test.local',
      balance_usd: 100,
      pending_usd: 0,
      currency: 'USD',
      status: 'active',
    });

    async function attemptDebit(label, amount, key) {
      const w = await _db.entities.Wallet.get(raceWallet.id);
      const available = _round2((w.balance_usd || 0) - (w.pending_usd || 0));
      if (_round2(amount - available) > _EPSILON) return { label, ok: false, reason: 'insufficient_funds' };

      const tx = await _db.entities.WalletTransaction.create({
        wallet_id: w.id, type: 'PAYOUT', direction: 'debit', amount_usd: amount,
        amount_cdf: 0, balance_after_usd: _round2(w.balance_usd - amount),
        currency: 'USD', description: label, reference: key, order_id: '',
        order_number: '', idempotency_key: key, status: 'preparing',
      });

      const afterBalance = _round2(w.balance_usd - amount);
      const pending = _round2((w.pending_usd || 0) + amount);
      const receipts = w.ledger_operations || [];
      receipts.push({ key, payload: JSON.stringify(['debit', amount]), transaction_id: tx.id, status: 'posted', balance_after_usd: afterBalance });

      const upd = await _db.entities.Wallet.updateMany(
        { id: w.id, balance_usd: w.balance_usd, pending_usd: w.pending_usd, ledger_revision: w.ledger_revision || 0 },
        { $set: { balance_usd: afterBalance, pending_usd: pending, ledger_revision: (w.ledger_revision || 0) + 1, ledger_operations: receipts } }
      );

      if (upd.updated === 1) {
        await _db.entities.WalletTransaction.updateMany({ id: tx.id, status: 'preparing' }, { $set: { status: 'posted', balance_after_usd: afterBalance } });
        return { label, ok: true };
      }
      return { label, ok: false, reason: 'concurrent_modification' };
    }

    const [r1, r2] = await Promise.all([
      attemptDebit('debit-1', 60, 'race-key-1'),
      attemptDebit('debit-2', 60, 'race-key-2'),
    ]);
    console.log(`  ${r1.ok ? 'PASS' : 'FAIL'} ${r1.label}: ${r1.ok ? 'success' : r1.reason}`);
    console.log(`  ${r2.ok ? 'PASS' : 'FAIL'} ${r2.label}: ${r2.ok ? 'success' : r2.reason}`);

    const final = await _db.entities.Wallet.get(raceWallet.id);
    console.log(`  Final balance: ${final.balance_usd}, pending: ${final.pending_usd}`);
    const successCount = [r1, r2].filter(r => r.ok).length;
    if (successCount === 1 && _round2(final.balance_usd) === 40) {
      console.log('  Race condition handled correctly (one debit succeeded)');
      results.concurrentDebits = true;
    } else {
      console.log('  Race condition not properly handled');
    }

    // Step 4: Identical credits (idempotency)
    console.log('\nStep 4: Identical credits with same idempotency key');
    const creditWallet = await _db.entities.Wallet.create({
      owner_type: 'test', owner_id: 'credit-' + Date.now(), owner_name: 'Credit Wallet',
      owner_email: 'credit@test.local', balance_usd: 0, pending_usd: 0, currency: 'USD', status: 'active'
    });

    async function postCredit(wallet, amount, key) {
      const w = await _db.entities.Wallet.get(wallet.id);
      const receipts = w.ledger_operations || [];
      const existing = receipts.find(r => r.key === key);
      if (existing) return { duplicate: true };

      const afterBalance = _round2(w.balance_usd + amount);
      const tx = await _db.entities.WalletTransaction.create({
        wallet_id: w.id, type: 'CREDIT', direction: 'credit', amount_usd: amount,
        amount_cdf: 0, balance_after_usd: afterBalance, currency: 'USD',
        description: 'Idempotency test', reference: key, order_id: '', order_number: '',
        idempotency_key: key, status: 'preparing',
      });
      receipts.push({ key, payload: JSON.stringify(['credit', amount]), transaction_id: tx.id, status: 'posted', balance_after_usd: afterBalance });

      const upd = await _db.entities.Wallet.updateMany(
        { id: w.id, balance_usd: w.balance_usd, pending_usd: w.pending_usd, ledger_revision: w.ledger_revision || 0 },
        { $set: { balance_usd: afterBalance, ledger_revision: (w.ledger_revision || 0) + 1, ledger_operations: receipts } }
      );

      if (upd.updated === 1) {
        await _db.entities.WalletTransaction.updateMany({ id: tx.id, status: 'preparing' }, { $set: { status: 'posted', balance_after_usd: afterBalance } });
        return { ok: true };
      }
      return { ok: false };
    }

    const c1 = await postCredit(creditWallet, 25.50, 'idem-key-1');
    const c2 = await postCredit(creditWallet, 25.50, 'idem-key-1'); // Same key
    console.log(`  First credit: ${c1.ok ? 'PASS' : 'FAIL'} ${c1.duplicate ? '(duplicate)' : ''}`);
    console.log(`  Retry credit: ${c2.ok ? 'PASS' : 'FAIL'} ${c2.duplicate ? '(duplicate detected)' : ''}`);

    const cFinal = await _db.entities.Wallet.get(creditWallet.id);
    if (_round2(cFinal.balance_usd) === 25.50 && c1.ok && c2.duplicate) {
      console.log('  Idempotency key deduplication works');
      results.concurrentCredits = true;
    } else {
      console.log('  Idempotency not working correctly');
    }

    // Step 5: Competing payout decisions (approve vs reject)
    console.log('\nStep 5: Competing approve/reject decisions');
    const payoutWallet = await _db.entities.Wallet.create({
      owner_type: 'test', owner_id: 'payout-' + Date.now(), owner_name: 'Payout Wallet',
      owner_email: 'payout@test.local', balance_usd: 500, pending_usd: 0, currency: 'USD', status: 'active'
    });

    const payoutTx = await _db.entities.WalletTransaction.create({
      wallet_id: payoutWallet.id, type: 'PAYOUT', direction: 'debit', amount_usd: 100,
      amount_cdf: 0, balance_after_usd: 400, currency: 'USD', description: 'Payout test',
      reference: 'payout-test', order_id: '', order_number: '', idempotency_key: 'payout-test-key',
      status: 'pending',
    });

    const claimApprove = await _db.entities.WalletTransaction.updateMany(
      { id: payoutTx.id, status: 'pending', payout_decision: { $exists: false } },
      { $set: { payout_decision: 'approve', payout_actor: 'admin@test' } }
    );
    const claimReject = await _db.entities.WalletTransaction.updateMany(
      { id: payoutTx.id, status: 'pending', payout_decision: { $exists: false } },
      { $set: { payout_decision: 'reject', payout_actor: 'admin@test' } }
    );

    console.log(`  Approve claim: updated=${claimApprove.updated}`);
    console.log(`  Reject claim: updated=${claimReject.updated}`);

    const decided = await _db.entities.WalletTransaction.get(payoutTx.id);
    console.log(`  Final decision: ${decided.payout_decision}, status: ${decided.status}`);

    if ((claimApprove.updated === 1 && claimReject.updated === 0) || (claimApprove.updated === 0 && claimReject.updated === 1)) {
      console.log('  Only one competing decision can claim');
      results.competingPayouts = true;
    } else {
      console.log('  Competing decisions not properly serialized');
    }

    // Step 6: Interrupted projection (preparing row left behind)
    console.log('\nStep 6: Interrupted projection (preparing row persistence)');
    const interruptWallet = await _db.entities.Wallet.create({
      owner_type: 'test', owner_id: 'interrupt-' + Date.now(), owner_name: 'Interrupt Wallet',
      owner_email: 'interrupt@test.local', balance_usd: 200, pending_usd: 0, currency: 'USD', status: 'active'
    });

    const interruptTx = await _db.entities.WalletTransaction.create({
      wallet_id: interruptWallet.id, type: 'PAYOUT', direction: 'debit', amount_usd: 50,
      amount_cdf: 0, balance_after_usd: 150, currency: 'USD', description: 'Interrupt test',
      reference: 'interrupt-test', order_id: '', order_number: '', idempotency_key: 'interrupt-key',
      status: 'preparing',
    });

    const w = await _db.entities.Wallet.get(interruptWallet.id);
    const afterBalance = _round2(w.balance_usd - 50);
    const pending = _round2((w.pending_usd || 0) + 50);
    const receipts = w.ledger_operations || [];
    receipts.push({ key: 'interrupt-key', payload: JSON.stringify(['debit', 50]), transaction_id: interruptTx.id, status: 'posted', balance_after_usd: afterBalance });

    await _db.entities.Wallet.updateMany(
      { id: w.id, balance_usd: w.balance_usd, pending_usd: w.pending_usd, ledger_revision: w.ledger_revision || 0 },
      { $set: { balance_usd: afterBalance, pending_usd: pending, ledger_revision: (w.ledger_revision || 0) + 1, ledger_operations: receipts } }
    );

    const leftBehind = await _db.entities.WalletTransaction.get(interruptTx.id);
    console.log(`  Transaction status after interrupt: ${leftBehind.status}`);

    const recover = await _db.entities.WalletTransaction.updateMany(
      { id: interruptTx.id, status: 'preparing' },
      { $set: { status: 'posted', balance_after_usd: afterBalance } }
    );
    if (recover.updated === 1) {
      console.log('  Preparing row is recoverable');
      results.interruptedProjection = true;
    } else {
      console.log('  Preparing row not recoverable');
    }

    // Step 7: Reconcile balances against receipts
    console.log('\nStep 7: Reconcile balances against receipts');
    const reconciled = await _db.entities.Wallet.get(wallet.id);
    const ops = reconciled.ledger_operations || [];
    let calcBalance = 0;
    for (const op of ops) {
      const payload = JSON.parse(op.payload);
      const [type, amount] = payload;
      if (type === 'credit') calcBalance = _round2(calcBalance + amount);
      else if (type === 'debit') calcBalance = _round2(calcBalance - amount);
    }
    calcBalance = _round2(calcBalance + 1000);

    console.log(`  Stored balance: ${reconciled.balance_usd}`);
    console.log(`  Calculated from receipts: ${calcBalance}`);
    console.log(`  Ledger revision: ${reconciled.ledger_revision}`);
    console.log(`  Operations count: ${ops.length}`);

    if (Math.abs(reconciled.balance_usd - calcBalance) <= _EPSILON) {
      console.log('  Balance reconciliation matches');
      results.reconciliation = true;
    } else {
      console.log('  Balance mismatch!');
    }

    // Cleanup test data
    console.log('\nCleaning up test data...');
    await _db.entities.Wallet.updateMany({ owner_type: 'test' }, { $set: { status: 'archived' } });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    for (const [key, passed] of Object.entries(results)) {
      console.log(`  ${passed ? 'PASS' : 'FAIL'} ${key}`);
    }

    const allPassed = Object.values(results).every(v => v);
    console.log(`\n${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}`);

    if (!allPassed) {
      console.log('\nStaging validation incomplete. Do not deploy to production.');
      process.exit(1);
    }

    console.log('\nStaging validation complete. Ready for production deployment.');

  } catch (error) {
    console.error('\nValidation error:', error);
    process.exit(1);
  }
}

runValidation();