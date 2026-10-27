import { it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../base44/functions/manage-api-keys/entry.ts', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '')
  .replace('export default async function', 'async function handler');
const compiled = ts.transpileModule(source + '\nexport { revokeKey };', {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { revokeKey } = await import('data:text/javascript;base64,' + Buffer.from(
  'const addSecurityHeaders = response => response;\n' + compiled,
).toString('base64'));

it('does not report revocation when persistence fails', async () => {
  const db = { entities: { ApiKey: {
    get: async () => ({ id: 'key', active: true }),
    update: async () => { throw new Error('database unavailable'); },
  } } };
  const response = await revokeKey(db, 'key');
  assert.equal(response.status, 500);
  assert.notEqual((await response.json()).revoked, true);
});
it('reports successful revocation only after persistence', async () => {
  let persisted;
  const db = { entities: { ApiKey: {
    get: async () => ({ id: 'key', active: true }),
    update: async (_id, patch) => { persisted = patch; return patch; },
  } } };
  const response = await revokeKey(db, 'key');
  assert.equal(response.status, 200);
  assert.equal(persisted.active, false);
  assert.equal((await response.json()).revoked, true);
});
