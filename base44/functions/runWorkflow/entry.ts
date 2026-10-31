import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cancelExecution, listDefinitions, resumeExecution } from '../../shared/workflow.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

/**
 * Dashboard API for existing workflow engine actions.
 * Public HTTP endpoints are discoverable, so authenticate BEFORE service-role
 * access (including reads and cancellation). Never accept a caller-supplied
 * role, identity, workflow definition or service credential.
 */
const json = (payload: Record<string, unknown>, status = 200) => addSecurityHeaders(
  Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } }),
);

export default async function runWorkflow(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const base44 = createClientFromRequest(req);
  const auth = await requireAdmin(base44);
  if (!auth.ok) return addSecurityHeaders(auth.response);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Invalid request body' }, 400);
  }
  const action = String(body.action || '');
  if (!['list', 'retry', 'cancel'].includes(action)) {
    return json({ error: 'Unsupported workflow action' }, 400);
  }

  try {
    if (action === 'list') {
      const definitions = await listDefinitions(base44);
      return json({ ok: true, definitions });
    }

    const executionId = body.execution_id;
    if (typeof executionId !== 'string' || !executionId.trim() || executionId.length > 128) {
      return json({ error: 'Valid execution_id is required' }, 400);
    }

    if (action === 'cancel') {
      const reason = typeof body.reason === 'string' ? body.reason.slice(0, 300) : '';
      const result = await cancelExecution(base44, executionId, {
        reason,
        actorEmail: auth.user.email || '',
      });
      return json(result, result.ok ? 200 : 409);
    }

    const patch = body.input_patch === undefined ? {} : body.input_patch;
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' ||
        JSON.stringify(patch).length > 4096 ||
        ['__proto__', 'constructor', 'prototype'].some(key => Object.hasOwn(patch, key))) {
      return json({ error: 'Invalid workflow input patch' }, 400);
    }
    const result = await resumeExecution(base44, executionId, {
      inputPatch: patch,
      actorEmail: auth.user.email || '',
    });
    return json(result, result.ok ? 200 : 409);
  } catch (error) {
    // Workflow engine errors can contain internal state. Do not expose them to
    // the browser (including privileged operators) or leak provider secrets.
    console.error('runWorkflow action failed', {
      action,
      failure: error instanceof Error ? error.name : 'unknown',
    });
    return json({ error: 'Workflow operation failed' }, 500);
  }
}
