import test from 'node:test';
import assert from 'node:assert/strict';
import { savedPrescriptionForm } from './savedPrescription.js';
import { addSelection, checkoutPayload } from './purchaseUtils.js';
const record = { id:9,customerId:15,version:0,odSph:1,odCyl:0,odAxis:90,odAdd:0,osSph:-2,osCyl:-.5,osAxis:180,osAdd:1,pd:50 };
test('saved prescription fills both eyes and PD, preserving zero and requiring confirmation', () => {
  const form = savedPrescriptionForm(record, 15);
  assert.equal(form.odCyl, '0'); assert.equal(form.odSph, '1'); assert.equal(form.osSph, '-2');
  assert.equal(form.osAxis, '180'); assert.equal(form.osAdd, '1'); assert.equal(form.pd, '50');
  assert.equal(form.confirmed, false); assert.equal(record.version, 0);
});
test('incomplete or foreign prescriptions are never substituted with invented measurements', () => {
  assert.throws(() => savedPrescriptionForm(record,16), /tài khoản/);
  for (const value of [null,'',undefined,'invalid']) {
    assert.throws(() => savedPrescriptionForm({...record,odCyl:value},15), /thiếu thông số/);
  }
});
test('selected measured values survive the product selection, cart and checkout payload', () => {
  const rx = { ...savedPrescriptionForm(record,15), confirmed:true };
  const cart = addSelection([], {items:[{sku:'LNS-QA',name:'Tròng',price:1000000,quantity:1,productType:'LENS',stock:2}],prescription:rx});
  const payload = checkoutPayload(cart,{name:'QA',phone:'0901234567',address:'Address'},{id:15});
  assert.equal(payload.prescription.pd,50); assert.equal(payload.prescription.osSph,-2);
  assert.equal(payload.prescription.odCyl,0); assert.equal(payload.orderType,'LENS_ONLY');
});
