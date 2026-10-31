import { formatDate } from './format';

const DAY_MS = 86400000;
const CLOSED = ['DELIVERED', 'CANCELLED', 'RETURNED'];

/** Whole days since a record was last touched. */
function daysSince(value) {
  const stamp = new Date(value || Date.now()).getTime();
  if (!Number.isFinite(stamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - stamp) / DAY_MS));
}

const money = (f) => Number(f?.subtotal_usd) || 0;

/** Sales of the last `days` days, plus the latest sales newest first. */
export function salesOverview(fulfillments = [], days = 7, limit = 5) {
  const rows = [...fulfillments].sort(
    (a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime(),
  );
  const window = rows.filter(
    (f) => Date.now() - new Date(f.created_date || 0).getTime() <= days * DAY_MS,
  );
  const revenue = window.reduce((sum, f) => sum + money(f), 0);
  return {
    days,
    rows: rows.slice(0, limit),
    count: window.length,
    revenue,
    average: window.length ? revenue / window.length : 0,
  };
}

/** Parcels sitting at a relay point, and those the customer collected. */
export function relayPointDeposits(fulfillments = [], limit = 5) {
  const waiting = fulfillments
    .filter((f) => f.status === 'READY_FOR_PICKUP')
    .map((f) => ({ ...f, daysWaiting: daysSince(f.updated_date) }))
    .sort((a, b) => b.daysWaiting - a.daysWaiting);
  const collected = fulfillments.filter((f) => f.status === 'PICKED_UP');
  return {
    waiting: waiting.slice(0, limit),
    waitingCount: waiting.length,
    collectedCount: collected.length,
  };
}

/** Everything that needs the seller's attention today, worst first. */
export function deliveryAlerts(fulfillments = [], limit = 6) {
  const now = Date.now();
  const alerts = [];

  const push = (fulfillment, tone, label, detail) => alerts.push({
    id: fulfillment.id,
    order_number: fulfillment.order_number,
    fulfillment_number: fulfillment.fulfillment_number,
    tone,
    label,
    detail,
  });

  fulfillments.forEach((f) => {
    const status = f.status || '';
    const days = daysSince(f.updated_date);

    if (status === 'FAILED') {
      push(f, 'danger', 'Livraison échouée', "Le livreur n'a pas pu remettre le colis.");
    } else if (status === 'RETURNED') {
      push(f, 'warning', 'Colis retourné', 'Le colis est revenu au dépôt.');
    } else if (status === 'READY_FOR_PICKUP' && days >= 3) {
      push(f, 'warning', 'Toujours au point relais', `En attente depuis ${days} jours.`);
    } else if (status === 'AWAITING_CUSTOMER_APPROVAL' && days >= 2) {
      push(f, 'warning', 'Validation client en attente', `Depuis ${days} jours.`);
    } else if (status === 'PENDING' && days >= 1) {
      push(f, 'warning', 'Commande non traitée', `Reçue il y a ${days} jours.`);
    }

    const eta = f.estimated_delivery ? new Date(f.estimated_delivery).getTime() : NaN;
    if (Number.isFinite(eta) && eta < now && !CLOSED.includes(status)) {
      push(f, 'danger', 'Retard de livraison', `Prévue le ${formatDate(f.estimated_delivery)}.`);
    }
  });

  return alerts
    .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1))
    .slice(0, limit);
}