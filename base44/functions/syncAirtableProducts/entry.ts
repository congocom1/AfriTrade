import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/security.ts';
import { syncAirtableSource } from '../../shared/airtableSync.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

const SYNC_AIRTABLE_RATE_LIMIT_PER_HOUR = 30;
const RATE_WINDOW_MS = 3600 * 1000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);

    const db = base44.asServiceRole;
    const clientKey = getClientKey(req);
    const rateLimit = await checkRateLimit(db, clientKey || 'unidentified', {
      keyPrefix: 'sync_airtable_products',
      limit: SYNC_AIRTABLE_RATE_LIMIT_PER_HOUR,
      windowMs: RATE_WINDOW_MS,
    });
    if (!rateLimit.ok) return rateLimitErrorResponse(rateLimit);

    const body = await req.json().catch(() => ({}));
    const Source = db.entities.AirtableSource;
    const sources = body.source_id
      ? [await Source.get(body.source_id)]
      : await Source.filter({ active: true }, 'name', 100);

    const { accessToken } = await db.connectors.getConnection('airtable');
    const Log = db.entities.InventorySyncLog;
    const trigger = body.trigger === 'manual' ? 'manual' : 'scheduled';
    const results = [];

    for (const source of sources) {
      const now = new Date().toISOString();
      const t0 = Date.now();
      try {
        const r = await syncAirtableSource(base44, source, accessToken);
        await Source.update(source.id, {
          last_synced_at: now,
          last_status: 'success',
          last_error: '',
          last_rows: r.rows,
          last_updated: r.updated,
          last_created: r.created,
          last_unmatched: r.unmatched,
        });
        await Log.create({
          source_id: source.id,
          source_name: source.name,
          trigger,
          status: 'success',
          rows: r.rows,
          updated: r.updated + r.created,
          unmatched_count: r.unmatched.length,
          description: `${r.created} nouveau(x) produit(s)`,
          duration_ms: Date.now() - t0,
        });
        results.push({ id: source.id, name: source.name, ok: true, ...r });
      } catch (e) {
        await Source.update(source.id, { last_synced_at: now, last_status: 'failed', last_error: e.message });
        await Log.create({ source_id: source.id, source_name: source.name, trigger, status: 'failed', error: e.message, duration_ms: Date.now() - t0 });
        results.push({ id: source.id, name: source.name, ok: false, error: e.message });
      }
    }

    return addSecurityHeaders(Response.json({ synced: results.length, results }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}