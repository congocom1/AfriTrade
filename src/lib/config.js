import { base44 } from '@/api/base44Client';
import { setCdfRateCents } from './format';

/**
 * Every commercial rule lives here (or in the PlatformSetting records that override it).
 * Nothing country-specific is hard-coded inside pages or the commerce engine.
 */
export const DEFAULT_PRICING_CONFIG = {
  platform_margin_percent: 12,
  payment_fee_percent: 2.5,
  seller_commission_percent: 10,
  creator_commission_percent: 8,
  import_cost_percent: 7,
  international_shipping_usd: 9,
  local_logistics_usd: 2.5,
  free_shipping_threshold_usd: 60,
};

export const DEFAULT_COUNTRY_CONFIG = {
  code: 'NG',
  name: 'Nigeria',
  default_currency: 'NGN',
  currencies: ['NGN', 'USD'],
  usd_to_ngn_rate: 1500,
  timezone: 'Africa/Lagos',
  phone_prefix: '+234',
  languages: ['en', 'yo', 'ig'],
  cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Abeokuta', 'Jos'],
};

// All supported African countries for pan-African marketplace
export const AFRICAN_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', phone: '+234', languages: ['en', 'yo', 'ig'], timezone: 'Africa/Lagos' },
  { code: 'KE', name: 'Kenya', currency: 'KES', phone: '+254', languages: ['en', 'sw'], timezone: 'Africa/Nairobi' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', phone: '+233', languages: ['en'], timezone: 'Africa/Accra' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', phone: '+237', languages: ['en', 'fr'], timezone: 'Africa/Douala' },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', phone: '+243', languages: ['fr', 'ln', 'sw'], timezone: 'Africa/Kinshasa' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', phone: '+225', languages: ['fr'], timezone: 'Africa/Abidjan' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', phone: '+221', languages: ['fr', 'wo'], timezone: 'Africa/Dakar' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', phone: '+20', languages: ['ar', 'en'], timezone: 'Africa/Cairo' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', phone: '+27', languages: ['en', 'zu', 'xh'], timezone: 'Africa/Johannesburg' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', phone: '+212', languages: ['ar', 'fr'], timezone: 'Africa/Casablanca' },
];

/** TVA and invoicing rules. */
export const DEFAULT_TAX_CONFIG = {
  enabled: true,
  vat_rate: 16,
  invoice_note: 'Prix TTC — TVA acquittée sur les encaissements.',
};

/** Legal identity feeding the legal pages, the footer and every invoice header. */
export const DEFAULT_COMPANY_CONFIG = {
  legal_name: '',
  trade_name: 'AfriTrade',
  legal_form: '',
  rccm: '',
  nif: '',
  vat_number: '',
  capital: '',
  address: '',
  city: 'Lagos',
  country: 'Pan-African',
  email: '',
  phone: '',
  publisher: '',
  data_contact: '',
  host_name: '',
  host_address: '',
  host_contact: '',
};

let cache = null;
let inflight = null;

export async function loadPlatformConfig(force = false) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    let pricing = DEFAULT_PRICING_CONFIG;
    let country = DEFAULT_COUNTRY_CONFIG;
    let tax = DEFAULT_TAX_CONFIG;
    let company = DEFAULT_COMPANY_CONFIG;
    try {
      const rows = await base44.entities.PlatformSetting.list();
      const byKey = {};
      rows.forEach((r) => { byKey[r.key] = r.value || {}; });
      pricing = { ...DEFAULT_PRICING_CONFIG, ...(byKey.pricing || {}) };
      country = { ...DEFAULT_COUNTRY_CONFIG, ...(byKey.country || {}) };
      tax = { ...DEFAULT_TAX_CONFIG, ...(byKey.tax || {}) };
      company = { ...DEFAULT_COMPANY_CONFIG, ...(byKey.company || {}) };
    } catch {
      // Settings unavailable — fall back to defaults so the storefront still works.
    }
    // Convert rate to cents per USD (rate * 100) for integer arithmetic
    setCdfRateCents(Math.round(country.usd_to_cdf_rate * 100));
    cache = { pricing, country, tax, company };
    return cache;
  })();
  return inflight;
}

export function getPricingConfig() {
  return cache?.pricing || DEFAULT_PRICING_CONFIG;
}

export function getCountryConfig() {
  return cache?.country || DEFAULT_COUNTRY_CONFIG;
}

export function getTaxConfig() {
  return cache?.tax || DEFAULT_TAX_CONFIG;
}

export function getCompanyConfig() {
  return cache?.company || DEFAULT_COMPANY_CONFIG;
}

export function getCities() {
  return getCountryConfig().cities || DEFAULT_COUNTRY_CONFIG.cities;
}