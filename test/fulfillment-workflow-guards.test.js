import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(path, preamble) {
  const source = readFileSync(path, 'utf8').replace(/^import[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*\r?\n/gm, '');
  assert.doesNotMatch(source, /^import /m, 'Test import mock must include every import');
  const transpiled = ts.transpileModule(`${preamble}\n${source}`, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);
}

const state = { admin: true, hours: 0, order: null, requestStatus: 'received', writes: 0, sends: 0 };
const service = {
  entities: {
    FulfillmentOrder: { get: async () => ({ id:'f-1', order_id:'o-1', created_date:'2026-01-01T00:00:00Z' }) },
    Order: { get: async () => state.order },
    DataRequest: { get: async () => ({ id:'r-1', email:'buyer@example.test', status:state.requestStatus }) },
    Notification: { filter: async () => [], create: async () => {state.writes++; return {id:'n-1'};} },
    OrderNotification: { filter: async () => [], create: async () => {state.writes++; return {id:'n-1'};} },
  },
  integrations: { Core: { SendEmail: async () => { state.sends++; } } },
};
const deps = {
  createClientFromRequest: () => ({ asServiceRole:service }),
  requireAdmin: async () => state.admin ? {ok:true,user:{role:'admin'}} : {ok:false,response:Response.json({error:'unauthorized'},{status:401})},
  addSecurityHeaders: (r) => r,
  getClientKey: () => 'test-client',
  checkRateLimit: async () => ({ok:true}),
  rateLimitErrorResponse: () => Response.json({error:'limited'},{status:429}),
  resolveFulfillment: async () => ({fulfillment: await service.entities.FulfillmentOrder.get(),order:state.order}),
  paymentState: (_f,o) => ({paid:o?.payment_status==='PAID', closed:false,payment_status:o?.payment_status || 'UNKNOWN',fulfillment_status:'NEW'}),
  orderNumber: () => 'O-1',
  hoursSince: () => state.hours,
  money: () => '10.00 USD',
  tenantOf: () => ({}),
  addDays: () => '2027-01-01',
  discountCode: () => 'PAY10-TEST',
  frenchDate: () => '01/01/2027',
  buildCsv: () => 'csv',
  dedupeById: (v) => v,
  escapeHtml: (v) => String(v),
  toBase64: (v) => v,
  typeLabel: () => 'Request',
};
globalThis.__workflowSafetyMocks = deps;
const PREAMBLE = 'const {createClientFromRequest,requireAdmin,addSecurityHeaders,getClientKey,checkRateLimit,rateLimitErrorResponse,resolveFulfillment,paymentState,orderNumber,hoursSince,money,tenantOf,addDays,discountCode,frenchDate,buildCsv,dedupeById,escapeHtml,toBase64,typeLabel} = globalThis.__workflowSafetyMocks;';
const names = ['checkFulfillmentPayment','sendUnpaidReminder','sendUnpaidDiscountEmail','emailDataReport'];
const handlers = {};
for (const name of names) handlers[name] = (await load(`base44/functions/${name}/entry.ts`,PREAMBLE)).default;
function req(name){return new Request('https://example.test/functions/'+name, {method:'POST',body:JSON.stringify(name==='emailDataReport'?{request_id:'r-1'}:{fulfillment_id:'f-1'}),headers:{'Content-Type':'application/json'}});}
function reset(){state.admin=true; state.hours=0;state.order=null;state.requestStatus='received';state.writes=0;state.sends=0;}

describe('safety invariants for customer messaging workflows (mocked Base44)',()=>{
  for(const name of names) {
    it(`${name} refuses unauthorized callers`,async()=>{ reset();state.admin=false;const res=await handlers[name](req(name));assert.equal(res.status,401);assert.equal(state.writes,0);assert.equal(state.sends,0);});
  }
  for(const name of ['checkFulfillmentPayment','sendUnpaidReminder','sendUnpaidDiscountEmail']) {
    it(`${name} does not turn unknown payment status into an unpaid message`,async()=>{reset(); const res=await handlers[name](req(name));assert.equal(res.status,503);assert.equal(state.writes,0);assert.equal(state.sends,0);});
  }
  it('one-hour reminder is not permitted before the full hour',async()=>{reset(); state.order={id:'o-1',payment_status:'PENDING'};state.hours=0;const res=await handlers.sendUnpaidReminder(req('sendUnpaidReminder'));assert.equal(res.status,200);assert.equal((await res.json()).skipped,true);assert.equal(state.writes,0);});
  it('24-hour discount is not permitted before the full day',async()=>{reset(); state.order={id:'o-1',payment_status:'PENDING'};state.hours=23;const res=await handlers.sendUnpaidDiscountEmail(req('sendUnpaidDiscountEmail'));assert.equal(res.status,200);assert.equal((await res.json()).skipped,true);assert.equal(state.writes,0);assert.equal(state.sends,0);});
  it('data report cannot be mailed before compliance status ready',async()=>{reset();const res=await handlers.emailDataReport(req('emailDataReport'));assert.equal(res.status,409);assert.equal(state.writes,0);assert.equal(state.sends,0);});
});
