import { base44 } from '@/api/base44Client';
import { getPricingConfig } from './config';
import { intlFee, intlLines, intlWeightKg } from './intlDelivery';
import { round2Cents, usdCentsToCdfCents, formatCDF } from './format';
import { getSessionId, rememberOrder, getReferralCode } from './session';
import { notifyFulfillmentStatus } from './orderNotifications';
import { assessCheckoutRisk } from './fraud';
import { emitEvent } from './events';

/**
 * Reloads every cart line from the database. Client-supplied prices, stock and
 * supplier costs are ALWAYS discarded — the server records are the truth.
 */
export async function loadCartLines(client, items) {
  const db = client || base44;
  const products = await Promise.all(
    items.map((i) => db.entities.Product.get(i.product_id).catch(() => null)),
  );
  const byId = {};
  products.forEach((p) => {
    if (p) byId[p.id] = p;
  });
  return items
    .map((i) => {
      const product = byId[i.product_id];
      if (!product) return null;
      const quantity = Math.max(1, Number(i.quantity) || 1);
      // Convert USD to cents for integer arithmetic
      const unitCents = round2Cents(Number(product.price_usd) * 100);
      const costCents = round2Cents(Number(product.supplier_price ?? product.price_usd) * 100);
      return {
        product,
        quantity,
        variant: i.variant || null,
        unit_price_usd_cents: unitCents,
        line_total_usd_cents: round2Cents(unitCents * quantity),
        line_cost_usd_cents: round2Cents(costCents * quantity),
        stock_ok: (product.stock ?? 0) >= quantity,
      };
    })
    .filter(Boolean);
}

export function computeCouponDiscount(coupon, subtotalDollars) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    // Calculate discount in dollars
    const rawDollars = subtotalDollars * ((Number(coupon.value) || 0) / 100);
    const capDollars = (Number(coupon.max_discount_usd) || 0);
    return capDollars > 0 ? Math.min(rawDollars, capDollars) : rawDollars;
  }
  if (coupon.type === 'fixed') {
    const fixedDollars = Number(coupon.value) || 0;
    return Math.min(fixedDollars, subtotalDollars);
  }
  return 0;
}

export async function findCoupon(client, code) {
  const db = client || base44;
  if (!code) return null;
  const rows = await db.entities.Coupon.filter({ code: String(code).toUpperCase().trim() });
  const coupon = rows.find((c) => c.active !== false);
  if (!coupon) return null;
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
  if (Number(coupon.usage_limit) > 0 && (Number(coupon.usage_count) || 0) >= Number(coupon.usage_limit)) return null;
  return coupon;
}

export async function buildCheckoutQuote(client, { items, deliveryFee = 0, coupon = null, pricingConfig, intlOption = null }) {
  const db = client || base44;
  const cfg = pricingConfig || getPricingConfig();
  const lines = await loadCartLines(db, items);
  // All amounts in integer cents
  const subtotalCents = round2Cents(lines.reduce((s, l) => s + l.line_total_usd_cents, 0));
  const discountCents = round2Cents(computeCouponDiscount(coupon, subtotalCents / 100) * 100);

  const thresholdCents = round2Cents((Number(cfg.free_shipping_threshold_usd) || 0) * 100);
  const freeShipping = coupon?.type === 'free_shipping' || (thresholdCents > 0 && subtotalCents - discountCents >= thresholdCents);

  // Local delivery and the international leg are priced apart: the local fee
  // only applies when the cart holds local goods, and the local free-shipping
  // threshold never waives international freight.
  const imports = intlLines(lines);
  const intlWeight = intlWeightKg(lines);
  const deliveryFeeCents = round2Cents(deliveryFee * 100);
  const localShippingCents = lines.some((l) => l.product.source_type === 'local_seller') && !freeShipping
    ? deliveryFeeCents
    : 0;
  const intlShippingCents = imports.length ? round2Cents(intlFee(intlOption, intlWeight) * 100) : 0;
  const shippingCents = round2Cents(localShippingCents + intlShippingCents);

  const totalCents = round2Cents(Math.max(0, subtotalCents - discountCents) + shippingCents);
  return {
    lines,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    shipping: shippingCents / 100,
    localShipping: localShippingCents / 100,
    intlShipping: intlShippingCents / 100,
    intlWeight,
    freeShipping,
    total: totalCents / 100,
    total_cdf: usdCentsToCdfCents(totalCents),
    total_cdf_formatted: formatCDF(usdCentsToCdfCents(totalCents)),
    has_stock_issue: lines.some((l) => !l.stock_ok),
  };
}

/**
 * MAIN COMMERCE ENGINE ENTRY POINT
 * Thin tunnel to the `place-order` server function: all money math, stock
 * checks, coupon enforcement and ledger writes happen server-side. The browser
 * only forwards identifiers and customer input, then runs the non-authoritative
 * post-effects (fraud assessment, event emission, device order memory).
 */
