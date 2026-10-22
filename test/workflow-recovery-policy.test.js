import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recoveryDecision, stuckDecision } from '../base44/shared/workflowRecovery.ts';

const now = Date.parse('2026-10-22T12:00:00Z');
const failed = { status:'FAILED', attempts:1,max_attempts:3,dead_letter:false, workflow_code:'subscription_dunning',next_retry_at:'2026-10-22T11:00:00Z' };
describe('workflow recovery safety policy', () => {
  it('blocks automatic replay of a failed workflow with external side effects', () => {
    assert.deepEqual(recoveryDecision(failed, now), {eligible:false, reason:'manual_reconciliation_required'});
  });
  it('rejects attempts exhausted, stale state, invalid schedule and not-yet-due work', () => {
    assert.equal(recoveryDecision({...failed, attempts:3},now).reason,'attempt_limit_or_invalid');
    assert.equal(recoveryDecision({...failed, status:'COMPLETED'},now).reason,'not_retryable_state');
    assert.equal(recoveryDecision({...failed, next_retry_at:''},now).reason,'missing_retry_schedule');
    assert.equal(recoveryDecision({...failed, next_retry_at:'invalid'},now).reason,'invalid_retry_schedule');
    assert.equal(recoveryDecision({...failed, next_retry_at:'2026-10-22T13:00:00Z'},now).reason,'not_due');
  });
  it('flags only genuinely stuck running or retrying executions', () => {
    assert.equal(stuckDecision({status:'RUNNING',started_at:'2026-10-22T11:40:00Z'},now),true);
    assert.equal(stuckDecision({status:'RETRYING',started_at:'2026-10-22T11:40:00Z'},now),true);
    assert.equal(stuckDecision({status:'WAITING',started_at:'2026-10-22T11:00:00Z'},now),false);
    assert.equal(stuckDecision({status:'RUNNING'},now),false);
  });
});
