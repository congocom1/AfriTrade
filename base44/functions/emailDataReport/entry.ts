import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';
import {
  buildCsv,
  dedupeById,
  escapeHtml,
  frenchDate,
  toBase64,
  typeLabel,
} from '../../shared/dataRequests.ts';

// Rate limiting configuration for emailDataReport
const EMAIL_DATA_REPORT_RATE_LIMIT_PER_HOUR = 10; // Allow 10 requests per hour (restrictive for data export)
const RATE_WINDOW_MS = 3600 * 1000;

/**
 * Step 3: the compliance team moved the request to "ready", so the data report
 * goes out to the requester — a readable summary in the e-mail plus a CSV
 * attachment for portability.
 *
 * Everything is matched on the identifiers the person gave us (e-mail, phone),
 * never on a name alone.
 */

const LIMIT = 200;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // This report carries a person's whole purchase history. Require an
    // administrator before parsing input, reading data, or consuming a slot.
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);

    // The client address keys the rate limit counter. It is only read once the
    // administrator check above has passed, so a rejected caller never burns a slot.
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[emailDataReport] no client address on the request — applying shared rate limit",
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.request_id || '').trim();
    if (!requestId) return addSecurityHeaders(Response.json({ error: 'request_id is required' }, { status: 400 }));

    // The cap is applied against the service-role client, so every call is counted
    // — a check without a database would silently count nothing.
    const rateLimitResultDb = await checkRateLimit(
      base44.asServiceRole,
      clientKey || "unidentified",
      {
        keyPrefix: "email_data_report",
        limit: EMAIL_DATA_REPORT_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
        failClosed: true,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const service = base44.asServiceRole;
    const request = await service.entities.DataRequest.get(requestId);
    if (!request) return Response.json({ error: 'DataRequest not found' }, { status: 404 });
    if (request.report_sent_at) return Response.json({ skipped: true, reason: 'report already sent' });
    if (request.status !== 'ready') return addSecurityHeaders(Response.json({ error: 'Data request is not ready for export' }, { status: 409 }));
    // A send interrupted after the provider accepts it must not be repeated blindly.
    if (['sending', 'delivery_unknown'].includes(String(request.email_status || ''))) {
      return addSecurityHeaders(Response.json({ error: 'Delivery outcome requires compliance review' }, { status: 409 }));
    }

    const reference = request.request_number || requestId;
    const email = String(request.email || '').trim();
    const phone = String(request.phone || '').trim();

    if (!email) {
      await service.entities.DataRequest.update(requestId, {
        email_status: 'skipped',
        email_error: 'Aucune adresse e-mail fournie',
      });
      return Response.json({ skipped: true, reason: 'no email address on the request' });
    }

    const [byEmail, byPhone, returns, disputes, requests] = await Promise.all([
      email ? service.entities.Order.filter({ customer_email: email }, '-created_date', LIMIT) : [],
      phone ? service.entities.Order.filter({ customer_phone: phone }, '-created_date', LIMIT) : [],
      phone ? service.entities.Return.filter({ customer_phone: phone }, '-created_date', LIMIT) : [],
      phone ? service.entities.Dispute.filter({ customer_phone: phone }, '-created_date', LIMIT) : [],
      email ? service.entities.DataRequest.filter({ email }, '-created_date', 50) : [],
    ]);
    const orders = dedupeById([...byEmail, ...byPhone]);

    const rows = [
      ...orders.map((o) => ['Commande', o.order_number || '', frenchDate(o.created_date), `${o.status || ''} · ${(o.items || []).length} article(s)`, o.total_usd ?? '']),
      ...returns.map((r) => ['Retour', r.return_number || r.order_number || '', frenchDate(r.created_date), `${r.product_title || ''} — ${r.reason || ''} (${r.status || ''})`, r.refund_amount_usd ?? '']),
      ...disputes.map((d) => ['Litige', d.order_number || '', frenchDate(d.created_date), `${d.type || ''} (${d.status || ''})`, d.amount_usd ?? '']),
      ...requests.map((r) => ['Demande', r.request_number || '', frenchDate(r.created_date), `${typeLabel(r.type)} (${r.status || ''})`, '']),
    ];
    const csv = buildCsv(['type', 'reference', 'date', 'details', 'montant_usd'], rows);

    const list = (items, render) =>
      items.length
        ? `<ul style="margin:6px 0 16px;padding-left:18px">${items.map((item) => `<li>${render(item)}</li>`).join('')}</ul>`
        : '<p style="margin:6px 0 16px;color:#666;font-size:13px">Aucune donnée.</p>';

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6">
        <p>Bonjour ${escapeHtml(request.name || '')},</p>
        <p>Voici le rapport des données personnelles que nous détenons à votre sujet, en réponse à votre demande
          <strong>${escapeHtml(reference)}</strong> (${escapeHtml(typeLabel(request.type))}).</p>
        <h2 style="font-size:15px;margin-top:20px">Vos commandes (${orders.length})</h2>
        ${list(orders, (o) => `${escapeHtml(o.order_number || '')} — ${escapeHtml(frenchDate(o.created_date))} — ${escapeHtml(o.status || '')} — ${escapeHtml(o.total_usd ?? 0)} USD`)}
        <h2 style="font-size:15px">Vos demandes de retour (${returns.length})</h2>
        ${list(returns, (r) => `${escapeHtml(r.return_number || r.order_number || '')} — ${escapeHtml(r.product_title || '')} — ${escapeHtml(r.status || '')}`)}
        <h2 style="font-size:15px">Vos litiges (${disputes.length})</h2>
        ${list(disputes, (d) => `${escapeHtml(d.order_number || '')} — ${escapeHtml(d.type || '')} — ${escapeHtml(d.status || '')}`)}
        <h2 style="font-size:15px">Vos demandes relatives aux données (${requests.length})</h2>
        ${list(requests, (r) => `${escapeHtml(r.request_number || '')} — ${escapeHtml(typeLabel(r.type))} — ${escapeHtml(r.status || '')}`)}
        <p style="font-size:13px;color:#555">Le fichier CSV joint reprend ces lignes sous forme exploitable.</p>
        <p style="font-size:13px;color:#555">L'équipe conformité — AfriTrade</p>
      </div>
    `;

    const text = [
      `Bonjour ${request.name || ''},`.trim(),
      '',
      `Voici le rapport des données personnelles que nous détenons à votre sujet (demande ${reference}).`,
      '',
      `Commandes : ${orders.length}`,
      `Demandes de retour : ${returns.length}`,
      `Litiges : ${disputes.length}`,
      `Demandes relatives aux données : ${requests.length}`,
      '',
      'Le fichier CSV joint reprend ces lignes sous forme exploitable.',
      '',
      "L'équipe conformité — AfriTrade",
    ].join('\n');

    const filename = `rapport-donnees-${String(reference).replace(/[^A-Za-z0-9-]/g, '')}.csv`;

    // Durable attempt marker: a crash or timeout must prompt review, not a blind resend.
    await service.entities.DataRequest.update(requestId, { email_status: 'sending', email_error: '' });
    try {
      await service.integrations.Core.SendEmail({
        to: email,
        subject: `Votre rapport de données — ${reference}`,
        html,
        text,
        from_name: 'AfriTrade',
        attachments: [{ filename, content: toBase64(csv) }],
      });
      // Mark accepted delivery before any unrelated audit write. If this update fails,
      // `sending` remains and the next run requires review instead of duplicating mail.
    } catch (error) {
      const status = Number(error?.status || error?.statusCode || error?.response?.status || 0);
      const retryable = status === 429; // 503 may have occurred after mail acceptance: require human review
      await service.entities.DataRequest.update(requestId, {
        email_status: retryable ? 'failed' : 'delivery_unknown',
        email_error: String(error?.message || error).slice(0, 500),
      });
      await service.entities.AuditLog.create({
        action: 'privacy.report_failed',
        actor: 'system',
        entity: 'DataRequest',
        entity_id: requestId,
        reference,
        severity: 'warning',
        details: { error: String(error?.message || error).slice(0, 300) },
      });
      return addSecurityHeaders(Response.json({ sent: false, retryable, reason: 'email delivery failed; review delivery ledger', rows: rows.length }, { status: retryable ? status : 503, headers: { 'Retry-After': retryable ? '120' : '3600', 'Cache-Control': 'no-store' } }));
    }

    // If this write fails after provider acceptance, the sending marker remains
    // and recovery must be handled by compliance (not an automatic re-send).
    await service.entities.DataRequest.update(requestId, {
      status: 'completed',
      report_sent_at: new Date().toISOString(),
      email_status: 'sent',
      email_error: '',
    });

    await service.entities.AuditLog.create({
      action: 'privacy.report_sent',
      actor: 'system',
      entity: 'DataRequest',
      entity_id: requestId,
      reference,
      severity: 'info',
      details: { rows: rows.length, to: email },
    });

    return Response.json({ sent: true, reference, to: email, rows: rows.length });
  } catch (error) {
    console.error('[emailDataReport] operation failed', { error: String(error?.message || error).slice(0, 200) });
    return addSecurityHeaders(Response.json({ error: 'Data report unavailable; retry only after verifying delivery status' }, { status: 503, headers: { 'Retry-After': '120', 'Cache-Control': 'no-store' } }));
  }
}