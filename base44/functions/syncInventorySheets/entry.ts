import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { requireAdmin } from '../../shared/security.ts';
import { syncSource } from '../../shared/inventorySheets.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration for syncInventorySheets
const SYNC_INVENTORY_SHEETS_RATE_LIMIT_PER_HOUR = 20; // Allow 20 requests per hour for inventory sync
const RATE_WINDOW_MS = 3600 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting for syncInventorySheets
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[syncInventorySheets] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "sync_inventory_sheets",
        limit: SYNC_INVENTORY_SHEETS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "sync_inventory_sheets",
        limit: SYNC_INVENTORY_SHEETS_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const body = await req.json().catch(() => ({}));
    const Source = db.entities.InventorySheetSource;
    const sources = body.source_id
      ? [await Source.get(body.source_id)]
      : await Source.filter({ active: true }, 'name', 100);

    const { accessToken } = await db.connectors.getConnection('googlesheets');
    const results = [];
    const Log = db.entities.InventorySyncLog;
    const trigger = body.trigger === 'manual' ? 'manual' : 'scheduled';
    for (const source of sources) {
      const now = new Date().toISOString();
      const t0 = Date.now();
      try {
        const r = await syncSource(base44, source, accessToken);
        await Source.update(source.id, {
          last_synced_at: now, last_status: 'success', last_error: '',
          last_rows: r.rows, last_updated: r.updated, last_unmatched: r.unmatched,
        });
        await Log.create({ source_id: source.id, source_name: source.name, trigger, status: 'success', rows: r.rows, updated: r.updated, unmatched_count: r.unmatched.length, duration_ms: Date.now() - t0 });
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