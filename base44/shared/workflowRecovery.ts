/** Pure eligibility gate for the custom WorkflowExecution queue.
 * Managed Base44 JSONC automations are separate and require provider validation.
 */
export function recoveryDecision(execution, now = Date.now()) {
  if (!execution || execution.status !== 'FAILED' || execution.dead_letter) return { eligible: false, reason: 'not_retryable_state' };
  const attempts = Number(execution.attempts);
  const maximum = Number(execution.max_attempts);
  if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(maximum) || maximum < 1 || attempts >= maximum) {
    return { eligible: false, reason: 'attempt_limit_or_invalid' };
  }
  // Unknown or missing retry timestamps must not trigger immediate replay.
  if (!execution.next_retry_at) return { eligible: false, reason: 'missing_retry_schedule' };
  const dueAt = Date.parse(execution.next_retry_at);
  if (!Number.isFinite(dueAt)) return { eligible: false, reason: 'invalid_retry_schedule' };
  if (dueAt > now) return { eligible: false, reason: 'not_due' };
  // Side effects across most workflow definitions are not atomic. A timeout
  // or provider 503 can mean a payment/email was accepted before the failure.
  // Automatic replay remains opt-in after each workflow's idempotency is tested.
  const approved = new Set();
  if (!approved.has(execution.workflow_code)) return { eligible: false, reason: 'manual_reconciliation_required' };
  return { eligible: true, reason: 'due' };
}

export function stuckDecision(execution, now = Date.now(), timeoutMs = 15 * 60 * 1000) {
  if (!execution || !['RUNNING','RETRYING'].includes(execution.status)) return false;
  const timestamp = Date.parse(execution.started_at || '');
  return Number.isFinite(timestamp) && timestamp <= now - timeoutMs;
}
