import test from 'node:test';
import assert from 'node:assert/strict';
import { customerOrdersApi } from './customerOrdersApi.js';

const order = { id: 1, orderCode: 'WEB-1', customerId: 10, status: 'PAID' };
test.beforeEach(() => { globalThis.localStorage = { getItem: () => 'customer-token' }; });
const respond = (status, data) => ({ ok: status < 400, status, json: async () => ({ data }) });

test('history and reloaded detail use authenticated endpoints with the selected order ID', async context => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return respond(200, url.endsWith('/customer/10') ? [order] : order);
  });
  assert.equal((await customerOrdersApi.list(10))[0].orderCode, 'WEB-1');
  assert.equal((await customerOrdersApi.get(1, 10)).id, 1);
  assert.deepEqual(calls.map(call => call.url), ['/api/orders/customer/10', '/api/orders/1']);
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer customer-token'));
});

test('missing authentication never sends a request and foreign/malformed orders are rejected', async context => {
  context.mock.method(globalThis, 'fetch', async () => respond(200, { ...order, customerId: 20 }));
  await assert.rejects(customerOrdersApi.get(1, 10), /tài khoản hiện tại/);
  globalThis.localStorage = { getItem: () => null };
  context.mock.method(globalThis, 'fetch', async () => assert.fail('No unauthenticated requests'));
  await assert.rejects(customerOrdersApi.list(10), /đăng nhập/);
});

test('cancellation uses the OMS request contract and only accepts server-confirmed requested state', async context => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/orders/1/cancel-request');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { reason: 'Changed plans' });
    return respond(200, { ...order, status: 'CANCEL_REQUESTED' });
  });
  assert.equal((await customerOrdersApi.requestCancellation(1, 10, ' Changed plans ')).status, 'CANCEL_REQUESTED');
  context.mock.method(globalThis, 'fetch', async () => respond(200, order));
  await assert.rejects(customerOrdersApi.requestCancellation(1, 10, 'Reason'), /Chưa xác nhận/);
});

test('rejected or lost cancellation response cannot turn the displayed order into cancelled', async context => {
  context.mock.method(globalThis, 'fetch', async () => respond(403, null));
  await assert.rejects(customerOrdersApi.requestCancellation(1, 10, 'Reason'), error => error.status === 403);
  assert.equal(order.status, 'PAID');
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('Connection lost'); });
  await assert.rejects(customerOrdersApi.requestCancellation(1, 10, 'Reason'), /Connection lost/);
  assert.equal(order.status, 'PAID');
});
