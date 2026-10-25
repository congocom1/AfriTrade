import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendSellerOutreach } from '../../shared/sellers.ts';

/**
 * Prévient le vendeur qu'une date de livraison (ou un dépôt en point relais)
 * vient d'être confirmée sur une de ses commandes.
 *
 * Appelée par le workflow « Alerte vendeur livraison confirmee » à chaque
 * changement de FulfillmentOrder. Le workflow est le seul appelant : la
 * fonction exige donc un administrateur et écrit en service role.
 */
const CLOSED_STATUSES = ['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'];
// Même délai de repli que la boutique, quand la commande n'a pas de date saisie.
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

const longDate = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const fulfillmentId = String(body?.fulfillment_id || '').trim();
    if (!fulfillmentId) return Response.json({ error: 'fulfillment_id is required' }, { status: 400 });

    const service = base44.asServiceRole;
    const fulfillment = await service.entities.FulfillmentOrder.get(fulfillmentId).catch(() => null);
    if (!fulfillment) return Response.json({ notified: false, reason: 'fulfillment_not_found' });
    if (CLOSED_STATUSES.includes(String(fulfillment.status || ''))) {
      return Response.json({ notified: false, reason: 'closed_status' });
    }

    const order = fulfillment.order_id
      ? await service.entities.Order.get(fulfillment.order_id).catch(() => null)
      : null;

    const lead = fulfillment.source_type === 'international_supplier'
      ? LEAD_DAYS.international
      : LEAD_DAYS.local;
    const day = isoDay(fulfillment.estimated_delivery)
      || isoDay(addDays(order?.created_date || fulfillment.created_date, lead));
    if (!day) return Response.json({ notified: false, reason: 'no_delivery_date' });

    // Le dépôt en point relais est confirmé soit par la commande, soit par le
    // passage du colis au statut « prêt à retirer ».
    const pickup = order?.delivery_method === 'pickup_point' || fulfillment.status === 'READY_FOR_PICKUP';

    let email = String(fulfillment.seller_email || '').trim();
    let sellerName = String(fulfillment.seller_name || '').trim();
    if (!email && fulfillment.seller_id) {
      const seller = await service.entities.Seller.get(fulfillment.seller_id).catch(() => null);
      email = String(seller?.email || seller?.tenant_owner_email || '').trim();
      sellerName = sellerName || String(seller?.name || '').trim();
    }
    if (!email) return Response.json({ notified: false, reason: 'no_seller_email' });

    const orderNumber = String(fulfillment.order_number || '');
    const pointName = String(order?.pickup_point_name || '').trim();
    const pickupCode = String(order?.pickup_code || '').trim();
    const dateLabel = longDate(day);

    const placeLabel = pickup ? 'Point relais' : 'Adresse de livraison';
    const placeValue = pickup
      ? [pointName || 'Point relais AfriTrade', pickupCode ? `code de retrait ${pickupCode}` : '']
        .filter(Boolean).join(' · ')
      : String(order?.address || order?.city || 'Adresse confirmée par le livreur').trim();

    const headline = pickup ? 'Dépôt en point relais confirmé' : 'Date de livraison confirmée';
    const subject = `${headline} · ${orderNumber}`;
    const message = pickup
      ? `Votre commande ${orderNumber} est prévue le ${dateLabel} au point relais ${pointName || 'AfriTrade'}${pickupCode ? ` (code de retrait ${pickupCode})` : ''}.`
      : `Votre commande ${orderNumber} est prévue le ${dateLabel}.`;

    const appUrl = String(req.headers.get('X-Base44-App-Url') || 'https://afrixtrade.com').replace(/\/$/, '');

    const result = await sendSellerOutreach(base44, {
      seller: {
        id: fulfillment.seller_id || '',
        name: sellerName,
        tenant_id: fulfillment.tenant_id || '',
        tenant_owner_email: fulfillment.tenant_owner_email || '',
      },
      email,
      subject,
      message,
      template_name: 'DeliveryDateConfirmed',
      variables: {
        seller_name: sellerName || 'cher vendeur',
        order_number: orderNumber,
        fulfillment_number: fulfillment.fulfillment_number || 'En préparation',
        headline,
        kind_label: pickup ? 'Dépôt en point relais' : 'Date de livraison',
        date_long: dateLabel,
        place_label: placeLabel,
        place_value: placeValue,
        detail_line: message,
        action_url: `${appUrl}/seller/orders`,
      },
      action: 'seller.delivery_date_confirmed',
      type: 'order',
      details: { order_number: orderNumber, delivery_date: day, pickup },
    });

    return Response.json({ notified: result.status === 'sent', status: result.status, to: email, delivery_date: day });
  } catch (error) {
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
}