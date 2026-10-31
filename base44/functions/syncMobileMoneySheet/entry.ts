import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

/**
 * Historique comptable : écrit chaque transaction Mobile Money réussie dans une
 * feuille de calcul Google Sheets dédiée.
 *
 * Appelé par le workflow « Mobile Money Sheet Sync » (une ligne par transaction)
 * et par la page back-office (création de la feuille, activation, rattrapage).
 * Chaque commande n'est écrite qu'une seule fois : le journal MobileMoneySheetLog
 * sert de garde d'idempotence.
 */

const SETTING_KEY = 'mobile_money_sheet';
const SETTING_LABEL = 'Synchronisation Google Sheets (Mobile Money)';
const SETTING_GROUP = 'finance';
const SHEET_TITLE = 'AfriTrade — Transactions Mobile Money';
const HEADERS = ['Date', 'N° commande', 'Client', 'Téléphone', 'Montant USD', 'Moyen de paiement', 'Référence', 'Statut'];
const MAX_PER_RUN = 200;

async function callSheets(token, path, init = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Google Sheets a répondu ${res.status}`);
  return data;
}

/** Premier onglet du classeur — fonctionne aussi pour une feuille collée par l'admin. */
async function firstTab(token, spreadsheetId) {
  const meta = await callSheets(token, `/${spreadsheetId}?fields=sheets.properties.title`);
  const title = meta?.sheets?.[0]?.properties?.title;
  if (!title) throw new Error('Classeur illisible : aucun onglet trouvé');
  return title;
}

async function ensureHeaders(token, spreadsheetId, tab) {
  const head = await callSheets(token, `/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A1:A1`)}`);
  const existing = head?.values?.[0]?.[0];
  if (existing) return;
  await callSheets(token, `/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A1:H1`)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [HEADERS] }),
  });
}

function rowFor(order) {
  const date = order.paid_at || order.updated_date || order.created_date || new Date().toISOString();
  return [
    new Date(date).toISOString(),
    order.order_number || '',
    order.customer_name || '',
    order.payment_phone || order.customer_phone || '',
    Number(order.total_usd || 0),
    order.payment_provider || order.payment_method || 'MainMoney',
    order.payment_reference || '',
    order.payment_status || 'PAID',
  ];
}

function asList(result) {
  return Array.isArray(result) ? result : (result?.items || []);
}

async function getSetting(db) {
  const rows = asList(await db.entities.PlatformSetting.filter({ key: SETTING_KEY }, '-created_date', 1));
  return rows[0] || null;
}

async function saveSetting(db, record, value) {
  const merged = { ...(record?.value || {}), ...value };
  if (record) await db.entities.PlatformSetting.update(record.id, { value: merged, label: SETTING_LABEL, group: SETTING_GROUP });
  else await db.entities.PlatformSetting.create({ key: SETTING_KEY, label: SETTING_LABEL, group: SETTING_GROUP, value: merged });
  return merged;
}

