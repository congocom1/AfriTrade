import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  courierMayAct,
  INTL_RECEIVABLE,
  isInternational,
  INTL_STATUS_FLOW,
  sellerMayAct,
  TERMINAL,
  validAdvance,
  validCourierAdvance,
} from '../../shared/fulfillmentAccess.js';
import { releasePending } from '../../shared/walletLedger.ts';
import { addSecurityHeaders, checkRateLimit, getClientKey, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

const RATE_LIMIT_PER_HOUR = 120;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const fail = (message: string, status = 400) =>
  addSecurityHeaders(Response.json({ error: message }, { status }));

const audit = (db: any, action: string, user: any, entity: string, entityId: string, reference: string, details: Record<string, unknown>) =>
  db.entities.AuditLog.create({
    action,
    actor: user.email,
    entity,
    entity_id: entityId,
    reference,
    details,
  });

async function releasePayout(db: any, fulfillment: any, order: any) {
  if (fulfillment.payout_released || order.payment_status !== 'PAID' || order.payment_verified !== true) {
    return fulfillment;
  }

  const pending = await db.entities.WalletTransaction
    .filter({ order_id: order.id, status: 'pending' })
    .catch(() => []);

  for (const transaction of pending) {
    if (transaction.direction !== 'credit' || !transaction.wallet_id) continue;
    const claim = await db.entities.WalletTransaction.updateMany(
      { id: transaction.id, status: 'pending' },
      { $set: { status: 'posted' } },
    );
    if (claim.updated !== 1) continue;
    const wallet = await db.entities.Wallet.get(transaction.wallet_id).catch(() => null);
    if (wallet) await releasePending(db, wallet, transaction.amount_usd);
  }

  await db.entities.FulfillmentOrder.updateMany(
    { id: fulfillment.id, payout_released: { $ne: true } },
    { $set: { payout_released: true } },
  );
  return await db.entities.FulfillmentOrder.get(fulfillment.id).catch(() => fulfillment);
}

async function findAssignedCourier(db: any, shipment: any, user: any) {
  const matches = await db.entities.Courier
    .filter({ name: shipment.courier_name })
    .catch(() => []);
  const byId = matches.find((courier: any) => courier.id === shipment.courier_id);
  if (byId && courierMayAct(byId, user)) return byId;
  if (byId) return null;
  const named = matches.filter((courier: any) => courierMayAct(courier, user));
  return named.length === 1 ? named[0] : null;
}

function event(status: string, label: string, at: string) {
  return { status, label: label.slice(0, 100), at };
}

export default async function (req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return fail('Method not allowed', 405);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const clientKey = getClientKey(req) || 'unidentified';
    const limited = await checkRateLimit(db, clientKey, {
      keyPrefix: 'fulfillment_action',
      limit: RATE_LIMIT_PER_HOUR,
      windowMs: RATE_WINDOW_MS,
    });
    if (!limited.ok) return rateLimitErrorResponse(limited);

    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return fail('Authentication required', 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);
    const action = String(body.action || '');
    if (!['advance', 'respond', 'courierAdvance', 'intlReceive'].includes(action)) {
      return fail('Invalid action');
    }

    const usesShipment = action === 'respond' || action === 'courierAdvance';
    const shipment = usesShipment
      ? await db.entities.Shipment.get(String(body.shipment_id || '')).catch(() => null)
      : null;
    if (usesShipment && !shipment) return fail('Shipment not found', 404);

    const fulfillmentId = usesShipment ? shipment.fulfillment_order_id : String(body.fulfillment_id || '');
    if (!fulfillmentId) return fail('Fulfillment is required');
    const fulfillment = await db.entities.FulfillmentOrder.get(fulfillmentId).catch(() => null);
    if (!fulfillment) return fail('Fulfillment not found', 404);
    if (shipment && (
      shipment.fulfillment_order_id !== fulfillment.id ||
      shipment.order_number !== fulfillment.order_number
    )) return fail('Shipment does not match fulfillment', 404);

    const order = await db.entities.Order.get(fulfillment.order_id).catch(() => null);
    if (!order || order.order_number !== fulfillment.order_number) return fail('Order not found', 404);
    const admin = String(user.role || '') === 'admin';

    if (action === 'intlReceive') {
      if (!admin) return fail('Forbidden', 403);
      if (!isInternational(fulfillment.source_type)) return fail('International fulfillment required', 409);
      if (fulfillment.status === 'AWAITING_CUSTOMER_APPROVAL') {
        return addSecurityHeaders(Response.json({ fulfillment, already: true }));
      }
      if (!INTL_RECEIVABLE.includes(fulfillment.status)) return fail('Fulfillment cannot be received in its current state', 409);
      if (order.payment_status !== 'PAID' && order.payment_provider !== 'cod') return fail('Payment not confirmed', 409);
      const warehouse = String(body.origin_warehouse || '').trim().slice(0, 120);
      const photo = String(body.origin_photo || '').trim().slice(0, 500);
      if (!warehouse || !photo) return fail('Warehouse and parcel photo are required');
      const now = new Date().toISOString();
      const updated = await db.entities.FulfillmentOrder.update(fulfillment.id, {
        status: 'AWAITING_CUSTOMER_APPROVAL',
        origin_warehouse: warehouse,
        origin_photo_url: photo,
        origin_received_at: now,
      });
      await db.entities.Notification.create({
        tenant_id: fulfillment.tenant_id || order.tenant_id || '',
        tenant_owner_email: fulfillment.tenant_owner_email || order.tenant_owner_email || '',
        title: `Your parcel arrived at our origin warehouse (${order.order_number})`,
        message: `Goods received at ${warehouse}. Review the photo and confirm forwarding to ${order.city || 'your destination'}.`,
        type: 'order',
        audience: 'customer',
        order_number: order.order_number,
      });
      await audit(db, 'fulfillment.origin_received', user, 'FulfillmentOrder', updated.id, order.order_number, {
        warehouse,
        from: fulfillment.status,
        to: updated.status,
      });
      return addSecurityHeaders(Response.json({ fulfillment: updated }));
    }

    let courier = null;
    if (action === 'advance') {
      if (!admin) {
        const seller = fulfillment.seller_id
          ? await db.entities.Seller.get(fulfillment.seller_id).catch(() => null)
          : null;
        if (!sellerMayAct(seller, user)) return fail('Forbidden', 403);
      }
    } else {
      courier = await findAssignedCourier(db, shipment, user);
      if (!admin && !courier) return fail('Forbidden', 403);
      if (!courier && admin) courier = { id: shipment.courier_id, name: shipment.courier_name, email: '' };
    }

    if (action === 'respond') {
      if (TERMINAL.includes(shipment.status)) return fail('Shipment is already closed', 409);
      if (typeof body.accepted !== 'boolean') return fail('Invalid response');
      if (shipment.courier_response !== 'pending') {
        if ((shipment.courier_response === 'accepted') === body.accepted) {
          return addSecurityHeaders(Response.json({ shipment, already: true }));
        }
        return fail('Shipment offer already handled', 409);
      }
      const updated = await db.entities.Shipment.update(shipment.id, {
        courier_response: body.accepted ? 'accepted' : 'declined',
        events: [
          ...(shipment.events || []),
          event(shipment.status, body.accepted ? 'Delivery accepted by courier' : 'Delivery declined by courier', new Date().toISOString()),
        ],
      });
      await audit(db, 'shipment.response', user, 'Shipment', updated.id, order.order_number, { accepted: body.accepted });
      return addSecurityHeaders(Response.json({ shipment: updated }));
    }

    const status = String(body.status || '');
    if (!status) return fail('Status is required');
    if (action === 'advance') {
      if (fulfillment.status === status) return addSecurityHeaders(Response.json({ fulfillment, already: true }));
      const cancelling = status === 'CANCELLED';
      if (!validAdvance(fulfillment.status, status, admin, fulfillment.source_type)) return fail('Invalid fulfillment transition', 409);
      if (cancelling && order.payment_verified) return fail('Paid orders must use the refund workflow', 409);
      if (!cancelling && order.payment_status !== 'PAID' && order.payment_provider !== 'cod') return fail('Payment not confirmed', 409);
    } else {
      if (shipment.status === status && fulfillment.status === status) {
        return addSecurityHeaders(Response.json({ fulfillment, shipment, already: true }));
      }
      if (!validCourierAdvance(shipment, fulfillment, status)) return fail('Invalid courier transition', 409);
      if (order.payment_status !== 'PAID' && order.payment_provider !== 'cod') return fail('Payment not confirmed', 409);
      if (status === 'DELIVERED' && order.pickup_code && String(body.pickup_code || '').trim() !== String(order.pickup_code)) {
        return fail('Pickup code is incorrect', 403);
      }
    }

    const now = new Date().toISOString();
    const updated = await db.entities.FulfillmentOrder.update(fulfillment.id, { status });
    const relatedShipment = action === 'advance'
      ? (await db.entities.Shipment.filter({ fulfillment_order_id: fulfillment.id }).catch(() => []))[0]
      : shipment;
    let updatedShipment = relatedShipment;
    if (relatedShipment) {
      const extras = action === 'courierAdvance' && status === 'DELIVERED'
        ? {
            delivered_to: String(body.delivered_to || '').slice(0, 100),
            delivered_at: now,
            proof_of_delivery: String(body.proof_of_delivery || '').slice(0, 500),
          }
        : {};
      updatedShipment = await db.entities.Shipment.update(relatedShipment.id, {
        status,
        events: [
          ...(relatedShipment.events || []),
          event(status, action === 'courierAdvance' ? String(body.label || status) : status, now),
        ],
        ...extras,
      });
    }

    const finalFulfillment = status === 'DELIVERED'
      ? await releasePayout(db, updated, order)
      : updated;
    await audit(db, 'fulfillment.status_changed', user, 'FulfillmentOrder', finalFulfillment.id, order.order_number, {
      action,
      from: fulfillment.status,
      to: status,
      payment_verified: order.payment_verified === true,
    });
    return addSecurityHeaders(Response.json({ fulfillment: finalFulfillment, shipment: updatedShipment }));
  } catch (error) {
    console.error('fulfillmentAction failed', error);
    return fail('Action could not be completed', 500);
  }
}
