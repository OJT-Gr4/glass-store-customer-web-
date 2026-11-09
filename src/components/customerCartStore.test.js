import test from 'node:test';
import assert from 'node:assert/strict';
import { cartStorageKey, createCustomerCartStore, claimGuestCart } from './customerCartStore.js';
import { addSelection } from './purchaseUtils.js';

const item = { sku: 'FRM-1', name: 'Frame', quantity: 1, price: 100, productType: 'FRAME', stock: 20 };
const memoryStorage = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('reload restores quantities and prescription, while accounts and guest remain separate', () => {
  const storage = memoryStorage();
  const rx = { odSph: -2, osSph: -1, pd: 63 };
  createCustomerCartStore(10, storage).setItems([{ ...item, quantity: 2, prescription: rx }]);
  createCustomerCartStore(20, storage).setItems([{ ...item, sku: 'FRM-2' }]);
  assert.deepEqual(createCustomerCartStore(10, storage).getSnapshot().items[0].prescription, rx);
  assert.equal(createCustomerCartStore(10, storage).getSnapshot().items[0].quantity, 2);
  assert.equal(createCustomerCartStore(20, storage).getSnapshot().items[0].sku, 'FRM-2');
  assert.deepEqual(createCustomerCartStore(null, storage).getSnapshot().items, []);
});

test('a late checkout callback clears only its original owner cart', () => {
  const storage = memoryStorage();
  const a = createCustomerCartStore(10, storage);
  const b = createCustomerCartStore(20, storage);
  a.setItems([item]); b.setItems([{ ...item, sku: 'FRM-2' }]);
  a.setItems([]);
  assert.equal(createCustomerCartStore(20, storage).getSnapshot().items.length, 1);
  assert.deepEqual(createCustomerCartStore(10, storage).getSnapshot().items, []);
});

test('malformed saved cart is reported without deleting its contents', () => {
  const storage = memoryStorage();
  storage.setItem(cartStorageKey(10), '{broken');
  const state = createCustomerCartStore(10, storage).getSnapshot();
  assert.match(state.error, /chưa bị xóa/);
  assert.equal(storage.getItem(cartStorageKey(10)), '{broken');
});

test('storage failure preserves the in-memory cart and reports the limitation', () => {
  const store = createCustomerCartStore(10, { getItem: () => null, setItem: () => { throw new Error('Quota'); } });
  store.setItems([item]);
  assert.equal(store.getSnapshot().items.length, 1);
  assert.match(store.getSnapshot().error, /Không lưu được/);
});

test('login moves guest selections once and merges them only into the authenticated cart', () => {
  const storage = memoryStorage();
  createCustomerCartStore(null, storage).setItems([item]);
  createCustomerCartStore(10, storage).setItems([{ ...item, quantity: 2 }]);
  createCustomerCartStore(20, storage).setItems([{ ...item, quantity: 5 }]);
  assert.equal(claimGuestCart(10, addSelection, storage), '');
  assert.equal(createCustomerCartStore(10, storage).getSnapshot().items[0].quantity, 3);
  claimGuestCart(10, addSelection, storage);
  assert.equal(createCustomerCartStore(10, storage).getSnapshot().items[0].quantity, 3);
  assert.equal(createCustomerCartStore(20, storage).getSnapshot().items[0].quantity, 5);
  assert.deepEqual(createCustomerCartStore(null, storage).getSnapshot().items, []);
});
