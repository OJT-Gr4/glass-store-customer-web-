import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutClaim, clearCheckoutClaim, readCart, saveCart } from './checkoutSession.js';

test('a retry after a lost response or reload reuses the key, while changed content and completed checkout do not', () => {
  const stored = new Map();
  globalThis.sessionStorage = { getItem: key => stored.get(key), setItem: (key,value) => stored.set(key,value), removeItem: key => stored.delete(key) };
  const payload = { customerId: 10, items: [{ sku: 'QA', quantity: 1 }] };
  const original = checkoutClaim(payload);
  assert.equal(checkoutClaim(payload).key, original.key);
  assert.notEqual(checkoutClaim({ ...payload, customerId: 11 }).key, original.key);
  clearCheckoutClaim();
  assert.notEqual(checkoutClaim(payload).key, original.key);
  saveCart([{ sku: 'QA', quantity: 1 }]);
  assert.deepEqual(readCart(), [{ sku: 'QA', quantity: 1 }]);
  saveCart([]); assert.deepEqual(readCart(), []);
});