/** Écrit une ligne et journalise le résultat. Renvoie true si une ligne a été ajoutée. */
async function appendOrder(db, token, setting, order, trigger, spreadsheetId) {
  const tab = await firstTab(token, spreadsheetId);
  await ensureHeaders(token, spreadsheetId, tab);
  await callSheets(token, `/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A:H`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [rowFor(order)] }),
  });
  await db.entities.MobileMoneySheetLog.create({
    order_id: order.id,
    order_number: order.order_number || '',
    spreadsheet_id: spreadsheetId,
    amount_usd: Number(order.total_usd || 0),
    trigger,
    status: 'success',
    synced_at: new Date().toISOString(),
  });
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');
    const record = await getSetting(db);
    const setting = record?.value || {};

    if (action === 'status') {
      const [paidPage, logs] = await Promise.all([
        db.entities.Order.filter({ payment_method: 'mainmoney', payment_status: 'PAID' }, { sort: '-created_date', limit: 500 }),
        db.entities.MobileMoneySheetLog.filter({ status: 'success' }, { sort: '-created_date', limit: 500 }),
      ]);
      const paid = asList(paidPage);
      const syncedIds = new Set(asList(logs).map((l) => l.order_id));
      return addSecurityHeaders(Response.json({
        enabled: Boolean(setting.enabled),
        spreadsheet_id: setting.spreadsheet_id || '',
        spreadsheet_url: setting.spreadsheet_url || '',
        last_synced_at: setting.last_synced_at || '',
        last_status: setting.last_status || 'never',
        last_error: setting.last_error || '',
        synced_count: syncedIds.size,
        pending_count: paid.filter((o) => !syncedIds.has(o.id)).length,
      }));
    }

    if (action === 'setEnabled') {
      const saved = await saveSetting(db, record, { enabled: Boolean(body.enabled) });
      return addSecurityHeaders(Response.json({ enabled: saved.enabled }));
    }

    if (action === 'createSheet') {
      const { accessToken } = await db.connectors.getConnection('googlesheets');
      const created = await callSheets(accessToken, '', {
        method: 'POST',
        body: JSON.stringify({ properties: { title: SHEET_TITLE }, sheets: [{ properties: { title: 'Transactions' } }] }),
      });
      const tab = created?.sheets?.[0]?.properties?.title || 'Transactions';
      await callSheets(accessToken, `/${created.spreadsheetId}/values/${encodeURIComponent(`${tab}!A1:H1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({ values: [HEADERS] }),
      });
      const url = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`;
      const saved = await saveSetting(db, record, { spreadsheet_id: created.spreadsheetId, spreadsheet_url: url, last_error: '' });
      return addSecurityHeaders(Response.json({ spreadsheet_id: saved.spreadsheet_id, spreadsheet_url: saved.spreadsheet_url }));
    }

    if (action === 'setSheet') {
      const raw = String(body.spreadsheet_id || '').trim();
      const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || raw.match(/^([a-zA-Z0-9-_]{20,})$/);
      if (!match) return addSecurityHeaders(Response.json({ error: 'Lien ou identifiant de feuille invalide' }, { status: 400 }));
      const id = match[1];
      const { accessToken } = await db.connectors.getConnection('googlesheets');
      const meta = await callSheets(accessToken, `/${id}?fields=properties.title`);
      const saved = await saveSetting(db, record, {
        spreadsheet_id: id,
        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        last_error: '',
      });
      return addSecurityHeaders(Response.json({ spreadsheet_id: saved.spreadsheet_id, spreadsheet_url: saved.spreadsheet_url, title: meta?.properties?.title || '' }));
    }

    // Automatic path: one successful transaction, called by the workflow.
    if (action === 'syncOrder') {
      if (!setting.enabled || !setting.spreadsheet_id) {
        return addSecurityHeaders(Response.json({ skipped: 'disabled' }));
      }
      const order = await db.entities.Order.get(String(body.order_id || ''));
      if (!order || order.payment_method !== 'mainmoney' || order.payment_status !== 'PAID') {
        return addSecurityHeaders(Response.json({ skipped: 'not_eligible' }));
      }
      const already = asList(await db.entities.MobileMoneySheetLog.filter({ order_id: order.id }, '-created_date', 1));
      if (already.length) return addSecurityHeaders(Response.json({ skipped: 'already_synced' }));

      const { accessToken } = await db.connectors.getConnection('googlesheets');
      try {
        await appendOrder(db, accessToken, setting, order, 'automatic', setting.spreadsheet_id);
        await saveSetting(db, record, { last_synced_at: new Date().toISOString(), last_status: 'success', last_error: '' });
        return addSecurityHeaders(Response.json({ synced: true, order_number: order.order_number }));
      } catch (e) {
        await db.entities.MobileMoneySheetLog.create({
          order_id: order.id, order_number: order.order_number || '', spreadsheet_id: setting.spreadsheet_id,
          amount_usd: Number(order.total_usd || 0), trigger: 'automatic', status: 'failed', error: e.message,
        });
        await saveSetting(db, record, { last_status: 'failed', last_error: e.message });
        return addSecurityHeaders(Response.json({ error: e.message }, { status: 502 }));
      }
    }

    // Rattrapage manuel : toutes les transactions payées pas encore écrites.
    if (action === 'syncAll') {
      if (!setting.spreadsheet_id) return addSecurityHeaders(Response.json({ error: 'Aucune feuille de calcul configurée' }, { status: 400 }));
      const { accessToken } = await db.connectors.getConnection('googlesheets');
      const paid = asList(await db.entities.Order.filter({ payment_method: 'mainmoney', payment_status: 'PAID' }, { sort: 'created_date', limit: 500 }));
      const syncedIds = new Set(asList(await db.entities.MobileMoneySheetLog.filter({ status: 'success' }, '-created_date', 500)).map((l) => l.order_id));
      const todo = paid.filter((o) => !syncedIds.has(o.id)).slice(0, MAX_PER_RUN);

      let synced = 0;
      const failures = [];
      for (const order of todo) {
        try {
          await appendOrder(db, accessToken, setting, order, 'manual', setting.spreadsheet_id);
          synced += 1;
        } catch (e) {
          failures.push({ order_number: order.order_number, error: e.message });
          await db.entities.MobileMoneySheetLog.create({
            order_id: order.id, order_number: order.order_number || '', spreadsheet_id: setting.spreadsheet_id,
            amount_usd: Number(order.total_usd || 0), trigger: 'manual', status: 'failed', error: e.message,
          });
        }
      }
      const remaining = paid.filter((o) => !syncedIds.has(o.id)).length - synced;
      await saveSetting(db, record, {
        last_synced_at: new Date().toISOString(),
        last_status: failures.length ? 'failed' : 'success',
        last_error: failures[0]?.error || '',
      });
      return addSecurityHeaders(Response.json({ synced, remaining: Math.max(remaining, 0), failures }));
    }

    return addSecurityHeaders(Response.json({ error: 'Action inconnue' }, { status: 400 }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}