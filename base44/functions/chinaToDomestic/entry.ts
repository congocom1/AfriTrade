/// Generates domestic orders from Chinese warehouse receipts.
///   * Validates that a receipt exists and is in `approved` status.
///   * For each item in the receipt, creates a local `FulfillmentOrder`
///     and updates the `Product.stock` accordingly.
export const name = 'chinaToDomestic'
export const description = 'Create domestic orders from approved Chinese warehouse receipts'

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49'
import { requireAdmin } from '../../shared/security.ts'
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts'

// Rate limiting configuration for chinaToDomestic
const CHINA_TO_DOMESTIC_RATE_LIMIT_PER_HOUR = 30; // Allow 30 requests per hour (more restrictive for warehouse operations)
const RATE_WINDOW_MS = 3600 * 1000;

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export default async function (req) {
  try {
    if (req.method !== 'POST') return addSecurityHeaders(Response.json({ error: 'Method not allowed' }, { status: 405 }))
    const base44 = createClientFromRequest(req)

    // Rate limiting for chinaToDomestic - check before auth
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[chinaToDomestic] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "china_to_domestic",
        limit: CHINA_TO_DOMESTIC_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    // Conversion runs as the service role and mutates product stock, creates
    // fulfillment orders and closes the receipt, so it is reserved to
    // administrators (matching chinaSourcing / chinaWarehouse).
    const gate = await requireAdmin(base44)
    if (!gate.ok) return addSecurityHeaders(gate.response)

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      base44.asServiceRole,
      clientKey || "unidentified",
      {
        keyPrefix: "china_to_domestic",
        limit: CHINA_TO_DOMESTIC_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }
    const body = await req.json().catch(() => ({}))
    const receiptId = Number(body.receiptId || 0)
    if (!receiptId) return addSecurityHeaders(Response.json({ error: 'receiptId is required' }, { status: 400 }))

    // Validate the receipt exists and is approved
    const receipts = await base44.asServiceRole.entities.ChinaWarehouseReceipt
      .filter({ id: receiptId })
      .catch(() => [])
    const receipt = receipts[0] || null
    if (!receipt) return addSecurityHeaders(Response.json({ error: 'Receipt not found' }, { status: 404 }))
    if (receipt.status === 'converted') {
      const existingOrders = await base44.asServiceRole.entities.FulfillmentOrder
        .filter({ source_receipt_id: receipt.id })
        .catch(() => [])
      return addSecurityHeaders(Response.json({
        status: 'converted',
        receiptId,
        ordersCreated: existingOrders.length,
        alreadyConverted: true,
      }))
    }
    if (receipt.status !== 'approved') return addSecurityHeaders(Response.json({ error: 'Receipt not approved', status: receipt.status }, { status: 409 }))

    const items = receipt.items || []
    if (!items.length) return addSecurityHeaders(Response.json({ error: 'Receipt has no items' }, { status: 400 }))

    const tenant = {
      tenant_id: String(receipt.tenant_id || ''),
      tenant_owner_email: String(receipt.tenant_owner_email || ''),
    }
    const createdOrders = []

    for (const [index, item] of items.entries()) {
      const productId = String(item.product_id || '')
      const qty = Number(item.qty || 0)
      if (!productId || !(qty > 0)) continue

      // Increment domestic stock for this product
      const products = await base44.asServiceRole.entities.Product
        .filter({ id: productId })
        .catch(() => [])
      const product = products[0] || null
      if (!product) continue

      const newStock = (Number(product.stock) || 0) + qty
      await base44.asServiceRole.entities.Product.update(product.id, { stock: newStock })

      // Create a domestic FulfillmentOrder for this line
      const fo = await base44.asServiceRole.entities.FulfillmentOrder.create({
        ...tenant,
        order_id: receipt.order_id || '',
        order_number: receipt.order_number || '',
        fulfillment_number: `CD-${receipt.receipt_number || receipt.id}-${index + 1}`,
        product_id: product.id,
        product_name: product.name || '',
        quantity: qty,
        status: 'PENDING',
        source_type: 'china_to_domestic',
        source_receipt_id: receipt.id,
        shipping_usd: round2(Number(item.unit_price_usd) * qty),
        created_by_id: receipt.created_by_id || '',
      })
      createdOrders.push(fo)
    }

    // Mark receipt as converted
    await base44.asServiceRole.entities.ChinaWarehouseReceipt.update(receipt.id, {
      status: 'converted',
      converted_at: new Date().toISOString(),
    })

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'chinaToDomestic.converted',
      actor: 'system',
      entity: 'ChinaWarehouseReceipt',
      entity_id: receipt.id,
      reference: receipt.receipt_number || String(receipt.id),
      severity: 'info',
      details: { receiptId, itemsCount: items.length, ordersCreated: createdOrders.length },
    })

    return addSecurityHeaders(Response.json({ status: 'converted', receiptId, ordersCreated: createdOrders.length }))
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: String(error?.message || error) }, { status: 500 }))
  }
}