export async function placeOrder(client, { items, profile, delivery, couponCode, paymentMethodId, paymentPhone, consent }) {
  const db = client || base44;
  const sessionId = getSessionId();
  const affiliateCode = getReferralCode();

  // Client-side stock validation before server call (defensive: server is authoritative)
  // Re-validate stock immediately before the server call to minimize race window
  const lines = await loadCartLines(db, items);
  const outOfStock = lines.filter((l) => !l.stock_ok);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((l) => l.product.title).join(', ');
    throw new Error(`Rupture de stock pour : ${names}. Veuillez mettre à jour votre panier.`);
  }

  // Build quote for validation but we use the server response for actual order
  const _quote = await buildCheckoutQuote(db, { items, couponCode: couponCode || '' });

  let data;
  try {
    const res = await db.functions.invoke('place-order', {
      items: (items || []).map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        variant: i.variant || null,
      })),
      profile: {
        name: profile?.name || '',
        phone: profile?.phone || '',
        email: profile?.email || '',
        city: profile?.city || '',
        address: profile?.address || '',
      },
      delivery: {
        method: delivery?.method,
        zone_id: delivery?.zone_id || '',
        pickup_point_id: delivery?.pickup_point_id || '',
        address: delivery?.address || profile?.address || '',
        intl_option_id: delivery?.intl_option_id || '',
        notes: delivery?.notes || '',
      },
      couponCode: couponCode || '',
      paymentMethodId,
      paymentPhone: paymentPhone || profile?.phone || '',
      affiliateCode,
      sessionId,
      consent: { terms: consent?.terms === true, marketing: consent?.marketing === true },
    });
    data = res?.data;
  } catch (e) {
    throw new Error(e?.data?.error || e?.error || e?.message || 'La commande a échoué. Réessayez.');
  }
  if (!data?.order?.order_number) {
    throw new Error(data?.error || 'La commande a échoué. Réessayez.');
  }
  const finalOrder = data.order;
  const redirectUrl = data.redirectUrl || null;

  await assessCheckoutRisk({
    order: finalOrder,
    amountUsdCents: round2Cents((data?.quote?.total || finalOrder.total_usd) * 100),
    sessionId,
    profile,
    couponCode: couponCode || '',
    affiliateCode,
  }).catch(() => null);

  rememberOrder(finalOrder);

  emitEvent(db, 'order_placed', {
    category: 'order',
    source: 'Order',
    sourceId: finalOrder.id,
    reference: finalOrder.order_number,
    tenantId: finalOrder.tenant_id || '',
    tenantOwnerEmail: finalOrder.tenant_owner_email || '',
    description: `Commande ${finalOrder.order_number} — ${finalOrder.total_usd} USD`,
    payload: {
      total_usd: finalOrder.total_usd,
      payment_status: finalOrder.payment_status,
      city: profile?.city || '',
    },
  });

  if (finalOrder.payment_status === 'PAID') {
    emitEvent(db, 'order_paid', {
      category: 'order',
      source: 'Order',
      sourceId: finalOrder.id,
      reference: finalOrder.order_number,
      tenantId: finalOrder.tenant_id || '',
      tenantOwnerEmail: finalOrder.tenant_owner_email || '',
      description: `Paiement confirmé pour ${finalOrder.order_number}`,
      payload: { total_usd: finalOrder.total_usd },
    });
  }

  return {
    order: finalOrder,
    redirectUrl,
    fulfillments: data.fulfillments || [],
    payment: data.payment || { status: finalOrder.payment_status, verified: finalOrder.payment_verified },
    quote: data.quote || null,
  };
}

/** Persist delivery transitions on the server; never accept a browser-supplied balance or owner. */
export async function advanceFulfillment(client, fulfillment, status) {
  const db = client || base44;
  const { data } = await db.functions.invoke('fulfillmentAction', { action: 'advance', fulfillment_id: fulfillment.id, status });
  const updated = data.fulfillment;
  await notifyFulfillmentStatus(db, updated, status);
  emitEvent(db, status === 'DELIVERED' ? 'order_delivered' : 'fulfillment_status_changed', {
    category: 'order', source: 'FulfillmentOrder', sourceId: updated.id,
    reference: updated.order_number || '', tenantId: updated.tenant_id || '',
    tenantOwnerEmail: updated.tenant_owner_email || '',
    description: `${updated.fulfillment_number || ''} → ${status}`,
    payload: { status, label: status, fulfillment_number: updated.fulfillment_number || '' },
  });
  return updated;
}

export async function respondToShipment(client, { shipment, accepted }) {
  const db = client || base44;
  const { data } = await db.functions.invoke('fulfillmentAction', { action: 'respond', shipment_id: shipment.id, accepted });
  return data.shipment;
}

export async function courierUpdateShipment(client, { shipment, status, label, extra = {} }) {
  const db = client || base44;
  const { data } = await db.functions.invoke('fulfillmentAction', {
    action: 'courierAdvance', shipment_id: shipment.id, status, label,
    delivered_to: extra.delivered_to, proof_of_delivery: extra.proof_of_delivery, pickup_code: extra.pickup_code,
  });
  await notifyFulfillmentStatus(db, data.fulfillment, status);
  return true;
}