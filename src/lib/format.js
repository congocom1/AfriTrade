/**
 * FORMATTING UTILITIES
 * All money amounts are stored and calculated as INTEGER CENTS (multiply by 100).
 * Display functions divide by 100 for presentation only.
 * Exchange rate and VAT rate are loaded at runtime from PlatformSetting via config.js.
 */

// Runtime-configurable exchange rate (USD -> CDF), loaded from PlatformSetting at startup.
// Default fallback (1 USD = 2800 CDF). Overridden by loadPlatformConfig().
let CDF_RATE_CENTS = 280000; // 2800.00 * 100 = 280000 cents per USD

export function setCdfRateCents(rateCents) {
  if (typeof rateCents === 'number' && rateCents > 0) {
    CDF_RATE_CENTS = Math.round(rateCents);
  }
}

export function getCdfRateCents() {
  return CDF_RATE_CENTS;
}

/**
 * Convert USD cents to CDF cents using the current exchange rate.
 * Both input and output are integer cents.
 */
export function usdCentsToCdfCents(usdCents) {
  const usd = Math.round(Number(usdCents) || 0);
  // CDF = USD * rate / 100 (since rate is in cents per USD)
  // Result in CDF cents: (usdCents * rateCents) / 100
  return Math.round((usd * CDF_RATE_CENTS) / 100);
}

/**
 * Convert CDF cents to USD cents using the current exchange rate.
 * Both input and output are integer cents.
 */
export function cdfCentsToUsdCents(cdfCents) {
  const cdf = Math.round(Number(cdfCents) || 0);
  // USD = (CDF * 100) / rateCents
  return Math.round((cdf * 100) / CDF_RATE_CENTS);
}

/**
 * Format integer USD cents as a display string (e.g., "$12.34").
 */
export function formatUSD(usdCents) {
  const cents = Math.round(Number(usdCents) || 0);
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format integer CDF cents as a display string (e.g., "34 500 CDF").
 */
export function formatCDF(cdfCents) {
  const cents = Math.round(Number(cdfCents) || 0);
  const units = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(units).replace('CDF', 'CDF');
}

/**
 * Format money in the given currency (USD or CDF).
 * Amount must be in integer cents.
 */
export function formatMoney(amountCents, currency = 'USD') {
  if (currency === 'CDF') return formatCDF(amountCents);
  return formatUSD(amountCents);
}

/**
 * Parse a display string back to integer cents.
 * Handles both USD ($12.34) and CDF (34 500 CDF) formats.
 */
export function parseMoney(str, _currency = 'USD') {
  if (!str) return 0;
  const clean = String(str).replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Round to nearest cent (integer cents).
 * Identity function for integer cents - kept for compatibility.
 */
export function round2Cents(amountCents) {
  return Math.round(Number(amountCents) || 0);
}

/**
 * Legacy round2 for floating-point amounts.
 * @deprecated Use round2Cents with integer cents instead.
 */
export function round2(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/**
 * Format a number with locale-specific grouping (for non-currency display).
 */
export function formatNumber(num, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale).format(Number(num) || 0);
}

/**
 * Relative time formatting (e.g., "il y a 2 jours").
 */
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `il y a ${diffDays} j`;
  if (diffHours > 0) return `il y a ${diffHours} h`;
  if (diffMinutes > 0) return `il y a ${diffMinutes} min`;
  return 'à l\'instant';
}

/**
 * Format a number compactly (e.g., 1.2K, 3.4M).
 */
export function compactNumber(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

/**
 * Format a date string to a localized date string (e.g., "25 jan 2024").
 */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format a date string to a localized date-time string (e.g., "25 jan 2024 14:30").
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a short unique ID.
 */
export function shortId(prefix = '') {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 10000).toString(36).toUpperCase()}`;
}