import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for ticketAutomation
const TICKET_AUTOMATION_RATE_LIMIT_PER_HOUR = 60; // Allow 60 requests per hour for ticket automation
const RATE_WINDOW_MS = 3600 * 1000;

const fail = (error, status = 400) => addSecurityHeaders(Response.json({ error }, { status }));

const CATEGORIES = ['payment', 'order', 'delivery', 'product', 'refund', 'supplier', 'account', 'technical'];
const PRIORITY_MAP = {
  payment: 'high', delivery: 'high', refund: 'high',
  order: 'medium', supplier: 'medium', technical: 'medium',
  product: 'low', account: 'low',
};
const SLA_HOURS = { high: 4, medium: 24, low: 72 };

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return fail('Méthode non autorisée', 405);
    const base44 = createClientFromRequest(req);

    // Rate limiting for ticketAutomation
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[ticketAutomation] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "ticket_automation",
        limit: TICKET_AUTOMATION_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    // This reads and mutates support tickets across the whole platform — they
    // carry customer PII — so it is reserved to administrators.
    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);
    const user = gate.user;
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "ticket_automation",
        limit: TICKET_AUTOMATION_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    switch (action) {
      case 'auto-route': return autoRoute(db, body, user);
      case 'list': return listTickets(db, body);
      case 'escalate': return escalate(db, body, user);
      case 'sla-breach': return slaBreach(db);
      case 'stats': return stats(db);
      default: return fail('Action invalide');
    }
  } catch(e) {
    console.error('ticket-automation failed', e);
    return fail('Erreur serveur', 500);
  }
}

async function autoRoute(db, body, user) {
  const { ticket_id, category, subject, customer_email, order_number } = body;
  if (!ticket_id) return fail('ticket_id requis');
  if (!category || !CATEGORIES.includes(category)) return fail('Catégorie invalide', 400);

  const priority = PRIORITY_MAP[category] || 'medium';
  const sla_hours = SLA_HOURS[priority];
  const sla_deadline = new Date(Date.now() + sla_hours * 3600000).toISOString();
  const assigned_team = category === 'payment' || category === 'refund' ? 'finance'
    : category === 'delivery' ? 'logistics'
    : category === 'technical' ? 'tech'
    : category === 'supplier' ? 'operations'
    : 'support';

  const updates = {
    category, priority, sla_hours, sla_deadline, assigned_team,
    status: 'routed',
    routed_by: user.email,
    routed_at: new Date().toISOString(),
    auto_routed: true,
  };
  const ticket = await db.entities.SupportTicket.update(ticket_id, updates);
  await db.entities.Notification.create({
    tenant_id: body.tenant_id || '',
    tenant_owner_email: user.email,
    title: `Ticket ${ticket_id} routé vers ${assigned_team}`,
    message: `Catégorie: ${category} | Priorité: ${priority} | SLA: ${sla_hours}h`,
    type: 'support',
    audience: 'admin',
    order_number,
  });
  await db.entities.AuditLog.create({ action: 'ticket.auto_routed', actor: user.email, entity: 'SupportTicket', entity_id: ticket_id, reference: order_number, details: { category, priority, assigned_team } });
  return addSecurityHeaders(Response.json({ ticket, assigned_team, sla_deadline }));
}

async function listTickets(db, body) {
  const { status, assigned_team, priority } = body;
  const filters = {};
  if (status) filters.status = status;
  if (assigned_team) filters.assigned_team = assigned_team;
  if (priority) filters.priority = priority;
  const tickets = await db.entities.SupportTicket.filter(filters, '-created_date', 100).catch(() => []);
  return addSecurityHeaders(Response.json({ tickets }));
}

async function escalate(db, body, user) {
  const { ticket_id, reason } = body;
  if (!ticket_id) return fail('ticket_id requis');
  const ticket = await db.entities.SupportTicket.update(ticket_id, {
    priority: 'high',
    escalated: true,
    escalation_reason: reason || '',
    escalated_by: user.email,
    escalated_at: new Date().toISOString(),
  });
  await db.entities.AuditLog.create({ action: 'ticket.escalated', actor: user.email, entity: 'SupportTicket', entity_id: ticket_id, details: { reason } });
  return addSecurityHeaders(Response.json({ ticket }));
}

async function slaBreach(db) {
  const now = new Date().toISOString();
  const tickets = await db.entities.SupportTicket.filter({ status: { $nin: ['resolved', 'closed'] } }, '', 500).catch(() => []);
  const breached = tickets.filter((t) => {
    if (!t.sla_deadline) return false;
    return new Date(t.sla_deadline) < new Date(now);
  });
  for (const t of breached) {
    await db.entities.Notification.create({
      tenant_id: t.tenant_id || '',
      tenant_owner_email: t.tenant_owner_email || '',
      title: `SLA dépassé: ${t.ticket_id}`,
      message: `Priorité ${t.priority} - ${t.sla_hours}h SLA écoulé`,
      type: 'alert',
      audience: 'admin',
    });
  }
  return addSecurityHeaders(Response.json({ breached_count: breached.length, breached_tickets: breached.map((t) => t.id) }));
}

async function stats(db) {
  const tickets = await db.entities.SupportTicket.list('-created_date', 500).catch(() => []);
  const byStatus = {};
  const byPriority = {};
  const byTeam = {};
  for (const t of tickets) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byTeam[t.assigned_team || 'unassigned'] = (byTeam[t.assigned_team || 'unassigned'] || 0) + 1;
  }
  return addSecurityHeaders(Response.json({ total: tickets.length, by_status: byStatus, by_priority: byPriority, by_team: byTeam }));
}