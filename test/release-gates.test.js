import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const read = path => readFileSync(path, 'utf8');
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

describe('release security architecture gates', () => {
  it('does not contain a Base44 user bearer token in application source or tracked config', () => {
    const files = [...walk('src'), ...walk('base44'), '.env.example'];
    for (const file of files) if (/\.(?:js|jsx|ts|tsx|jsonc?|env|example)$/.test(file)) {
      assert.doesNotMatch(read(file), /b44u_[a-zA-Z0-9]{20,}/, `Credential exposed in ${file}`);
    }
  });
  it('prevents direct tenant membership modifications by non-admin actors', () => {
    const schema = JSON.parse(read('base44/entities/TenantMember.jsonc'));
    for (const action of ['create', 'update', 'delete']) {
      assert.deepEqual(schema.rls[action], { user_condition: { role: 'admin' } });
    }
  });
  it('requires authorized audit-log reads', () => {
    const schema = JSON.parse(read('base44/entities/AuditLog.jsonc'));
    assert.ok(schema.rls.read);
    assert.ok(schema.rls.create);
  });
  it('retains the wallet and payment release protocol', () => {
    const policy = read('docs/audit/WALLET_PROTOCOL.md');
    assert.match(policy, /updateMany/);
    assert.match(policy, /staging/i);
    assert.match(policy, /refunds_disabled/);
  });
  it('retains non-deploying staging smoke tests in CI', () => {
    const ci = read('.github/workflows/ci.yml');
    assert.match(ci, /STAGING_BASE_URL/);
    assert.match(ci, /playwright test/);
    assert.match(ci, /route-guards\.spec\.js/);
    assert.match(ci, /deployment-parity\.spec\.js/);
    assert.match(ci, /assets:check/);
    assert.match(ci, /security:check/);
    assert.match(read("test/e2e/route-guards.spec.js"), /127\.0\.0\.1:5174/);
    assert.doesNotMatch(ci, /npm run deploy|base44 deploy/);
  });
});
