import React, { useEffect, useState } from 'react';
import { locationApi } from '../api/locationApi';
import { receivingBranches } from './warrantyHandover';

export function useWarrantyHandover(user) {
  const [method,setMethod]=useState('SHOWROOM');
  const [branchCode,setBranchCode]=useState('');
  const [address,setAddress]=useState(user?.address || '');
  const [phone,setPhone]=useState(user?.phoneNumber || user?.phone || '');
  const [locations,setLocations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{setMethod('SHOWROOM');setBranchCode('');setAddress(user?.address || '');setPhone(user?.phoneNumber || user?.phone || '');},[user?.id]);
  useEffect(()=>{
    let active=true;setLoading(true);setError('');
    locationApi.getActiveLocations().then(rows=>{if(active)setLocations(receivingBranches(rows));})
      .catch(err=>{if(active){setLocations([]);setError(err.message);}}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[retry]);
  return {method,setMethod,branchCode,setBranchCode,address,setAddress,phone,setPhone,locations,loading,error,reload:()=>setRetry(value=>value+1)};
}

export default function WarrantyHandoverFields({ handover:h }) {
  const branch=h.locations.find(row=>row.code===h.branchCode);
  return <div className="space-y-3 text-xs">
    <div><span className="block font-semibold mb-1">Hình thức tiếp nhận</span><div className="grid grid-cols-2 gap-2">
      {[['SHOWROOM','Mang tới showroom'],['DOOR','Giao nhận tận nơi']].map(([value,label])=><button type="button" key={value} onClick={()=>h.setMethod(value)} aria-pressed={h.method===value}
        className={`p-2.5 rounded-lg border font-semibold ${h.method===value?'bg-[#eceee7] border-[#30483b] text-[#253c33]':'bg-[#f9f8f4] border-[#e4e4db] text-[#40484e]'}`}>{label}</button>)}
    </div></div>
    <label className="block"><span className="block font-semibold mb-1">Showroom tiếp nhận *</span>
      <select required aria-label="Showroom tiếp nhận" value={h.branchCode} onChange={e=>h.setBranchCode(e.target.value)} disabled={h.loading || !h.locations.length} className="w-full min-w-0 p-2.5 rounded-lg border border-[#e4e4db] bg-white">
        <option value="">{h.loading?'Đang tải showroom…':'Chọn showroom tiếp nhận'}</option>
        {h.locations.map(row=><option key={row.code} value={row.code}>{row.name}{row.address?` · ${row.address}`:row.area?` · ${row.area}`:''}</option>)}
      </select>
    </label>
    {branch && <p className="text-[#637466]">{branch.address || `Khu vực: ${branch.area || branch.name}. Cửa hàng sẽ xác nhận địa chỉ tiếp nhận qua số điện thoại của bạn.`}</p>}
    {h.error && <p role="alert">{h.error} <button type="button" onClick={h.reload} className="underline">Tải lại showroom</button></p>}
    {!h.loading && !h.error && !h.locations.length && <p role="alert">Chưa có showroom tiếp nhận đang hoạt động. Vui lòng liên hệ cửa hàng.</p>}
    <label className="block"><span className="block font-semibold mb-1">Số điện thoại liên hệ *</span><input required type="tel" aria-label="Số điện thoại giao nhận" value={h.phone} onChange={e=>h.setPhone(e.target.value)} maxLength={20} className="w-full p-2.5 rounded-lg border border-[#e4e4db] bg-white" /></label>
    {h.method==='DOOR' && <label className="block"><span className="block font-semibold mb-1">Địa chỉ nhận và trả kính *</span>
      <textarea required aria-label="Địa chỉ nhận và trả kính" rows={3} minLength={8} maxLength={500} value={h.address} onChange={e=>h.setAddress(e.target.value)} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" className="w-full p-2.5 rounded-lg border border-[#e4e4db] bg-white" />
      <small className="block mt-1 text-[#637466]">Shipper nhận và trả kính tại địa chỉ này. Nhân viên sẽ gọi xác nhận trước khi đến.</small>
    </label>}
  </div>;
}
