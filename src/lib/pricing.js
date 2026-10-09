import { getPricingConfig, DEFAULT_PRICING_CONFIG } from './config';
import { round2Cents } from './format';

export { DEFAULT_PRICING_CONFIG };

/**
 * PRICING ENGINE
 * Supplier price → international shipping → import costs → local logistics →
 * platform margin → fees. Every component is configurable, never hard-coded,
 * and the raw supplier price is never shown to a customer.
 * All amounts in integer cents.
 */
export function computePriceBreakdown(product, cfg = getPricingConfig()) {
  const supplierPriceCents = round2Cents(Number(product?.supplier_price ?? product?.price_usd ?? 0) * 100);
  const isInternational = product?.source_type === 'international_supplier';

  const intlShippingCents = isInternational ? round2Cents((Number(cfg.international_shipping_usd) || 0) * 100) : 0;
  const importCostsCents = isInternational ? round2Cents(supplierPriceCents * ((cfg.import_cost_percent || 0) / 100)) : 0;
  const logisticsCents = round2Cents((Number(cfg.local_logistics_usd) || 0) * 100);
  const markupPercent = Number(product?.markup_percent ?? cfg.platform_margin_percent) || 0;
  const marginCents = round2Cents(supplierPriceCents * (markupPercent / 100));
  const feesCents = round2Cents(supplierPriceCents * ((cfg.payment_fee_percent || 0) / 100));

  const totalCents = round2Cents(supplierPriceCents + intlShippingCents + importCostsCents + logisticsCents + marginCents + feesCents);

  return {
    supplierPrice: supplierPriceCents / 100,
    intlShipping: intlShippingCents / 100,
    importCosts: importCostsCents / 100,
    logistics: logisticsCents / 100,
    margin: marginCents / 100,
    markupPercent,
    fees: feesCents / 100,
    total: totalCents / 100,
    total_cents: totalCents,
    isInternational,
  };
}

/** Suggested retail price used by the import tooling when publishing a product. */
export function suggestCustomerPrice(supplierPrice, sourceType, markupPercent, cfg = getPricingConfig()) {
  return computePriceBreakdown(
    { supplier_price: supplierPrice, source_type: sourceType, markup_percent: markupPercent },
    cfg,
  ).total;
}

export function applyMarkup(supplierPrice, markupPercent) {
  const cents = round2Cents(Number(supplierPrice || 0) * 100 * (1 + (Number(markupPercent) || 0) / 100));
  return cents / 100;
}

/** Integer cents version */
export function computePriceBreakdownCents(product, cfg = getPricingConfig()) {
  const supplierPriceCents = round2Cents(Number(product?.supplier_price ?? product?.price_usd ?? 0) * 100);
  const isInternational = product?.source_type === 'international_supplier';

  const intlShippingCents = isInternational ? round2Cents((Number(cfg.international_shipping_usd) || 0) * 100) : 0;
  const importCostsCents = isInternational ? round2Cents(supplierPriceCents * ((cfg.import_cost_percent || 0) / 100)) : 0;
  const logisticsCents = round2Cents((Number(cfg.local_logistics_usd) || 0) * 100);
  const markupPercent = Number(product?.markup_percent ?? cfg.platform_margin_percent) || 0;
  const marginCents = round2Cents(supplierPriceCents * (markupPercent / 100));
  const feesCents = round2Cents(supplierPriceCents * ((cfg.payment_fee_percent || 0) / 100));

  const totalCents = round2Cents(supplierPriceCents + intlShippingCents + importCostsCents + logisticsCents + marginCents + feesCents);

  return {
    supplierPriceCents,
    intlShippingCents,
    importCostsCents,
    logisticsCents,
    marginCents,
    markupPercent,
    feesCents,
    totalCents,
    isInternational,
  };
}