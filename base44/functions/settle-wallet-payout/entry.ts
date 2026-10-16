import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { postWalletEntry } from '../../shared/walletLedger.ts';
import { addSecurityHeaders, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

const reply = (body: unknown, status = 200) => addSecurityHeaders(Response.json(body, { status }));

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    const client = createClientFromRequest(req);
    const auth = await requireAdmin(client);
    if (!auth.ok) return addSecurityHeaders(auth.response!);
    const db = client.asServiceRole;
    const limit = await checkRateLimit(db, auth.user.id || auth.user.email, {
      keyPrefix: 'settle_wallet_payout', limit: 60, windowMs: 3600000,
    });
    if (!limit.ok) return rateLimitErrorResponse(limit);
    const input = await req.json().catch(() => null);
    if (!input || typeof input.transactionId !== 'string' || !input.transactionId.trim() || typeof input.approve !== 'boolean') {
      return reply({ error: 'Invalid payout decision' }, 400);
    }
    let tx = await db.entities.WalletTransaction.get(input.transactionId);
    if (!tx || tx.type !== 'PAYOUT' || tx.direction !== 'debit') return reply({ error: 'Payout not found' }, 404);
    const decision = input.approve ? 'approve' : 'reject';
    const finalStatus = input.approve ? 'posted' : 'reversed';
    if (tx.payout_decision && tx.payout_decision !== decision) return reply({ error: 'Conflicting payout decision' }, 409);
    if (tx.status === finalStatus) return reply({ transaction: tx, duplicate: true });
    if (tx.status !== 'pending') return reply({ error: 'Payout is not pending' }, 409);

    // Persist intent before applying the refund; opposite decisions cannot race.
    if (!tx.payout_decision) {
      const claim = await db.entities.WalletTransaction.updateMany(
        { id: tx.id, status: 'pending', payout_decision: { $exists: false } },
        { $set: { payout_decision: decision, payout_actor: auth.user.email } },
      );
      if (claim?.updated !== 0 && claim?.updated !== 1) throw new Error('payout_claim_unknown');
      tx = await db.entities.WalletTransaction.get(tx.id);
      if (tx.payout_decision !== decision) return reply({ error: 'Conflicting payout decision' }, 409);
    }
    if (!input.approve) {
      const wallet = await db.entities.Wallet.get(tx.wallet_id);
      if (!wallet) throw new Error('wallet_missing');
      const result = await postWalletEntry(db, wallet, {
        type: 'REFUND', direction: 'credit', amount: tx.amount_usd,
        idempotencyKey: `payout-rejection:${tx.id}`, reference: tx.id,
        description: 'Retrait refusé — montant recrédité',
      });
      if (!result.ok && result.reason !== 'duplicate') return reply({ error: result.reason }, 409);
    }
    // Audit failures remain visible and retryable; no silent loss of the trail.
    await db.entities.AuditLog.create({
      action: input.approve ? 'payout.paid' : 'payout.rejected', actor: tx.payout_actor || auth.user.email,
      entity: 'WalletTransaction', entity_id: tx.id, reference: tx.reference,
      details: { amount_usd: tx.amount_usd, decision },
    });
    await db.entities.WalletTransaction.updateMany(
      { id: tx.id, status: 'pending', payout_decision: decision }, { $set: { status: finalStatus } },
    );
    const transaction = await db.entities.WalletTransaction.get(tx.id);
    if (transaction?.status !== finalStatus) throw new Error('payout_finalize_failed');
    return reply({ transaction });
  } catch (error) {
    console.error('settle-wallet-payout:', error);
    return reply({ error: 'Payout decision could not be completed; retry the same decision.' }, 500);
  }
}