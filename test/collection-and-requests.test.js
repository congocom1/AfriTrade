import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionView } from '../src/lib/collectionView.js';
import { submitDataRightsRequest } from '../src/lib/dataRightsRequest.js';

test('collection controls search accents and multiple fields while respecting status', () => {
  const records = [
    { id: 1, name: 'Électricité Congo', city: 'Kinshasa', active: true },
    { id: 2, name: 'Électricité Congo', city: 'Goma', active: false },
    { id: 3, name: 'Warehouse 42', city: 'Kinshasa', active: true },
  ];
  const view = collectionView(records, { query: 'electricite kinshasa', fields: ['name', 'city'], predicate: (record) => record.active });
  assert.deepEqual(view.records.map((record) => record.id), [1]);
  assert.equal(view.count, 1);
  assert.deepEqual(collectionView(records, { query: '42', fields: ['name'] }).records.map((record) => record.id), [3]);
  assert.equal(records.length, 3);
});

test('collection pages clamp when refresh/filtering removes the current page', () => {
  const records = Array.from({ length: 25 }, (_, id) => ({ id }));
  const last = collectionView(records, { page: 3, pageSize: 12 });
  assert.deepEqual(last.records, [{ id: 24 }]);
  assert.equal(last.start, 25);
  assert.equal(last.end, 25);
  const smaller = collectionView(records.slice(0, 2), { page: 3, pageSize: 12 });
  assert.equal(smaller.page, 1);
  assert.equal(smaller.records.length, 2);
  const empty = collectionView([], { page: 99 });
  assert.equal(empty.start, 0);
  assert.equal(empty.end, 0);
  assert.equal(empty.totalPages, 1);
  assert.equal(collectionView(records, { page: NaN, pageSize: Infinity }).records.length, 12);
});

test('privacy requests use authenticated ownership and report a request, not deletion', async () => {
  const writes = [];
  const client = {
    auth: { me: async () => ({ email: 'owner@example.test', tenant_id: 'real-tenant' }) },
    entities: { DataRequest: { create: async (record) => { writes.push(record); return { id: 'request-1', ...record }; } } },
  };
  const number = await submitDataRightsRequest(client, { type: 'deletion', name: ' Owner ', email: ' owner@example.test ', tenant_owner_email: 'attacker@example.test', tenant_id: 'wrong-tenant', status: 'completed' });
  assert.match(number, /^DD-\d{4}-/);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, 'Owner');
  assert.equal(writes[0].email, 'owner@example.test');
  assert.equal(writes[0].tenant_owner_email, 'owner@example.test');
  assert.equal(writes[0].tenant_id, 'real-tenant');
  assert.equal(writes[0].status, 'received');
  assert.equal(writes[0].type, 'deletion');
});

test('invalid, anonymous and failed privacy requests never report success', async () => {
  let writes = 0;
  const client = {
    auth: { me: async () => ({ email: 'owner@example.test' }) },
    entities: { DataRequest: { create: async () => { writes++; throw new Error('storage unavailable'); } } },
  };
  await assert.rejects(submitDataRightsRequest(client, { type: 'delete-everything', name: 'Owner', phone: '123' }), /Invalid request/);
  assert.equal(writes, 0);
  await assert.rejects(submitDataRightsRequest(client, { type: 'deletion', name: 'Owner', phone: '123' }), /storage unavailable/);
  client.auth.me = async () => null;
  await assert.rejects(submitDataRightsRequest(client, { type: 'deletion', name: 'Owner', phone: '123' }), /Authentication required/);
  assert.equal(writes, 1);
});
