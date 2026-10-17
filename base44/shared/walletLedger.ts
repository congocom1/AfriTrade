/**
 * Balances and durable operation receipts change in one conditional Wallet update.
 * Requires atomic predicate + update semantics, to be verified on staging.
 * WalletTransaction is a recoverable projection, not the idempotency authority.
 */
export const EPSILON = 0.005;
export const MAX_WALLET_OPERATIONS = 1000;
const MAX_ATTEMPTS = 12;
export function round2(value: unknown): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}
export type WalletEntry = {
  type: string;
  direction?: "credit" | "debit";
  amount: number;
  status?: "posted" | "pending" | "reversed";
  description?: string;
  reference?: string;
  idempotencyKey: string;
  order_id?: string;
  order_number?: string;
  amount_cdf?: number;
  owner_type?: string;
  owner_name?: string;
  owner_email?: string;
  tenant_id?: string;
  tenant_owner_email?: string;
};
function snapshotQuery(wallet: any) {
  const query: Record<string, any> = { id: wallet.id };
  for (const field of ['ledger_revision', 'balance_usd', 'pending_usd', 'lifetime_credit_usd', 'lifetime_debit_usd']) {
    query[field] = wallet[field] === undefined ? { $exists: false } : wallet[field];
  }
  return query;
}
function fingerprint(entry: WalletEntry) {
  return JSON.stringify([
    entry.type, entry.direction || 'credit', round2(entry.amount), entry.status || 'posted',
    entry.order_id || '', entry.order_number || '', entry.reference || '', entry.amount_cdf || 0,
    entry.tenant_id || '', entry.tenant_owner_email || '', entry.owner_type || '', entry.owner_email || '',
  ]);
}
function history(wallet: any): any[] {
  const receipts = wallet.ledger_operations ?? [];
  if (!Array.isArray(receipts)) throw new Error('wallet_ledger_corrupt');
  return receipts;
}
async function finishProjection(db: any, wallet: any, receipt: any, duplicate: boolean) {
  // Only the candidate referenced by the wallet may become a visible movement.
  // Never overwrite later business transitions such as posted -> reversed.
  const result = await db.entities.WalletTransaction.updateMany(
    { id: receipt.transaction_id, status: 'preparing' },
    { $set: { status: receipt.status, balance_after_usd: receipt.balance_after_usd } },
  );
  if (result?.updated !== 0 && result?.updated !== 1) throw new Error('wallet_projection_unknown');
  const transaction = await db.entities.WalletTransaction.get(receipt.transaction_id);
  if (!transaction || transaction.status === 'preparing') throw new Error('wallet_projection_unavailable');
  if (duplicate) return { ok: false as const, reason: 'duplicate' as const, transaction };
  return { ok: true as const, wallet, transaction, balance_after_usd: receipt.balance_after_usd };
}

/** Atomic debit with held-funds check to prevent concurrent overspend.
 * This function ensures that a debit operation cannot succeed if funds are not available,
 * preventing multiple concurrent debits from exceeding the wallet balance.
 */
export async function atomicDebitWithHeldFunds(db: any, wallet: any, amount: number, idempotencyKey: string, metadata?: any): Promise<any> {
  const totalAmount = round2(amount);
  if (!Number.isFinite(totalAmount) || !(totalAmount > 0) || !Number.isSafeInteger(Math.round(totalAmount * 100))) {
    return { ok: false as const, reason: 'invalid_amount' as const };
  }
  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return { ok: false as const, reason: 'missing_idempotency_key' as const };
  }
  if (idempotencyKey.length > 240) return { ok: false as const, reason: 'invalid_idempotency_key' as const };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const current = await db.entities.Wallet.get(wallet.id);
    if (!current) return { ok: false as const, reason: 'wallet_missing' as const };

    // Check if this debit already exists and is valid
    const receipts = history(current);
    const existingReceipt = receipts.find(r => r.key === idempotencyKey);
    if (existingReceipt) {
      if (existingReceipt.status === 'posted' || existingReceipt.status === 'reversed') {
        return { ok: true as const, wallet: current, transaction: existingReceipt, balance_after_usd: existingReceipt.balance_after_usd };
      }
      return { ok: false as const, reason: 'duplicate' as const, transaction: existingReceipt };
    }

    // Check available funds for the debit
    const balance = Number(current.balance_usd ?? 0);
    const pending = Number(current.pending_usd ?? 0);
    const available = round2(balance - pending);

    if (totalAmount > available + EPSILON) {
      return { ok: false as const, reason: 'insufficient_funds' as const, available };
    }

    // Create a preparing transaction for the debit (holds the funds)
    const afterBalance = round2(balance - totalAmount);
    const candidate = await db.entities.WalletTransaction.create({
      wallet_id: wallet.id, tenant_id: wallet.tenant_id, tenant_owner_email: wallet.tenant_owner_email,
      owner_type: wallet.owner_type, owner_name: wallet.owner_name, owner_email: wallet.owner_email,
      type: 'withdrawal', direction: 'debit', amount_usd: totalAmount, amount_cdf: 0,
      balance_after_usd: afterBalance, currency: 'USD', description: 'Debit with held funds',
      reference: metadata?.reference || '', order_id: metadata?.order_id || '', order_number: metadata?.order_number || '',
      idempotency_key: idempotencyKey, status: 'pending', metadata: metadata || null,
    });

    if (!candidate?.id) throw new Error('wallet_candidate_missing');

    // Update wallet with pending balance and the transaction operation
    const operation = {
      key: idempotencyKey, payload: JSON.stringify(['withdrawal', totalAmount]),
      transaction_id: candidate.id, status: 'pending', balance_after_usd: afterBalance,
    };

    const update = {
      balance_usd: afterBalance,
      pending_usd: round2(pending + totalAmount),
      lifetime_debit_usd: round2((current.lifetime_debit_usd || 0) + totalAmount),
      ledger_revision: (current.ledger_revision || 0) + 1,
      ledger_operations: [...receipts, operation],
    };

    const result = await db.entities.Wallet.updateMany(snapshotQuery(current), { $set: update });

    if (result?.updated === 1) {
      return finishProjection(db, { ...current, ...update }, operation, false);
    }
    if (result?.updated !== 0) throw new Error('wallet_update_unknown');
  }

  return { ok: false as const, reason: 'wallet_busy' as const };
}

