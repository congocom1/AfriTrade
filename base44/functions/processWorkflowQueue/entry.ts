import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { STUCK_AFTER_MS, listStuckExecutions, resumeExecution, startWorkflow } from '../../shared/workflow.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';
import { recoveryDecision } from '../../shared/workflowRecovery.ts';

/**
 * WORKFLOW QUEUE RUNNER — the background job behind every long-running
 * workflow (scheduled from the "Workflow Queue Runner" automation):
 *
 *   1. executions that never finished are timed out and dead-lettered;
 *   2. failed executions whose backoff has elapsed are retried, up to their
 *      attempt ceiling — the retry resumes at the failed step, never restarts
 *      the work already done;
 *   3. overdue subscriptions enter the dunning workflow (reminder → grace →
 *      past due → suspension, data always preserved).
 *
 * Each pass is bounded, so one slow workflow can never starve the others.
 */

const MAX_PER_RUN = 5;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    await req.json().catch(() => ({}));

    // Scheduled automation and administrators must use an authenticated
    // identity. In particular, rejected calls must NOT write audit rows with
    // service-role privileges (that exposed a database-spam path).
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);

    const now = Date.now();
    const summary = { timed_out: [], retried: [], held_for_review: [], dunning: [] };

    // 1. Timed out.
    const stuck = await listStuckExecutions(base44, STUCK_AFTER_MS);
    for (const execution of stuck.slice(0, MAX_PER_RUN)) {
      await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
        status: 'FAILED',
        error: 'Délai dépassé — exécution interrompue',
        dead_letter: true,
        completed_at: new Date().toISOString(),
      });
      summary.timed_out.push(execution.execution_number || execution.id);
    }

    // 2. Retries whose backoff elapsed.
    const failed = await base44.asServiceRole.entities.WorkflowExecution
      .filter({ status: 'FAILED' }, '-completed_at', 50);
    for (const execution of failed) {
      if (summary.retried.length >= MAX_PER_RUN) break;
      const decision = recoveryDecision(execution, now);
      if (!decision.eligible) {
        if (decision.reason === 'manual_reconciliation_required') {
          summary.held_for_review.push(execution.execution_number || execution.id);
        }
        continue;
      }
      const result = await resumeExecution(base44, execution.id, { inputPatch: {} });
      summary.retried.push({ execution: execution.execution_number || execution.id, status: result.status || 'unknown' });
    }

    // 3. Dunning for overdue subscriptions.
    const subscriptions = await base44.asServiceRole.entities.Subscription
      .filter({ status: 'past_due' }, '-updated_date', 20);
    for (const subscription of subscriptions.slice(0, MAX_PER_RUN)) {
      const result = await startWorkflow(base44, {
        code: 'subscription_dunning',
        input: { subscription_id: subscription.id, tenant_id: subscription.tenant_id, reference: subscription.id },
        tenantId: subscription.tenant_id || '',
        tenantOwnerEmail: subscription.owner_email || '',
        trigger: 'schedule',
        actorEmail: 'scheduler',
      });
      summary.dunning.push({ subscription_id: subscription.id, status: result.status || (result.duplicate ? 'DUPLICATE' : 'unknown') });
    }

    return addSecurityHeaders(Response.json({
      ok: true,
      ...summary,
      counts: { timed_out: summary.timed_out.length, retried: summary.retried.length, held_for_review: summary.held_for_review.length, dunning: summary.dunning.length },
    }));
  } catch (error) {
    console.error('[processWorkflowQueue] failed', { failure: error instanceof Error ? error.name : 'unknown' });
    return addSecurityHeaders(Response.json({ error: 'Workflow queue unavailable' }, { status: 503, headers: { 'Retry-After': '120', 'Cache-Control': 'no-store' } }));
  }
}