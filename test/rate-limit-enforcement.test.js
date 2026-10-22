import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

/** Strips every import statement — single-line and multi-line alike. */
function stripImports(src) {
  return src.replace(/^import[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*\r?\n/gm, '');
}

async function load(path, preamble) {
  const src = stripImports(readFileSync(path, 'utf8'));
  assert.doesNotMatch(src, /^import /m, `Unmocked import in ${path}`);
  const code = ts.transpileModule(`${preamble}\n${src}`, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

const serviceRoleAccesses = [];
const asServiceRole = new Proxy({}, {
  get(_target, name) {
    serviceRoleAccesses.push(String(name));
    throw new Error(`service-role access must not happen: ${String(name)}`);
  },
});

let rateLimitCalls = [];
let rateLimitResult = { ok: true, used: 1, limit: 10 };
let rateLimitUnavailable = false;
let adminResult = { ok: true, user: { role: 'admin' } };

const deps = {
  createClientFromRequest: () => ({
    auth: { me: async () => (adminResult.ok ? adminResult.user : null) },
    asServiceRole,
  }),
  requireAdmin: async () => adminResult,
  addSecurityHeaders: (res) => res,
  getClientKey: () => 'test-client',
  checkRateLimit: async (db, key, config) => {
    rateLimitCalls.push({ db, key, config });
    if (rateLimitUnavailable) return { ok: false, used: 0, limit: config?.limit ?? 10, unavailable: true };
    return rateLimitResult;
  },
  rateLimitErrorResponse: (result) =>
    result?.unavailable
      ? Response.json({ error: 'Service temporairement indisponible.', status: 'unavailable' }, { status: 503 })
      : Response.json({ error: 'limited' }, { status: 429 }),
  escapeHtml: (s) => String(s ?? ''),
  typeLabel: () => 'Request',
  verificationUrl: () => 'https://example.test/verify',
  buildCsv: () => 'csv',
  dedupeById: (rows) => rows,
  frenchDate: () => '01/01/2026',
  toBase64: (s) => s,
  hoursSince: () => 1,
  money: () => '$1',
  orderNumber: () => 'ORD-1',
  paymentState: () => ({ paid: false, closed: false }),
  resolveFulfillment: async () => ({ fulfillment: {}, order: {} }),
  tenantOf: () => ({}),
  addDays: () => new Date('2026-01-08'),
  discountCode: () => 'SAVE10',
};
globalThis.__rateLimitDeps = deps;

const PREAMBLE = `const { createClientFromRequest, requireAdmin, addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse, escapeHtml, typeLabel, verificationUrl, buildCsv, dedupeById, frenchDate, toBase64, hoursSince, money, orderNumber, paymentState, resolveFulfillment, tenantOf, addDays, discountCode } = globalThis.__rateLimitDeps;`;

const HANDLERS = [
  { name: 'sendDataRequestVerification', path: 'base44/functions/sendDataRequestVerification/entry.ts', body: { request_id: 'request-1' } },
  { name: 'sendUnpaidReminder', path: 'base44/functions/sendUnpaidReminder/entry.ts', body: { fulfillment_id: 'fulfillment-1' } },
  { name: 'sendUnpaidDiscountEmail', path: 'base44/functions/sendUnpaidDiscountEmail/entry.ts', body: { fulfillment_id: 'fulfillment-1' } },
  { name: 'emailDataReport', path: 'base44/functions/emailDataReport/entry.ts', body: { request_id: 'request-1' } },
];

const handlers = new Map();
for (const handler of HANDLERS) {
  handlers.set(handler.name, (await load(handler.path, PREAMBLE)).default);
}

function post(name, body) {
  return new Request(`https://example.test/functions/${name}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function reset() {
  rateLimitCalls = [];
  rateLimitResult = { ok: true, used: 1, limit: 10 };
  rateLimitUnavailable = false;
  adminResult = { ok: true, user: { role: 'admin' } };
  serviceRoleAccesses.length = 0;
}

describe('sensitive functions enforce a real rate limit', () => {
  for (const { name, body } of HANDLERS) {
    it(`${name} counts against a live counter, not a no-op check`, async () => {
      reset();
      await handlers.get(name)(post(name, body));

      const enforced = rateLimitCalls.filter((call) => call.db);
      assert.ok(enforced.length > 0, `${name} never called checkRateLimit with a database`);
      for (const call of enforced) {
        assert.equal(call.db, asServiceRole, `${name} passed the wrong database`);
        assert.ok(call.config?.keyPrefix, `${name} is missing a rate limit key prefix`);
        assert.ok(call.config?.limit > 0, `${name} has no rate limit threshold`);
        assert.ok(call.config?.windowMs > 0, `${name} has no rate limit window`);
        // A broken counter table must deny the call, not wave it through.
        assert.equal(call.config?.failClosed, true, `${name} does not fail closed when the counter is unavailable`);
      }
    });

    it(`${name} refuses the request before any work when the limit is spent`, async () => {
      reset();
      rateLimitResult = { ok: false, used: 10, limit: 10 };
      const response = await handlers.get(name)(post(name, body));

      assert.equal(response.status, 429, `${name} did not answer 429 when limited`);
      assert.deepEqual(serviceRoleAccesses, [], `${name} touched service-role data while limited`);
    });

    it(`${name} rejects an anonymous caller before the rate limiter runs`, async () => {
      reset();
      adminResult = { ok: false, response: Response.json({ error: 'Denied' }, { status: 401 }) };
      const response = await handlers.get(name)(post(name, body));

      assert.equal(response.status, 401, `${name} did not answer 401 for an anonymous caller`);
      assert.equal(rateLimitCalls.length, 0, `${name} consumed a rate limit slot for a rejected caller`);
      assert.deepEqual(serviceRoleAccesses, [], `${name} touched service-role data for a rejected caller`);
    });

    for (const status of [401, 403]) {
      for (const input of ['empty', 'malformed', 'GET']) {
        it(`${name} returns ${status} before reading ${input} input`, async () => {
          reset();
          adminResult = { ok: false, response: Response.json({ error: 'Denied' }, { status }) };
          const request = input === 'GET'
            ? new Request(`https://example.test/functions/${name}`)
            : new Request(`https://example.test/functions/${name}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: input === 'empty' ? '{}' : '{invalid',
            });
          const response = await handlers.get(name)(request);

          assert.equal(response.status, status);
          assert.equal(request.bodyUsed, false, 'Rejected input must not be parsed');
          assert.equal(rateLimitCalls.length, 0);
          assert.deepEqual(serviceRoleAccesses, []);
        });
      }
    }

    it(`${name} rejects a non-administrator caller`, async () => {
      reset();
      adminResult = { ok: false, response: Response.json({ error: 'Denied' }, { status: 403 }) };
      const response = await handlers.get(name)(post(name, body));

      assert.equal(response.status, 403, `${name} did not answer 403 for a non-administrator`);
      assert.deepEqual(serviceRoleAccesses, [], `${name} touched service-role data for a rejected caller`);
    });

    it(`${name} fails closed when the counter storage is unavailable`, async () => {
      reset();
      // A broken counter table must not authorise the call.
      rateLimitUnavailable = true;
      const response = await handlers.get(name)(post(name, body));

      assert.equal(response.status, 503, `${name} did not refuse the call when the counter was unavailable`);
      assert.deepEqual(serviceRoleAccesses, [], `${name} touched service-role data while the counter was down`);
    });
  }
});