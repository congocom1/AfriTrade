import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Pushes the signed-in user's upcoming deliveries and relay-point drop-off
 * appointments into their own Google Calendar.
 *
 * Per-user connector: the token comes from the app user's own Google account,
 * so nobody sees anyone else's agenda. Row-level security already limits the
 * fulfillment orders read below to what this user is allowed to see.
 */
const CONNECTOR_ID = '6add60dbed5c9817315dc9f6';
const CALENDAR_ID = 'primary';
const APP_TAG = 'afritradeApp=1';
const MAX_INSERTS = 25;
const CLOSED_STATUSES = ['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'];
// Lead time used when the order has no explicit delivery date, matching the
// default ETAs the storefront shows buyers.
const LEAD_DAYS = { international: 18, local: 4 };

const isoDay = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const addDays = (value, days) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const nextDay = (day) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const buildItems = (fulfillments, orderByNumber) => {
  const items = [];
  for (const fulfillment of fulfillments) {
    const order = orderByNumber.get(fulfillment.order_number) || null;
    const lead = fulfillment.source_type === 'international_supplier' ? LEAD_DAYS.international : LEAD_DAYS.local;
    const date = isoDay(fulfillment.estimated_delivery)
      || isoDay(addDays(order?.created_date || fulfillment.created_date, lead));
    if (!date) continue;

    const pickup = order?.delivery_method === 'pickup_point';
    const pointName = order?.pickup_point_name || 'point relais';
    const description = [
      `Commande ${fulfillment.order_number}`,
      fulfillment.fulfillment_number ? `Colis ${fulfillment.fulfillment_number}` : '',
      pickup ? `Point relais : ${pointName}` : '',
      pickup && order?.pickup_code ? `Code de retrait : ${order.pickup_code}` : '',
      fulfillment.courier_name ? `Livreur : ${fulfillment.courier_name}` : '',
      'Créé automatiquement par AfriTrade.',
    ].filter(Boolean).join('\n');

    items.push({
      key: `${pickup ? 'pickup' : 'delivery'}-${fulfillment.fulfillment_number}`,
      type: pickup ? 'pickup' : 'delivery',
      date,
      order_number: fulfillment.order_number,
      title: pickup
        ? `Dépôt en point relais · ${pointName} · ${fulfillment.order_number}`
        : `Livraison estimée · ${fulfillment.order_number}`,
      location: [pointName && pickup ? pointName : '', order?.address || order?.city || ''].filter(Boolean).join(', '),
      description,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
};

const eventPayload = (item, appUrl) => ({
  summary: item.title,
  location: item.location || undefined,
  description: item.description,
  start: { date: item.date },
  end: { date: nextDay(item.date) },
  source: { title: 'AfriTrade', url: appUrl },
  reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
  extendedProperties: { private: { afritradeApp: '1', afriKey: item.key } },
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'sync' ? 'sync' : 'status';

    let accessToken = null;
    try {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = connection?.accessToken || null;
    } catch {
      accessToken = null;
    }
    if (!accessToken) return Response.json({ connected: false });

    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`;

    const page = await base44.entities.FulfillmentOrder.filter(
      { status: { $nin: CLOSED_STATUSES } },
      { sort: 'created_date', limit: 60 },
    );
    const fulfillments = page?.items || [];

    const orderNumbers = [...new Set(fulfillments.map((f) => f.order_number).filter(Boolean))];
    let orders = [];
    if (orderNumbers.length) {
      const orderPage = await base44.entities.Order.filter({ order_number: { $in: orderNumbers } }, { limit: 100 });
      orders = orderPage?.items || [];
    }
    const orderByNumber = new Map(orders.map((order) => [order.order_number, order]));
    const items = buildItems(fulfillments, orderByNumber);

    // Existing AfriTrade events, so running the sync twice never duplicates one.
    const listUrl = `${eventsUrl}?privateExtendedProperty=${encodeURIComponent(APP_TAG)}`
      + `&singleEvents=true&maxResults=250`
      + `&timeMin=${new Date(Date.now() - 30 * 864e5).toISOString()}`
      + `&timeMax=${new Date(Date.now() + 400 * 864e5).toISOString()}`;
    const listRes = await fetch(listUrl, { headers: authHeader, signal: AbortSignal.timeout(12000) });
    const listData = listRes.ok ? await listRes.json() : { items: [] };
    const syncedKeys = new Set(
      (listData.items || []).map((event) => event?.extendedProperties?.private?.afriKey).filter(Boolean),
    );

    const decorated = items.map((item) => ({ ...item, synced: syncedKeys.has(item.key) }));
    if (action === 'status') {
      return Response.json({ connected: true, items: decorated });
    }

    const appUrl = req.headers.get('X-Base44-App-Url') || '';
    const pending = decorated.filter((item) => !item.synced).slice(0, MAX_INSERTS);
    let created = 0;
    for (let i = 0; i < pending.length; i += 5) {
      const batch = pending.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map((item) => fetch(eventsUrl, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload(item, appUrl)),
        signal: AbortSignal.timeout(12000),
      })));
      created += results.filter((result) => result.status === 'fulfilled' && result.value.ok).length;
    }

    const pushedKeys = new Set(pending.map((item) => item.key));
    return Response.json({
      connected: true,
      created,
      skipped: decorated.length - pending.length,
      items: decorated.map((item) => ({ ...item, synced: item.synced || pushedKeys.has(item.key) })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}