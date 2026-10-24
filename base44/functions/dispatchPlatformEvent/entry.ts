import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { planForEvent, buildNotifications } from '../../shared/events.ts';
import { notify, openTicket, recordUsage } from '../../shared/workflowSupport.ts';
import { addSecurityHeaders, checkRateLimit, rateLimitErrorResponse, getClientKey } from '../../shared/securityHeaders.ts';

/**
 * Dispatcher d'événements plateforme.
 *
 * Un seul point d'entrée pour tout ce que la plateforme doit enregistrer, notifier
 * et automatiser : le catalogue de règles vit dans base44/shared/events.ts.
 * Accepte les deux formes d'appel utilisées par l'app :
 *   - { name, options: { ... } }  (place-order, src/lib/events.js)
 *   - { name, category, source, ... }  (workflows)
 */

const RATE_LIMIT_PER_HOUR = 120;
const RATE_WINDOW_MS = 3600 * 1000;

const NOTIFICATION_TYPE = { order: 'order', account: 'system', seller: 'system', catalogue: 'system', risk: 'system', system: 'system' };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return addSecurityHeaders(Response.json({ error: 'Authentification requise' }, { status: 401 }));
    const db = base44.asServiceRole;

    // Les appels anonymes (workflows, tâches planifiées) portent l'identité admin :
    // seule une émission venue d'un simple utilisateur est plafonnée.
    if (String(user.role || '') !== 'admin') {
      const limit = await checkRateLimit(db, getClientKey(req) || 'unidentified', {
        keyPrefix: 'dispatch_platform_event',
        limit: RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      });
      if (!limit.ok) return addSecurityHeaders(rateLimitErrorResponse(limit));
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    if (!name) return addSecurityHeaders(Response.json({ error: 'name requis' }, { status: 400 }));

    const o = body.options && typeof body.options === 'object' ? body.options : body;
    const ctx = {
      name,
      category: String(o.category || '').trim(),
      severity: String(o.severity || '').trim(),
      source: String(o.source || '').trim(),
      sourceId: String(o.source_id || o.sourceId || '').trim(),
      reference: String(o.reference || '').trim(),
      actorEmail: String(o.actor_email || o.actorEmail || user.email || '').trim(),
      actorName: String(o.actor_name || o.actorName || user.full_name || '').trim(),
      description: String(o.description || '').trim(),
      payload: o.payload && typeof o.payload === 'object' ? o.payload : {},
      tenantId: String(o.tenant_id || o.tenantId || '').trim(),
      tenantOwnerEmail: String(o.tenant_owner_email || o.tenantOwnerEmail || '').trim(),
    };

    const plan = planForEvent(name, ctx.severity);
    const category = ctx.category || plan.category;

    const event = await db.entities.PlatformEvent.create({
      name,
      category,
      severity: plan.severity,
      source: ctx.source,
      source_id: ctx.sourceId,
      reference: ctx.reference,
      actor_email: ctx.actorEmail,
      actor_name: ctx.actorName,
      tenant_id: ctx.tenantId,
      tenant_owner_email: ctx.tenantOwnerEmail,
      description: ctx.description,
      payload: ctx.payload,
      status: 'received',
      actions: [],
    });

    // Notifications déclarées par la règle de l'événement.
    const planned = buildNotifications(ctx, plan);
    const notificationResults = await Promise.all(planned.map((n) => notify(db, {
      audience: n.audience,
      title: n.title,
      message: n.message,
      type: NOTIFICATION_TYPE[category] || 'system',
      reference: ctx.reference,
      tenantId: ctx.tenantId,
      tenantOwnerEmail: ctx.tenantOwnerEmail,
    })));

    // Étapes automatiques de la règle.
    const actions = [];
    for (const step of plan.automate || []) {
      try {
        if (step === 'open_support_ticket') {
          const ticket = await openTicket(db, {
            subject: ctx.description || `Événement ${name}`,
            category: 'other',
            priority: 'high',
            customerName: ctx.actorName,
            customerEmail: ctx.actorEmail,
            reference: ctx.reference,
            description: ctx.description || `Événement ${name} (${ctx.source})`,
            tenantId: ctx.tenantId,
            tenantOwnerEmail: ctx.tenantOwnerEmail,
          });
          actions.push({ step, ok: true, ticket_number: ticket?.ticket_number || '' });
        } else if (step === 'record_usage_event') {
          await recordUsage(db, {
            name,
            description: ctx.description || `Événement ${name}`,
            metadata: { source: ctx.source, reference: ctx.reference, category },
            tenantId: ctx.tenantId,
          });
          actions.push({ step, ok: true });
        } else {
          actions.push({ step, ok: false, error: 'étape inconnue' });
        }
      } catch (error) {
        actions.push({ step, ok: false, error: String(error?.message || error).slice(0, 200) });
      }
    }

    await db.entities.PlatformEvent.update(event.id, {
      status: actions.some((a) => !a.ok) ? 'failed' : 'handled',
      handled_at: new Date().toISOString(),
      actions,
    });

    return addSecurityHeaders(Response.json({
      event_id: event.id,
      name,
      category,
      severity: plan.severity,
      known: plan.known,
      notifications: notificationResults.length,
      actions,
    }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}