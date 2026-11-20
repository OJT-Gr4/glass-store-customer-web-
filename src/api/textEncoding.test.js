import test from 'node:test';
import assert from 'node:assert/strict';
import { repairVietnamese, repairDisplayText } from './textEncoding.js';

test('repairs legacy Vietnamese display text without changing valid Unicode or identifiers', () => {
  assert.equal(repairVietnamese('Gá»ng KÃ­nh'), 'Gọng Kính');
  assert.equal(repairVietnamese('Kính mắt Việt Nam'), 'Kính mắt Việt Nam');
  assert.equal(repairVietnamese('Crème brûlée'), 'Crème brûlée');
  const product = { name: 'Gá»ng KÃ­nh', sku: 'Ã-123', variants: [{ name: 'Äen' }] };
  assert.deepEqual(repairDisplayText(product), { name: 'Gọng Kính', sku: 'Ã-123', variants: [{ name: 'Đen' }] });
});
