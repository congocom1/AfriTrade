import { base44 } from '@/api/base44Client';
import { createSession } from '@mainmoneyapp/js-core';

/**
 * Bridge between the MainMoney checkout SDK and our own backend function.
 *
 * The SDK thinks it is talking to a merchant backend; every request actually
 * goes to the `mainmoney` function, which holds the merchant credentials and
 * forwards only a fixed set of routes to the aggregator.
 */
const MERCHANT_ORIGIN = 'https://mainmoney.local';
export const POLL_URL = `${MERCHANT_ORIGIN}/status`;

const ROUTE_BY_PATH = {
  '/countries': 'countries',
  '/providers': 'providers',
  '/match-provider': 'matchProvider',
  '/amount-limits': 'amountLimits',
  '/checkout-preferences': 'checkoutPreferences',
  '/fees/simulate': 'feesSimulate',
  '/deposits': 'deposits',
  '/status': 'status',
};

function headerValue(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return found ? String(found[1]) : '';
}

async function bridgeFetch(url, init = {}) {
  const parsed = new URL(url, window.location.origin);
  const route = ROUTE_BY_PATH[parsed.pathname];
  if (!route) throw new Error(`Route de paiement inconnue : ${parsed.pathname}`);

  const query = Object.fromEntries(parsed.searchParams.entries());
  const body = typeof init.body === 'string' && init.body !== '' ? JSON.parse(init.body) : undefined;
  const idempotencyKey = headerValue(init.headers, 'Idempotency-Key');

  const response = await base44.functions.invoke('mainmoney', { route, query, body, idempotencyKey });
  const payload = response?.data ?? {};

  if (payload.body !== undefined) {
    return new Response(JSON.stringify(payload.body), {
      status: Number(payload.status) || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(
    JSON.stringify({ success: false, message: payload.error || 'Service de paiement indisponible.' }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  );
}

export function createMainMoneySession({ locale = 'fr', theme } = {}) {
  return createSession({
    merchantBackendUrl: MERCHANT_ORIGIN,
    fetch: bridgeFetch,
    locale,
    theme,
  });
}

/** Server-side confirmation: the order turns PAID only if the aggregator says so. */
export async function verifyMainMoneyOrder(orderNumber) {
  const response = await base44.functions.invoke('mainmoney', {
    route: 'verifyOrder',
    body: { order_number: orderNumber },
  });
  return response?.data ?? {};
}