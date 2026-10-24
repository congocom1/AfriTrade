import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { requireAdmin } from '../../shared/security.ts';

/**
 * Imports Wix eCommerce orders into the platform's order register.
 *
 * Called from workflows only: the Wix connector trigger passes the order Wix
 * sent, the scheduled sync passes nothing and reconciles the whole register.
 * Matching is done on the Wix order id, so re-running never duplicates a sale.
 */

const WIX_ORDERS_SEARCH = 'https://www.wixapis.com/ecom/v1/orders/search';
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const amountOf = (price: any) => Number(price?.amount ?? 0) || 0;

function paymentStatusOf(value: any) {
  switch (String(value || '').toUpperCase()) {
    case 'PAID':
    case 'PARTIALLY_PAID':
      return 'PAID';
    case 'PENDING_MERCHANT':
      return 'AUTHORIZED';
    case 'PARTIALLY_REFUNDED':
      return 'PARTIALLY_REFUNDED';
    case 'FULLY_REFUNDED':
      return 'REFUNDED';
    case 'CANCELED':
      return 'CANCELLED';
    case 'DECLINED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

function statusOf(order: any) {
  const orderStatus = String(order?.status || '').toUpperCase();
  const fulfilment = String(order?.fulfillmentStatus || '').toUpperCase();
  if (orderStatus === 'CANCELED' || orderStatus === 'REJECTED') return 'CANCELLED';
  if (fulfilment === 'FULFILLED') return 'DELIVERED';
  if (fulfilment === 'PARTIALLY_FULFILLED') return 'SHIPPED';
  if (orderStatus === 'APPROVED') return 'CONFIRMED';
  return 'PENDING';
}

function mapOrder(order: any) {
  const contact = order?.billingInfo?.contactDetails || {};
  const address = order?.billingInfo?.address || {};
  const summary = order?.priceSummary || {};

  const items = (order?.lineItems || []).map((line: any) => {
    const quantity = Number(line?.quantity ?? 0);
    return {
      product_id: line?.catalogReference?.catalogItemId || line?.id || '',
      title: line?.productName || '',
      image: line?.image?.url || '',
      quantity,
      line_total_usd: amountOf(line?.totalPriceAfterTax) || amountOf(line?.price) * quantity,
      seller_name: 'Wix',
    };
  });

  return {
    order_number: `WX-${order?.number || order?.id}`,
    customer_name: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
    customer_email: order?.buyerInfo?.email || '',
    customer_phone: contact.phone || '',
    city: address.city || '',
    address: address.addressLine || '',
    notes: order?.buyerNote || '',
    items,
    subtotal_usd: amountOf(summary.subtotal),
    shipping_usd: amountOf(summary.shipping),
    discount_usd: amountOf(summary.discount),
    total_usd: amountOf(summary.total),
    currency: order?.currency || 'USD',
    payment_method: 'wix',
    payment_provider: 'Wix',
    payment_reference: order?.id || '',
    payment_status: paymentStatusOf(order?.paymentStatus),
    payment_verified: String(order?.paymentStatus || '').toUpperCase() === 'PAID',
    status: statusOf(order),
  };
}

async function fetchAllOrders(accessToken: string) {
  const orders: any[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetch(WIX_ORDERS_SEARCH, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: { cursorPaging: cursor ? { limit: PAGE_SIZE, cursor } : { limit: PAGE_SIZE } },
      }),
    });
    if (!response.ok) throw new Error(`Wix orders search failed: ${response.status} ${await response.text()}`);

    const data = await response.json();
    orders.push(...(data?.orders || []));

    const next = data?.metadata?.cursors?.next;
    if (!data?.metadata?.hasNext || !next) break;
    cursor = next;
  }

  return orders;
}

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (!gate.ok) return gate.response;

    const body = await req.json().catch(() => ({}));

    let single = body?.order ?? null;
    if (typeof single === 'string') {
      try {
        single = JSON.parse(single);
      } catch {
        single = null;
      }
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('wix');

    const orders = single && single.id ? [single] : await fetchAllOrders(accessToken);

    let created = 0;
    let updated = 0;

    for (const order of orders) {
      if (!order?.id) continue;
      const payload = mapOrder(order);

      const page = await base44.asServiceRole.entities.Order.filter({ payment_reference: order.id }, { limit: 1 });
      const existing = (page?.items || [])[0];

      if (existing) {
        await base44.asServiceRole.entities.Order.update(existing.id, payload);
        updated += 1;
      } else {
        await base44.asServiceRole.entities.Order.create(payload);
        created += 1;
      }
    }

    return Response.json({ scanned: orders.length, created, updated });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}