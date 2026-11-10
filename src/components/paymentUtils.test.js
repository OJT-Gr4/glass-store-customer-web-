import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPay, paymentState, submitCheckoutForm, validateCheckoutForm } from './paymentUtils.js';

const pending = { channel: 'ONLINE', status: 'PENDING_PAYMENT', paymentMethod: 'VIETQR' };
const checkout = { provider: 'SEPAY', httpMethod: 'POST', paymentUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
  formFields: { merchant: 'QA', payment_method: 'BANK_TRANSFER', order_invoice_number: 'QA-1', order_amount: '10000', signature: 'fixture' } };

test('a success return URL cannot substitute a confirmed payment and cancelled/refunded orders cannot be charged', () => {
  assert.equal(paymentState({ ...pending, returnUrl: '?payment=success' }, [{ status: 'PENDING' }]), 'PENDING');
  assert.equal(canPay(pending, [{ status: 'PENDING' }]), true);
  assert.equal(paymentState(pending, [{ status: 'SUCCESS' }]), 'PAID');
  assert.equal(canPay(pending, [{ status: 'SUCCESS' }]), false);
  for (const status of ['CANCELLED', 'CANCEL_REQUESTED', 'CANCEL_PENDING', 'REFUND_PENDING', 'REFUNDED']) {
    assert.equal(canPay({ ...pending, status }, []), false);
  }
  assert.equal(paymentState(pending, [{ status: 'REFUND_PENDING' }, { status: 'SUCCESS' }]), 'REFUND_PENDING');
  assert.equal(paymentState(pending, [{ status: 'REFUNDED' }]), 'REFUNDED');
  assert.equal(canPay({ ...pending, channel: 'POS' }, []), false);
  assert.equal(paymentState({ ...pending, status: 'PAID' }, []), 'UNCONFIRMED');
});

test('rejects redirects to untrusted destinations and incomplete gateway responses', () => {
  assert.throws(() => validateCheckoutForm({ ...checkout, paymentUrl: 'https://attacker.example/collect' }), /hợp lệ/);
  assert.throws(() => validateCheckoutForm({ ...checkout, httpMethod: 'GET' }), /hợp lệ/);
  assert.throws(() => validateCheckoutForm({ ...checkout, formFields: { signature: '' } }), /đầy đủ/);
  // Accepts both sandbox and live checkout endpoints
  assert.doesNotThrow(() => validateCheckoutForm({ ...checkout, paymentUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init' }));
  assert.doesNotThrow(() => validateCheckoutForm({ ...checkout, paymentUrl: 'https://pay.sepay.vn/v1/checkout/init' }));
});

test('submits original signed values in insertion order using POST and leaves no hidden form', () => {
  let submitted = false, removed = false;
  const form = { fields: [], appendChild(input) { this.fields.push(input); }, submit() { submitted = true; }, remove() { removed = true; } };
  const document = { createElement: tag => tag === 'form' ? form : {}, body: { appendChild() {} } };
  submitCheckoutForm(checkout, document);
  assert.equal(form.method, 'POST'); assert.equal(form.action, checkout.paymentUrl);
  assert.deepEqual(form.fields.map(input => [input.name, input.value]), Object.entries(checkout.formFields));
  assert.equal(submitted, true); assert.equal(removed, true);
});
