import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const confirmPath = path.join(root, 'base44/functions/confirm-payment/entry.ts');
const refundPath = path.join(root, 'base44/functions/refund-payment/entry.ts');
const securityPath = path.join(root, 'base44/shared/security.ts');
const securityHeadersPath = path.join(root, 'base44/shared/securityHeaders.ts');

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

async function transpileFile(sourcePath, name) {
  const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), `${name}.testmod.mjs`);
  fs.writeFileSync(outputPath, transpile(fs.readFileSync(sourcePath, 'utf8')));
  return import(pathToFileURL(outputPath).href);
}

function withRuntimeImports(source, { includeWalletLedger = false } = {}) {
  const replacements = [
    [
      /import\s+\{\s*createClientFromRequest\s*\}\s+from\s+["']npm:@base44\/sdk@[^"']+["'];?/,
      'const { createClientFromRequest } = globalThis.__paymentSecurityDeps;',
    ],
    [
      /import\s+\{\s*requireAdmin\s*\}\s+from\s+["']\.\.\/\.\.\/shared\/security\.ts["'];?/,
      'const { requireAdmin } = globalThis.__paymentSecurityDeps.security;',
    ],
    [
      /import\s+\{[^}]+\}\s+from\s+["']\.\.\/\.\.\/shared\/securityHeaders\.ts["'];?/,
      'const { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } = globalThis.__paymentSecurityDeps.securityHeaders;',
    ],
  ];
  if (includeWalletLedger) {
    replacements.push([
      /import\s+\{[^}]+\}\s+from\s+["']\.\.\/\.\.\/shared\/walletLedger\.ts["'];?/,
      'const { postWalletEntry, releasePending } = globalThis.__paymentSecurityDeps.walletLedger;',
    ]);
  }

  for (const [pattern, replacement] of replacements) {
    assert.match(source, pattern, `Expected runtime import ${pattern}`);
    source = source.replace(pattern, replacement);
  }
  return source;
}

async function loadFunction(sourcePath, name, options) {
  const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), `${name}.testmod.mjs`);
  const source = withRuntimeImports(fs.readFileSync(sourcePath, 'utf8'), options);
  fs.writeFileSync(outputPath, transpile(source));
  return import(pathToFileURL(outputPath).href);
}

async function loadDependencies() {
  const [security, securityHeaders] = await Promise.all([
    transpileFile(securityPath, 'payment-security.shared'),
    transpileFile(securityHeadersPath, 'payment-security.headers'),
  ]);
  return { security, securityHeaders };
}

describe('payment security boundaries', () => {
  it('fails closed for legacy refunds without reading orders or moving money', async () => {
    const dependencies = await loadDependencies();
    const entities = new Proxy({
      ApiRateLimit: { filter: async () => [], create: async () => ({}) },
    }, {
      get(target, key) {
        if (!(key in target)) assert.fail(`Disabled refund accessed ${String(key)}`);
        return target[key];
      },
    });
    globalThis.__paymentSecurityDeps = {
      ...dependencies,
      createClientFromRequest: () => ({ auth: { me: async () => ({ role: 'admin' }) }, asServiceRole: { entities } }),
      walletLedger: {
        postWalletEntry: async () => assert.fail('Disabled refund moved money'),
        releasePending: async () => assert.fail('Disabled refund released funds'),
      },
    };
    const handler = await loadFunction(refundPath, 'refund-payment.disabled', { includeWalletLedger: true });
    const response = await handler.default(new Request('https://local.test', {
      method: 'POST', body: JSON.stringify({ order_number: 'CMD-1', amount: 10 }),
    }));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'refunds_disabled');
  });

  it('rejects anonymous payment confirmation before reading or updating an order', async () => {
    const dependencies = await loadDependencies();
    let orderReads = 0;
    let orderUpdates = 0;
    const base44 = {
      auth: { me: async () => null },
      asServiceRole: {
        entities: {
          ApiRateLimit: {
            filter: async () => [],
            create: async () => ({}),
          },
          Order: {
            filter: async () => {
              orderReads += 1;
              return [{ id: 'order-1', order_number: 'CMD-1' }];
            },
            update: async () => {
              orderUpdates += 1;
              return {};
            },
          },
        },
      },
    };
    globalThis.__paymentSecurityDeps = {
      ...dependencies,
      createClientFromRequest: () => base44,
    };
    const handler = await loadFunction(confirmPath, 'confirm-payment.security');
    const response = await handler.default(new Request('https://local.test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
      body: JSON.stringify({ order_number: 'CMD-1', session_id: 'forged-session' }),
    }));

    assert.equal(response.status, 401);
    assert.equal(orderReads, 0);
    assert.equal(orderUpdates, 0);
  });

  it('uses a verified user id or an order-specific refund wallet, never session or display name', async () => {
    const dependencies = await loadDependencies();
    globalThis.__paymentSecurityDeps = {
      ...dependencies,
      createClientFromRequest: () => ({}),
      walletLedger: { postWalletEntry: async () => ({}), releasePending: async () => ({}) },
    };
    const handler = await loadFunction(refundPath, 'refund-payment.security', { includeWalletLedger: true });
    const unverifiedDb = { entities: { User: { get: async () => null } } };
    const unverifiedOrder = {
      id: 'order-guest',
      created_by_id: 'victim@example.test',
      session_id: 'attacker-chosen-session',
      customer_name: 'Victim',
    };
    const guestIdentity = await handler.resolveRefundWalletIdentity(unverifiedDb, unverifiedOrder);

    assert.deepEqual(guestIdentity, {
      ownerId: 'refund-order:order-guest',
      createdById: '',
      ownerEmail: '',
    });
    const refundSource = fs.readFileSync(refundPath, 'utf8');
    assert.match(refundSource, /resolveRefundWalletIdentity\(db, order\)/);
    assert.doesNotMatch(refundSource, /Wallet\.filter\(\{[^}]*owner_name:\s*order\.customer_name/);
    assert.doesNotMatch(refundSource, /Wallet\.filter\(\{[^}]*owner_id:\s*sessionId/);

    const verifiedDb = {
      entities: { User: { get: async (id) => ({ id, email: 'buyer@example.test' }) } },
    };
    const accountIdentity = await handler.resolveRefundWalletIdentity(verifiedDb, {
      ...unverifiedOrder,
      created_by_id: 'user-123',
    });
    assert.deepEqual(accountIdentity, {
      ownerId: 'user-123',
      createdById: 'user-123',
      ownerEmail: 'buyer@example.test',
    });
  });
});