/** Release held funds for a debit operation once it's confirmed. */
export async function releaseHeldFunds(db: any, wallet: any, amount: number, idempotencyKey: string): Promise<any> {
  const totalAmount = round2(amount);
  if (!Number.isFinite(totalAmount) || !(totalAmount > 0) || !Number.isSafeInteger(Math.round(totalAmount * 100))) {
    throw new Error('invalid_amount');
  }
  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 240) {
    throw new Error('missing_idempotency_key');
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const current = await db.entities.Wallet.get(wallet.id);
    if (!current) throw new Error('wallet_missing');

    const receipts = history(current);
    const receipt = receipts.find(r => r.key === idempotencyKey);
    if (!receipt || receipt.status !== 'pending') {
      return { ok: true as const, wallet: current, released: true };
    }

    const pending = Number(current.pending_usd ?? 0);
    if (pending < totalAmount - EPSILON) {
      throw new Error('insufficient_pending');
    }

    // Update to finalize the transaction and release the hold
    const afterBalance = round2(Number(current.balance_usd ?? 0) - totalAmount);
    const operation = {
      key: idempotencyKey, payload: JSON.stringify(['withdrawal', totalAmount]),
      transaction_id: receipt.transaction_id, status: 'posted', balance_after_usd: afterBalance,
    };

    const update = {
      balance_usd: afterBalance,
      pending_usd: round2(pending - totalAmount),
      ledger_revision: (current.ledger_revision || 0) + 1,
      ledger_operations: [...receipts.filter(r => r.key !== idempotencyKey), operation],
    };

    const result = await db.entities.Wallet.updateMany(snapshotQuery(current), { $set: update });
    if (result?.updated === 1) {
      const finalTransaction = await db.entities.WalletTransaction.get(receipt.transaction_id);
      return { ok: true as const, wallet: { ...current, ...update }, transaction: finalTransaction, balance_after_usd: afterBalance };
    }
    if (result?.updated !== 0) throw new Error('wallet_update_unknown');
  }

  throw new Error('wallet_busy');
}
/** Infrastructure/ambiguous-write errors throw. Retry with the SAME key. */
export async function postWalletEntry(db: any, wallet: any, entry: WalletEntry) {
  const amount = round2(entry.amount);
  if (!Number.isFinite(amount) || !(amount > 0) || !Number.isSafeInteger(Math.round(amount * 100))) {
    return { ok: false as const, reason: 'invalid_amount' as const };
  }
  if (typeof entry.idempotencyKey !== 'string' || !entry.idempotencyKey.trim()) {
    return { ok: false as const, reason: 'missing_idempotency_key' as const };
  }
  if (entry.idempotencyKey.length > 240) return { ok: false as const, reason: 'invalid_idempotency_key' as const };
  if (entry.direction !== undefined && !['credit', 'debit'].includes(entry.direction)) {
    return { ok: false as const, reason: 'invalid_direction' as const };
  }
  const direction = entry.direction || 'credit';
  const payload = fingerprint(entry);
  let candidate: any;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const current = await db.entities.Wallet.get(wallet.id);
    if (!current) return { ok: false as const, reason: 'wallet_missing' as const };
    const receipts = history(current);
    const receipt = receipts.find(r => r.key === entry.idempotencyKey);
    if (receipt) {
      if (receipt.payload !== payload) return { ok: false as const, reason: 'idempotency_conflict' as const };
      return finishProjection(db, current, receipt, true);
    }
    // Pre-protocol ledger compatibility. Lookup failures must fail closed.
    const existing = await db.entities.WalletTransaction.filter({
      wallet_id: wallet.id, idempotency_key: entry.idempotencyKey, status: { $ne: 'preparing' },
    });
    if (existing.length) {
      const tx = existing[0];
      if (tx.type !== entry.type || tx.direction !== direction || round2(tx.amount_usd) !== amount ||
          (tx.order_id || '') !== (entry.order_id || '') || (tx.reference || '') !== (entry.reference || '')) {
        return { ok: false as const, reason: 'idempotency_conflict' as const };
      }
      return { ok: false as const, reason: 'duplicate' as const, transaction: tx };
    }
    if (receipts.length >= MAX_WALLET_OPERATIONS) return { ok: false as const, reason: 'ledger_capacity' as const };
    const balance = Number(current.balance_usd ?? 0);
    const pending = Number(current.pending_usd ?? 0);
    if (![balance, pending].every(Number.isFinite) || pending < 0) throw new Error('wallet_balance_invalid');
    const available = round2(balance - pending);
    if (direction === 'debit' && round2(amount - available) > EPSILON) {
      return { ok: false as const, reason: 'insufficient_funds' as const, available };
    }
    const afterBalance = round2(balance + (direction === 'credit' ? amount : -amount));
    if (!Number.isSafeInteger(Math.round(afterBalance * 100))) throw new Error('wallet_balance_invalid');
    // A failed/ambiguous create happens BEFORE any money changes. Orphan preparing
    // rows must not be counted as transactions; do not delete ambiguous candidates.
    if (!candidate) candidate = await db.entities.WalletTransaction.create({
      wallet_id: wallet.id, tenant_id: entry.tenant_id ?? current.tenant_id ?? '',
      tenant_owner_email: entry.tenant_owner_email ?? current.tenant_owner_email ?? '',
      owner_type: entry.owner_type ?? current.owner_type, owner_name: entry.owner_name ?? current.owner_name,
      owner_email: entry.owner_email ?? current.owner_email ?? '', type: entry.type, direction,
      amount_usd: amount, amount_cdf: entry.amount_cdf ?? 0, balance_after_usd: afterBalance,
      currency: 'USD', description: entry.description || '', reference: entry.reference || '',
      order_id: entry.order_id || '', order_number: entry.order_number || '',
      idempotency_key: entry.idempotencyKey, status: 'preparing',
    });
    if (!candidate?.id) throw new Error('wallet_candidate_missing');
    const operation = { key: entry.idempotencyKey, payload, transaction_id: candidate.id,
      status: entry.status || 'posted', balance_after_usd: afterBalance };
    const update = {
      balance_usd: afterBalance,
      pending_usd: round2(pending + (direction === 'credit' && entry.status === 'pending' ? amount : 0)),
      lifetime_credit_usd: round2((current.lifetime_credit_usd || 0) + (direction === 'credit' ? amount : 0)),
      lifetime_debit_usd: round2((current.lifetime_debit_usd || 0) + (direction === 'debit' ? amount : 0)),
      ledger_revision: (current.ledger_revision || 0) + 1, ledger_operations: [...receipts, operation],
    };
    const result = await db.entities.Wallet.updateMany(snapshotQuery(current), { $set: update });
    // Unknown outcome: never compensate or blindly reapply. Receipt resolves retries.
    if (result?.updated === 1) return finishProjection(db, { ...current, ...update }, operation, false);
    if (result?.updated !== 0) throw new Error('wallet_update_unknown');
  }
  return { ok: false as const, reason: 'wallet_busy' as const };
}
/** Release a hold once per wallet-scoped key. Never changes the balance. */
export async function releasePending(db: any, wallet: any, amount: unknown, idempotencyKey: string) {
  const value = round2(amount);
  if (!Number.isFinite(value) || !(value > 0)) throw new Error('invalid_amount');
  if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 240) {
    throw new Error('missing_idempotency_key');
  }
  const payload = JSON.stringify(['release', value]);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const current = await db.entities.Wallet.get(wallet.id);
    if (!current) throw new Error('wallet_missing');
    const receipts = history(current);
    const receipt = receipts.find(r => r.key === idempotencyKey);
    if (receipt) {
      if (receipt.payload !== payload) throw new Error('idempotency_conflict');
      return current;
    }
    if (receipts.length >= MAX_WALLET_OPERATIONS) throw new Error('ledger_capacity');
    const pending = Number(current.pending_usd ?? 0);
    if (!Number.isFinite(pending) || round2(value - pending) > EPSILON) throw new Error('insufficient_pending');
    const update = { pending_usd: round2(pending - value), ledger_revision: (current.ledger_revision || 0) + 1,
      ledger_operations: [...receipts, { key: idempotencyKey, payload }] };
    const result = await db.entities.Wallet.updateMany(snapshotQuery(current), { $set: update });
    if (result?.updated === 1) return { ...current, ...update };
    if (result?.updated !== 0) throw new Error('wallet_update_unknown');
  }
  throw new Error('wallet_busy');
}
