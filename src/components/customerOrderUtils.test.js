import test from 'node:test';
import assert from 'node:assert/strict';
import { orderRoute, canRequestCancellation } from './customerOrderUtils.js';

test('detail route survives reload and refuses malformed order IDs', () => {
  assert.deepEqual(orderRoute('#orders/123'), { tab: 'order-hub', id: 123 });
  assert.deepEqual(orderRoute('#orders'), { tab: 'orders', id: null });
  for (const hash of ['#orders/0', '#orders/-1', '#orders/1.5', '#orders/99999999999999999999', '#orders/undefined'])
    assert.equal(orderRoute(hash), null);
});
test('only eligible online orders expose cancellation requests', () => {
  assert.equal(canRequestCancellation({ channel: 'ONLINE', status: 'PAID' }), true);
  assert.equal(canRequestCancellation({ channel: 'ONLINE', status: 'PENDING_CONFIRMATION' }), true);
  for (const status of ['PREPARING', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'CANCEL_REQUESTED'])
    assert.equal(canRequestCancellation({ channel: 'ONLINE', status }), false);
  assert.equal(canRequestCancellation({ channel: 'POS', status: 'PAID' }), false);
});
