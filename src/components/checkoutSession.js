import { createUuid } from './browserSafe.js';

const REQUEST_KEY = 'optivision_checkout_request';
const CART_KEY = 'optivision_customer_cart';

function read(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function write(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Checkout still works without browser storage. */ }
}

export function checkoutClaim(payload, current) {
  const fingerprint = JSON.stringify(payload);
  const previous = current || read(REQUEST_KEY, null);
  const claim = previous?.fingerprint === fingerprint && previous?.key
    ? previous : { fingerprint, key: createUuid() };
  write(REQUEST_KEY, claim);
  return claim;
}

export function clearCheckoutClaim() {
  try { sessionStorage.removeItem(REQUEST_KEY); } catch { /* Optional persistence. */ }
}

export function readCart() {
  const cart = read(CART_KEY, []);
  return Array.isArray(cart) ? cart : [];
}

export const saveCart = cart => write(CART_KEY, cart);
