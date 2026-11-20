export const receivingBranches = rows => rows.filter(row => row.active !== false && ['BRANCH', 'STORE', 'SHOWROOM'].includes(row.locationType));

export function warrantyHandoverPayload(value, locations) {
  if (!['SHOWROOM', 'DOOR'].includes(value.method)) throw new Error('Vui lòng chọn hình thức tiếp nhận.');
  const branch=receivingBranches(locations).find(row=>row.code===value.branchCode);
  if (!branch) throw new Error('Vui lòng chọn showroom tiếp nhận đang hoạt động.');
  const phone=String(value.phone || '').trim();
  if (!/^[+]?[0-9 ()-]{7,20}$/.test(phone)) throw new Error('Vui lòng nhập số điện thoại liên hệ hợp lệ.');
  const address=String(value.address || '').trim();
  if (value.method==='DOOR' && (address.length<8 || address.length>500)) throw new Error('Vui lòng nhập địa chỉ giao nhận cụ thể, gồm số nhà, đường, phường/xã và tỉnh/thành (8–500 ký tự).');
  return {deliveryMethod:value.method,receivingBranchCode:branch.code,receivingBranchName:branch.name,
    receivingBranchAddress:branch.address || null,collectionAddress:value.method==='DOOR'?address:null,customerPhone:phone};
}
