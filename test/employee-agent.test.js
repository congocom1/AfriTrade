import fs from 'node:fs';
import assert from 'node:assert/strict';
import { it } from 'node:test';

it('employee task automation is admin gated, bounded, and requires explicit approval', () => {
  const source = fs.readFileSync('base44/functions/employee-workspace/entry.ts', 'utf8');
  assert.match(source, /body\.action === 'automate_tasks'/);
  assert.match(source, /if \(!admin\) fail\(403, 'ACCESS_DENIED'\)/);
  assert.match(source, /typeof body\.apply !== 'boolean'/);
  assert.match(source, /if \(!body\.apply\) return respond/);
  assert.match(source, /slice\(0, 50\)/);
  assert.match(source, /current\.assignee_id/);
});
