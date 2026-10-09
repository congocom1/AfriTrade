import { getTaxConfig } from './config.js';
import { round2Cents } from './format';

/**
 * Splits a TVA-inclusive amount (TTC) in integer cents into the net amount (HT)
 * and the TVA it already contains. Retail prices in the DRC are displayed TTC,
 * so the TVA is never added on top of what the customer sees.
 * All amounts are in integer cents.
 */
export function splitVatCents(amountTtcCents, rate) {
  const ttc = round2Cents(amountTtcCents);
  const r = Number(rate) || 0;
  if (r <= 0) return { htCents: ttc, vatCents: 0, ttcCents: ttc, rate: 0 };
  // HT = TTC / (1 + rate/100)
  // VAT = TTC - HT
  const htCents = round2Cents((ttc * 100) / (100 + r));
  return { htCents, vatCents: round2Cents(ttc - htCents), ttcCents: ttc, rate: r };
}

/** Active TVA rate — 0 when TVA is switched off in the compliance settings. */
export function getVatRate() {
  const cfg = getTaxConfig();
  if (cfg.enabled === false) return 0;
  return Number(cfg.vat_rate) || 0;
}

export function orderVatCents(totalTtcCents, rate = getVatRate()) {
  return splitVatCents(totalTtcCents, rate);
}

export function vatLabel(rate) {
  return `TVA (${Number(rate) || 0} %)`;
}

/** Invoice numbers are unique and continuous: FA-<année>-<séquence>. */
export function formatInvoiceNumber(year, seq) {
  return `FA-${year}-${String(seq).padStart(5, '0')}`;
}

// Legacy exports for backward compatibility during transition
export const DEFAULT_VAT_RATE = 16;

export function splitVat(amountTtc, rate) {
  const result = splitVatCents(Math.round(amountTtc * 100), rate);
  return {
    ht: result.htCents / 100,
    vat: result.vatCents / 100,
    ttc: result.ttcCents / 100,
    rate: result.rate,
  };
}

export function orderVat(totalTtc, rate = getVatRate()) {
  const result = orderVatCents(Math.round(totalTtc * 100), rate);
  return {
    ht: result.htCents / 100,
    vat: result.vatCents / 100,
    ttc: result.ttcCents / 100,
    rate: result.rate,
  };
}