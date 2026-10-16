import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as fulfillmentAccess from '../base44/shared/fulfillmentAccess.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePath = path.join(root, 'base44/functions/fulfillmentAction/entry.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
let moduleSequence = 0;

function transpile(sourceText) {
  return ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

async function loadHandler(dependencies) {
  globalThis.__fulfillmentActionDependencies = dependencies;
  const rewrites = [
    [
      /import\s+\{\s*createClientFromRequest\s*\}\s+from\s+["']npm:@base44\/sdk@[^"']+["'];?/,
      'const { createClientFromRequest } = globalThis.__fulfillmentActionDependencies;',
    ],
    [
      /import\s+\{[\s\S]*?\}\s+from\s+["']\.\.\/\.\.\/shared\/fulfillmentAccess\.js["'];?/,
      'const { courierMayAct, INTL_RECEIVABLE, isInternational, INTL_STATUS_FLOW, sellerMayAct, TERMINAL, validAdvance, validCourierAdvance } = globalThis.__fulfillmentActionDependencies.fulfillmentAccess;',
    ],
    [
      /import\s+\{\s*releasePending\s*\}\s+from\s+["']\.\.\/\.\.\/shared\/walletLedger\.ts["'];?/,
      'const { releasePending } = globalThis.__fulfillmentActionDependencies.walletLedger;',
    ],
    [
      /import\s+\{[^}]+\}\s+from\s+["']\.\.\/\.\.\/shared\/securityHeaders\.ts["'];?/,
      'const { addSecurityHeaders, checkRateLimit, getClientKey, rateLimitErrorResponse } = globalThis.__fulfillmentActionDependencies.securityHeaders;',
    ],
  ];
  let moduleSource = source;
  for (const [pattern, replacement] of rewrites) {
    assert.match(moduleSource, pattern);
    moduleSource = moduleSource.replace(pattern, replacement);
  }
  const modulePath = path.join(path.dirname(fileURLToPath(import.meta.url)), `fulfillmentAction-${++moduleSequence}.testmod.mjs`);
  fs.writeFileSync(modulePath, transpile(moduleSource));
  return import(pathToFileURL(modulePath).href);
}

function baseDependencies({ user, entities }) {
  return {
    createClientFromRequest: () => ({
      auth: { me: async () => user },
      asServiceRole: { entities },
    }),
    fulfillmentAccess,
    walletLedger: { releasePending: async () => ({}) },
    securityHeaders: {
      addSecurityHeaders: (response) => response,
      checkRateLimit: async () => ({ ok: true, used: 1, limit: 120 }),
      getClientKey: () => '192.0.2.10',
      rateLimitErrorResponse: () => Response.json({ error: 'rate limited' }, { status: 429 }),
    },
  };
}

function request(body) {
  return new Request('https://local.test/functions/fulfillmentAction', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('fulfillmentAction endpoint', () => {
  it('rejects an anonymous caller before reading fulfillment data', async () => {
    let fulfillmentReads = 0;
    const entities = { FulfillmentOrder: { get: async () => { fulfillmentReads += 1; return null; } } };
    const handler = await loadHandler(baseDependencies({ user: null, entities }));
    const response = await handler.default(request({ action: 'advance', fulfillment_id: 'fo-1', status: 'CONFIRMED' }));

    assert.equal(response.status, 401);
    assert.equal(fulfillmentReads, 0);
  });

  it('does not allow an admin to skip fulfillment milestones', async () => {
    let updates = 0;
    const fulfillment = { id: 'fo-1', order_id: 'order-1', order_number: 'ORD-1', seller_id: 'seller-1', status: 'PENDING', source_type: 'local_seller' };
    const entities = {
      FulfillmentOrder: {
        get: async () => fulfillment,
        update: async () => { updates += 1; return fulfillment; },
      },
      Order: { get: async () => ({ id: 'order-1', order_number: 'ORD-1', payment_status: 'PAID', payment_verified: true }) },
    };
    const handler = await loadHandler(baseDependencies({ user: { id: 'admin-1', email: 'admin@example.test', role: 'admin' }, entities }));
    const response = await handler.default(request({ action: 'advance', fulfillment_id: 'fo-1', status: 'DELIVERED' }));

    assert.equal(response.status, 409);
    assert.equal(updates, 0);
  });

  it('allows a valid authenticated admin transition and audits it', async () => {
    const fulfillment = { id: 'fo-1', order_id: 'order-1', order_number: 'ORD-1', seller_id: 'seller-1', status: 'PENDING', source_type: 'local_seller' };
    const auditRows = [];
    const entities = {
      FulfillmentOrder: {
        get: async () => fulfillment,
        update: async (_id, patch) => ({ ...fulfillment, ...patch }),
      },
      Order: { get: async () => ({ id: 'order-1', order_number: 'ORD-1', payment_status: 'PAID', payment_verified: true }) },
      Shipment: { filter: async () => [] },
      AuditLog: { create: async (row) => auditRows.push(row) },
    };
    const handler = await loadHandler(baseDependencies({ user: { id: 'admin-1', email: 'admin@example.test', role: 'admin' }, entities }));
    const response = await handler.default(request({ action: 'advance', fulfillment_id: 'fo-1', status: 'CONFIRMED' }));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.fulfillment.status, 'CONFIRMED');
    assert.equal(auditRows[0].action, 'fulfillment.status_changed');
  });
});
