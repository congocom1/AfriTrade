import { base44 } from '@/api/base44Client';

/** UI labels (French) → server method ids. */
export const WITHDRAWAL_METHOD_IDS = {
  'M-Pesa': 'mpesa',
  'Airtel Money': 'airtel',
  'Orange Money': 'orange',
  'Virement bancaire': 'bank',
  mpesa: 'mpesa',
  airtel: 'airtel',
  orange: 'orange',
  bank: 'bank',
};

/**
 * Debits a wallet through the `request-withdrawal` server function, which
 * enforces ownership, an allowlisted method, and available-balance coverage.
 * `requestId` identifies ONE user intent: keep it stable across retries of the
 * same submission so the server dedupes a retry instead of debiting twice.
 * Returns the updated wallet.
 */
export async function requestWithdrawal({ wallet, amount, method, account, requestId }) {
  const res = await base44.functions.invoke('request-withdrawal', {
    wallet_id: wallet.id,
    amount,
    method: WITHDRAWAL_METHOD_IDS[method] || String(method || '').toLowerCase(),
    account: account || '',
    request_id: requestId || `${wallet.id}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`,
  });
  if (!res?.data?.wallet) {
    throw new Error(res?.data?.error || 'Retrait impossible pour le moment.');
  }
  return res.data.wallet;
}