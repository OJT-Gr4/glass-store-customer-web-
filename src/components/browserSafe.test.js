import test from 'node:test';
import assert from 'node:assert/strict';
import { createUuid } from './browserSafe.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('createUuid generates valid UUID v4 even when crypto.randomUUID is unavailable over HTTP', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const fakeCrypto = { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) };
  Object.defineProperty(globalThis, 'crypto', { value: fakeCrypto, configurable: true });
  try {
    const id1 = createUuid();
    const id2 = createUuid();
    assert.match(id1, UUID_REGEX);
    assert.match(id2, UUID_REGEX);
    assert.notEqual(id1, id2);
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, 'crypto', descriptor);
    }
  }
});
