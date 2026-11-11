import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutApi } from './checkoutApi.js';

Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=> 'customer-token'},configurable:true});
test('customer checkout sends authentication and retry key and reads the real order envelope', async context => {
  let sent;
  context.mock.method(globalThis,'fetch',async (url,options)=>{
    sent={url,options}; return {ok:true,json:async()=>({data:{id:1,orderCode:'ORD-1',status:'PENDING_PAYMENT'}})};
  });
  const result=await checkoutApi.createOrder({channel:'ONLINE'},'retry-1');
  assert.equal(result.orderCode,'ORD-1'); assert.equal(result.status,'PENDING_PAYMENT');
  assert.equal(sent.options.headers['Idempotency-Key'],'retry-1');
  assert.equal(sent.options.headers.Authorization,'Bearer customer-token');
});
test('a changed price retains server details for explicit customer confirmation', async context => {
  context.mock.method(globalThis,'fetch',async()=>({ok:false,json:async()=>({message:'Giá đã thay đổi',errorCode:'ORDER_PRICE_CHANGED',data:{newTotal:1600000}})}));
  await assert.rejects(checkoutApi.createOrder({},'retry-1'),error=>error.code==='ORDER_PRICE_CHANGED' && error.details.newTotal===1600000);
});
test('an incomplete success response cannot clear the cart as a saved order', async context => {
  context.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({data:{status:'PENDING_PAYMENT'}})}));
  await assert.rejects(checkoutApi.createOrder({},'retry-1'),/Chưa nhận được thông tin đơn hàng/);
});

test('reads orders under the authenticated customer without trusting a client customer ID', async context => {
  let sent;
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    sent = { url, options }; return { ok: true, json: async () => [{ id: 1, orderCode: 'ORD-1' }] };
  });
  assert.equal((await checkoutApi.listOrders()).length, 1);
  assert.equal(sent.url, '/api/orders');
  assert.equal(sent.options.headers.Authorization, 'Bearer customer-token');
});

test('payment initiation sends neither client money nor a forged success status', async context => {
  let sent;
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    sent = { url, options }; return { ok: true, json: async () => ({ data: { provider: 'SEPAY' } }) };
  });
  await checkoutApi.initiate(15);
  assert.equal(sent.url, '/api/payments/order/15/initiate');
  assert.equal(sent.options.method, 'POST');
  assert.equal(sent.options.body, undefined);
});

test('reading an inaccessible order or failed payment history remains an error', async context => {
  context.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) }));
  await assert.rejects(checkoutApi.getOrder('ORD-OTHER'), error => error.status === 403);
  await assert.rejects(checkoutApi.paymentHistory(15), error => error.status === 403);
});
