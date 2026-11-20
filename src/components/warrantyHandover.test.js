import test from 'node:test';
import assert from 'node:assert/strict';
import { receivingBranches, warrantyHandoverPayload } from './warrantyHandover.js';
const locations=[{code:'BRANCH_01',name:'Chi nhánh1',locationType:'BRANCH'},{code:'LAB',locationType:'WAREHOUSE'}];
const valid={method:'SHOWROOM',branchCode:'BRANCH_01',phone:'0901234567',address:'Địa chỉ cũ'};
test('showroom handover selects an active branch and clears any stale home address',()=>{
  assert.equal(receivingBranches(locations).length,1);
  assert.equal(warrantyHandoverPayload(valid,locations).collectionAddress,null);
  assert.equal(warrantyHandoverPayload(valid,locations).receivingBranchCode,'BRANCH_01');
});
test('home collection requires a real address, contact phone and receiving showroom',()=>{
  assert.throws(()=>warrantyHandoverPayload({...valid,method:'DOOR',address:''},locations),/địa chỉ/);
  assert.throws(()=>warrantyHandoverPayload({...valid,branchCode:'LAB'},locations),/showroom/);
  assert.throws(()=>warrantyHandoverPayload({...valid,phone:''},locations),/điện thoại/);
  assert.equal(warrantyHandoverPayload({...valid,method:'DOOR',address:'  123 Đường A, Phường B, TP.HCM  '},locations).collectionAddress,'123 Đường A, Phường B, TP.HCM');
});
