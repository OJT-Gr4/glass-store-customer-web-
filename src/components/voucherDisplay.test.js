import test from 'node:test';
import assert from 'node:assert/strict';
import { voucherAvailability, voucherDisplay, checkoutVoucherOptions } from './voucherDisplay.js';

test('only live, active online vouchers with remaining uses appear available', () => {
  const live = { id: 1, code: 'SAVE', active: true, channel: 'ALL', discountType: 'PERCENT', discountValue: 10, minOrderAmount: 1000000 };
  assert.equal(voucherAvailability(live), true);
  assert.match(voucherDisplay(live).desc, /10%/);
  for (const change of [{active:false}, {channel:'POS'}, {usageLimit:1,usedCount:1}, {validTo:'2020-01-01'}, {validFrom:'invalid'}]) {
    assert.equal(voucherAvailability({...live,...change}), false);
  }
});

test('checkout lists customer vouchers with savings, caps and minimum order conditions', () => {
  const live = { active: true, channel: 'ALL' };
  const options = checkoutVoucherOptions([
    { ...live, id:1, code:'GOLD', discountType:'PERCENT', discountValue:10, maxDiscountAmount:200000, minOrderAmount:1000000 },
    { ...live, id:2, code:'NEXT', discountType:'AMOUNT', discountValue:500000, minOrderAmount:5000000 },
    { ...live, id:3, code:'POS', channel:'POS', discountValue:999999 },
    { ...live, id:4, code:'EXPIRED', validTo:'2020-01-01' },
  ], 3250000);
  assert.deepEqual(options.map(v => v.code), ['GOLD', 'NEXT']);
  assert.equal(options[0].estimatedDiscount, 200000);
  assert.match(options[0].label, /200/);
  assert.equal(options[1].eligible, false);
  assert.match(options[1].label, /5/);
});

test('checkout never estimates a discount larger than the order', () => {
  const [option] = checkoutVoucherOptions([{ active:true, code:'GIFT', discountType:'AMOUNT', discountValue:100000 }], 50000);
  assert.equal(option.estimatedDiscount, 50000);
});
