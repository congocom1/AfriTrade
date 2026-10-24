import { createClientFromRequest } from "npm:@base44/sdk@0.8.57";
import { secrets } from "base44:runtime";

/**
 * MainMoney aggregator proxy for the AfriTrade checkout.
 *
 * The browser SDK (@mainmoneyapp/js-checkout) never holds merchant credentials:
 * every call lands here and only the fixed routes below reach the aggregator.
 * Deposit amount and reference are set from the order record, never from the
 * browser, and an order only turns PAID after the aggregator confirms it.
 */

const REQUEST_TIMEOUT_MS = 20000;
const TOKEN_TTL_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_MS = 60000;

let cachedToken = "";
let cachedTokenUntil = 0;

const ROUTES = {
  countries: { method: "GET", path: "manage/general/countries/" },
  providers: {
    method: "GET",
    path: "manage/general/financial-entities/",
    query: ["country", "operation_type"],
  },
  matchProvider: {
    method: "GET",
    path: "transactions/customers/match-provider/",
    query: ["account_number", "get_lookup", "operation_type"],
  },
  amountLimits: {
    method: "GET",
    path: "manage/general/amount-limits/",
    query: ["financial_entity_code", "currency", "operation_type"],
  },
  checkoutPreferences: { method: "GET", path: "manage/general/checkout-preferences/" },
  feesSimulate: {
    method: "POST",
    path: "manage/general/fees/simulate/",
    body: ["provider_code", "operation_type", "amount", "currency", "fees"],
  },
  deposits: {
    method: "POST",
    path: "transactions/deposits/",
    body: ["provider_code", "reference", "amount", "currency", "customer_phone", "customer_name", "customer_email", "fees"],
  },
};

function aggregatorBaseUrl() {
  const raw = String(secrets.get("MM_BASE_URL") || "").trim();
  if (raw === "") {
    throw new Error(
      "Paiement MainMoney non configuré : ajoutez MM_BASE_URL, MM_CLIENT_ID et MM_API_SECRET dans les secrets de l'application.",
    );
  }
  return raw.replace(/\/+$/, "");
}

