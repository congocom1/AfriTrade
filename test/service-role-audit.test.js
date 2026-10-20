import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// R-003 regression tripwire: every server function that writes with service-role
// privileges must enforce a trust boundary before doing privileged work.
// See docs/audit/OPEN_RISKS.md (R-003).

const functionsDir = fileURLToPath(new URL('../base44/functions/', import.meta.url));
const repoRoot = fileURLToPath(new URL('../', import.meta.url));

// ponytail: presence-only markers — a guard that is imported but never called would
// still pass. Upgrade to per-function call-graph checks if a false negative is found.
const GUARD = /requireAdmin\(|requireAuth\(|jwtVerify\(|auth\.me\(/;

// Trust boundary is a single-use capability token, not a session: the email
// recipient clicking the verification link has no account to sign in with.
const CAPABILITY_TOKEN = new Set(['verifyDataRequest']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe('service-role audit (R-003)', () => {
  it('guards every asServiceRole function with a trust boundary', () => {
    const offenders = [];
    let scanned = 0;
    for (const file of walk(functionsDir)) {
      if (!file.endsWith('entry.ts')) continue;
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes('asServiceRole')) continue;
      scanned++;
      const fn = path.basename(path.dirname(file));
      if (CAPABILITY_TOKEN.has(fn)) continue;
      if (!GUARD.test(src)) offenders.push(path.relative(repoRoot, file));
    }
    // The scan itself must see the expected surface; an empty result means the
    // walker broke, not that every function is safe.
    assert.ok(scanned >= 40, `scanned only ${scanned} asServiceRole functions`);
    assert.deepEqual(offenders, [], `asServiceRole without trust boundary: ${offenders.join(', ')}`);
  });
});