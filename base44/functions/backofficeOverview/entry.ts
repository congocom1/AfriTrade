import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for backofficeOverview (admin-only endpoint)
const BACKOFFICE_OVERVIEW_RATE_LIMIT_PER_HOUR = 20; // Lower limit for expensive admin operations
const RATE_WINDOW_MS = 3600 * 1000;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting for backofficeOverview
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[backofficeOverview] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "backoffice_overview",
        limit: BACKOFFICE_OVERVIEW_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const access = await requireAdmin(base44);
    if (!access.ok) return addSecurityHeaders(access.response);
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "backoffice_overview",
        limit: BACKOFFICE_OVERVIEW_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const [orders, tickets, executions, logs] = await Promise.all([
      base44.entities.Order.list('-created_date', 8),
      base44.entities.SupportTicket.list('-created_date', 8),
      base44.entities.WorkflowExecution.list('-created_date', 8),
      base44.entities.AuditLog.list('-created_date', 8),
    ]);
    return addSecurityHeaders(Response.json({
      orders: orders.map(o => ({ id: o.id, number: o.order_number, status: o.status, amount: o.total_usd, at: o.created_date })),
      tickets: tickets.map(t => ({ id: t.id, number: t.ticket_number, subject: t.subject, status: t.status, at: t.created_date })),
      executions: executions.map(e => ({ id: e.id, name: e.workflow_name || e.workflow_code, status: e.status, at: e.created_date })),
      logs: logs.map(l => ({ id: l.id, action: l.action, reference: l.reference, at: l.created_date })),
    }));
  } catch (error) {
    console.error('Back-office overview failed:', error);
    return addSecurityHeaders(Response.json({ error: 'Impossible de charger le back-office' }, { status: 500 }));
  }
}