async function readJson(response) {
  const text = await response.text();
  if (text === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function getAccessToken(baseUrl) {
  const now = Date.now();
  if (cachedToken !== "" && cachedTokenUntil > now) return cachedToken;

  const response = await fetch(`${baseUrl}/auth/tokens/exchange/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: secrets.get("MM_CLIENT_ID"),
      secret: secrets.get("MM_API_SECRET"),
      expires_in: TOKEN_TTL_SECONDS,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await readJson(response);
  const token = data && typeof data.access_token === "string" ? data.access_token : "";
  if (!response.ok || token === "") {
    throw new Error("Authentification MainMoney refusée : vérifiez MM_CLIENT_ID et MM_API_SECRET.");
  }
  const expiresIn = Number(data.expires_in) > 0 ? Number(data.expires_in) : TOKEN_TTL_SECONDS;
  cachedToken = token;
  cachedTokenUntil = now + expiresIn * 1000 - TOKEN_REFRESH_MARGIN_MS;
  return token;
}

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function forward(spec, payload, baseUrl) {
  const token = await getAccessToken(baseUrl);
  const params = new URLSearchParams();
  for (const key of spec.query || []) {
    const value = payload?.query?.[key];
    if (value !== undefined && value !== null && String(value) !== "") params.set(key, String(value));
  }
  const headers = authHeaders(token);
  if (typeof payload?.idempotencyKey === "string" && payload.idempotencyKey !== "") {
    headers["Idempotency-Key"] = payload.idempotencyKey;
  }
  const init = {
    method: spec.method,
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };
  if (spec.method === "POST") {
    const body = {};
    for (const key of spec.body || []) {
      const value = payload?.body?.[key];
      if (value !== undefined && value !== null && String(value) !== "") body[key] = value;
    }
    init.body = JSON.stringify(body);
  }
  const query = params.toString();
  const url = `${baseUrl}/${spec.path}${query === "" ? "" : `?${query}`}`;
  const response = await fetch(url, init);
  return { status: response.status, body: await readJson(response) };
}

async function fetchDepositStatus(baseUrl, reference, operation) {
  const token = await getAccessToken(baseUrl);
  const safeOperation = /^[a-z_]+$/i.test(operation) ? operation : "deposit";
  const response = await fetch(`${baseUrl}/transactions/status/check/${safeOperation}/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reference }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, body: await readJson(response) };
}

function statusOf(body) {
  const data = body && typeof body === "object" && body.response_data ? body.response_data : body;
  return data && typeof data.status === "string" ? data.status.toUpperCase() : "";
}

/** The order behind a payment attempt, with the caller's right to pay it checked. */
async function loadPayableOrder(db, user, orderNumber) {
  const orders = await db.entities.Order.filter({ order_number: orderNumber }).catch(() => []);
  const order = Array.isArray(orders) ? orders[0] : null;
  if (!order) return { error: { error: "Commande introuvable." }, status: 404 };
  if (order.created_by_id !== user.id && user.role !== "admin") {
    return { error: { error: "Forbidden" }, status: 403 };
  }
  if (String(order.payment_method || "").toLowerCase() !== "mainmoney") {
    return { error: { error: "Cette commande n'est pas réglée par Mobile Money." }, status: 409 };
  }
  return { order };
}

/**
 * The wizard's reference is the order number and the amount comes from the
 * order record, so a caller cannot pay a smaller amount for a bigger order.
 */
async function prepareDeposit(db, user, payload) {
  const reference = String(payload?.body?.reference || "").trim();
  if (reference === "") return { error: { error: "reference est requis." }, status: 400 };

  const loaded = await loadPayableOrder(db, user, reference);
  if (loaded.error) return loaded;
  const { order } = loaded;
  if (order.payment_status === "PAID") {
    return { error: { error: "Cette commande est déjà payée." }, status: 409 };
  }

  return {
    payload: {
      idempotencyKey: payload?.idempotencyKey,
      body: {
        ...payload?.body,
        reference: order.order_number,
        amount: Number(order.total_usd || 0).toFixed(2),
        currency: "USD",
      },
    },
  };
}

async function verifyOrder(base44, user, payload) {
  const orderNumber = String(payload?.body?.order_number || "").trim();
  if (orderNumber === "") return Response.json({ error: "order_number est requis." }, { status: 400 });

  const db = base44.asServiceRole;
  const loaded = await loadPayableOrder(db, user, orderNumber);
  if (loaded.error) return Response.json(loaded.error, { status: loaded.status });
  const { order } = loaded;
  if (order.payment_status === "PAID") {
    return Response.json({ paid: true, status: "SUCCESS", already_paid: true });
  }

  const result = await fetchDepositStatus(aggregatorBaseUrl(), order.order_number, "deposit");
  const status = statusOf(result.body);
  if (status !== "SUCCESS") {
    return Response.json({ paid: false, status: status || "PENDING" });
  }

  await db.entities.Order.update(order.id, {
    payment_status: "PAID",
    payment_verified: true,
    payment_reference: order.order_number,
  });
  return Response.json({ paid: true, status: "SUCCESS" });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const route = String(payload?.route || "").trim();

    if (route === "verifyOrder") {
      return await verifyOrder(base44, user, payload);
    }

    if (route === "status") {
      const reference = String(payload?.body?.reference || payload?.query?.reference || "").trim();
      if (reference === "") return Response.json({ error: "reference est requis." }, { status: 400 });
      const result = await fetchDepositStatus(
        aggregatorBaseUrl(),
        reference,
        String(payload?.query?.operation || "deposit"),
      );
      return Response.json(result);
    }

    if (route === "deposits") {
      const prepared = await prepareDeposit(base44.asServiceRole, user, payload);
      if (prepared.error) return Response.json(prepared.error, { status: prepared.status });
      const result = await forward(ROUTES.deposits, prepared.payload, aggregatorBaseUrl());
      return Response.json(result);
    }

    const spec = ROUTES[route];
    if (!spec) return Response.json({ error: "Route de paiement inconnue." }, { status: 400 });

    const result = await forward(spec, payload, aggregatorBaseUrl());
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error?.message || "Erreur de paiement." }, { status: 500 });
  }
}