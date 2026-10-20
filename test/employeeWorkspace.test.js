import fs from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ts from 'typescript';

const original = fs.readFileSync(new URL('../base44/functions/employee-workspace/entry.ts', import.meta.url), 'utf8');
let sequence = 0;
async function setup({ user = { id: 'worker', email: 'worker@test.example', role: 'user' }, member = { id: 'membership', user_id: 'worker', email: 'worker@test.example', active: true, departments: ['sales'], access_scope: 'assigned' }, task = { id: 'task', department: 'sales', assignee_id: 'worker', status: 'todo' }, tasks = [] } = {}) {
  const calls = [];
  const entities = {
    EmployeeMembership: {
      filter: async query => { calls.push(['membership', query]); return member ? [member] : []; },
      list: async () => member ? [member] : [],
      update: async (id, patch) => { calls.push(['member-update', id, patch]); return { id, ...patch }; },
      create: async patch => { calls.push(['member-create', patch]); return { id: 'new-member', ...patch }; },
    },
    User: { filter: async () => [{ id: 'worker', email: 'worker@test.example', full_name: 'Worker' }] },
    DepartmentTask: {
      filter: async query => { calls.push(['tasks', query]); return tasks; },
      get: async () => task,
      create: async patch => { calls.push(['create', patch]); return { id: 'new-task', ...patch }; },
      update: async (id, patch) => { calls.push(['update', id, patch]); return { ...task, ...patch }; },
    },
  };
  const dependencyKey = `__workforce${++sequence}`;
  globalThis[dependencyKey] = { createClientFromRequest: () => ({ auth: { me: async () => user }, asServiceRole: { entities } }), addSecurityHeaders: response => response };
  const source = original.replace(/import .* from 'npm:@base44\/sdk@[^']+';/, `const { createClientFromRequest } = globalThis.${dependencyKey};`).replace(/import .* from '..\/..\/shared\/securityHeaders.ts';/, `const { addSecurityHeaders } = globalThis.${dependencyKey};`);
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const handler = (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}#${sequence}`)).default;
  const request = async body => {
    const result = await handler(new Request('https://test.example/function', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    return { status: result.status, body: await result.json() };
  };
  return { request, calls, entities };
}
const admin = { id: 'admin', email: 'admin@test.example', role: 'admin' };
describe('remote employee trust boundaries', () => {
  it('rejects anonymous callers before data access', async () => {
    const app = await setup({ user: null });
    assert.equal((await app.request({ action: 'tasks', department: 'sales' })).status, 401);
    assert.equal(app.calls.length, 0);
  });
  it('gives regular customers no departments and denies internal tasks', async () => {
    const app = await setup({ member: null });
    assert.deepEqual((await app.request({ action: 'bootstrap' })).body.departments, []);
    assert.equal((await app.request({ action: 'tasks', department: 'sales' })).status, 403);
  });
  it('filters assigned queues using the authenticated user, ignoring a spoofed user', async () => {
    const app = await setup();
    assert.equal((await app.request({ action: 'tasks', department: 'sales', assignee_id: 'victim' })).status, 200);
    assert.deepEqual(app.calls.find(c => c[0] === 'tasks')[1], { department: 'sales', assignee_id: 'worker' });
  });
  it('rejects cross-department reads and direct task IDs', async () => {
    const app = await setup({ task: { id: 'task', department: 'finance', assignee_id: 'worker' } });
    assert.equal((await app.request({ action: 'tasks', department: 'finance' })).status, 403);
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'done' })).status, 403);
    assert.ok(!app.calls.some(c => c[0] === 'update'));
  });
  it('allows department read access but denies editing another employee task', async () => {
    const app = await setup({ member: { active: true, departments: ['sales'], access_scope: 'department' }, task: { id: 'task', department: 'sales', assignee_id: 'other' } });
    assert.equal((await app.request({ action: 'tasks', department: 'sales' })).status, 200);
    assert.deepEqual(app.calls.find(c => c[0] === 'tasks')[1], { department: 'sales' });
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'done' })).status, 403);
  });
  it('suspension immediately removes access', async () => {
    const app = await setup({ member: { active: false, departments: ['sales'] } });
    assert.deepEqual((await app.request({ action: 'bootstrap' })).body.departments, []);
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'done' })).status, 403);
  });
  it('does not allow employees to grant access, create work, or read the directory', async () => {
    const app = await setup();
    for (const action of ['save_employee', 'create_task', 'team']) assert.equal((await app.request({ action, department: 'sales' })).status, 403);
  });
  it('allows an owned update but ignores assignee, department and actor injection', async () => {
    const app = await setup();
    const result = await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'blocked', handoff_note: 'Waiting for approval', assignee_id: 'victim', updated_by_id: 'admin', priority: 'urgent' });
    assert.equal(result.status, 200);
    const patch = app.calls.find(c => c[0] === 'update')[2];
    assert.equal(patch.updated_by_id, 'worker');
    assert.equal(patch.status, 'blocked');
    assert.ok(!Object.hasOwn(patch, 'assignee_id'));
    assert.ok(!Object.hasOwn(patch, 'priority'));
  });
  it('validates status and note length before writing', async () => {
    const app = await setup();
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'paid' })).status, 400);
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'done', handoff_note: 'x'.repeat(2001) })).status, 400);
    assert.ok(!app.calls.some(c => c[0] === 'update'));
  });
  it('admin task creation validates department membership and derives assignee identity', async () => {
    const app = await setup({ user: admin });
    const result = await app.request({ action: 'create_task', department: 'sales', title: 'Follow up quote', assignee_id: 'worker', assignee_name: 'Spoofed', priority: 'high' });
    assert.equal(result.status, 200);
    assert.equal(result.body.task.assignee_name, 'worker@test.example');
    assert.equal(result.body.task.created_by_id, 'admin');
    assert.equal((await app.request({ action: 'create_task', department: 'finance', title: 'Review', assignee_id: 'worker', priority: 'normal' })).status, 400);
  });
  it('supports admin reassignment and rejects invalid calendar dates', async () => {
    const app = await setup({ user: admin });
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'todo', assignee_id: '' })).status, 200);
    assert.equal(app.calls.find(c => c[0] === 'update')[2].assignee_id, '');
    assert.equal((await app.request({ action: 'create_task', department: 'sales', title: 'Test', priority: 'normal', due_date: '2026-02-30' })).status, 400);
  });
  it('admin membership derives identity from an existing account and never grants an admin role', async () => {
    const app = await setup({ user: admin });
    const result = await app.request({ action: 'save_employee', email: 'WORKER@test.example', departments: ['sales'], access_scope: 'assigned', active: true, user_id: 'victim', role: 'admin' });
    assert.equal(result.status, 200);
    assert.equal(result.body.employee.user_id, 'worker');
    assert.ok(!Object.hasOwn(result.body.employee, 'role'));
  });
  it('does not report failed persistence as success', async () => {
    const app = await setup();
    app.entities.DepartmentTask.update = async () => null;
    assert.equal((await app.request({ action: 'update_task', department: 'sales', task_id: 'task', status: 'done' })).status, 503);
  });
  it('discloses capped results', async () => {
    const app = await setup({ tasks: Array.from({ length: 201 }, (_, i) => ({ id: String(i) })) });
    const result = await app.request({ action: 'tasks', department: 'sales' });
    assert.equal(result.body.tasks.length, 200);
    assert.equal(result.body.truncated, true);
  });
  it('keeps direct entity CRUD admin-only so clients cannot self-grant membership', () => {
    for (const name of ['EmployeeMembership', 'DepartmentTask']) {
      const schema = JSON.parse(fs.readFileSync(new URL(`../base44/entities/${name}.json`, import.meta.url), 'utf8'));
      for (const action of ['read', 'create', 'update', 'delete']) assert.deepEqual(schema.rls[action], { user_condition: { role: 'admin' } });
    }
  });
});
