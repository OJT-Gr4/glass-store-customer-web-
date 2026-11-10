import React, { useRef, useState } from 'react';
import { X, ShieldCheck, FileText, AlertCircle, ShoppingBag, Check } from 'lucide-react';
import { checkoutApi } from '../api/checkoutApi';
import { checkoutPayload, money } from './purchaseUtils';
import './purchase.css';

export default function CheckoutModal({ cart, user, requestRef, onClose, onSuccess }) {
  const [deliveryMethod, setDeliveryMethod] = useState('DOOR');
  const [selectedShowroom, setSelectedShowroom] = useState('Flagship Q.1 (TP.HCM) - 123 Lê Lợi, P. Bến Thành, Q.1');
  const [contact, setContact] = useState({
    name: user?.fullName || '',
    phone: user?.phoneNumber || '',
    address: user?.address || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceChange, setPriceChange] = useState(null);
  const [acceptPriceChange, setAcceptPriceChange] = useState(false);
  const localRequest = useRef(null);
  const request = requestRef || localRequest;
  const locked = useRef(false);
  const rx = cart.find(item => item.prescription)?.prescription;

  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setSaving(true); 
    setError('');
    try {
      const contactWithDelivery = {
        ...contact,
        deliveryMethod,
        storePickupLocation: deliveryMethod === 'SHOWROOM' ? selectedShowroom : null,
        address: deliveryMethod === 'SHOWROOM' ? selectedShowroom : contact.address
      };
      const payload = checkoutPayload(cart, contactWithDelivery, user);
      if (priceChange && acceptPriceChange) payload.acceptPriceChange = true;
      const fingerprint = JSON.stringify(payload);
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
      const order = await checkoutApi.createOrder(payload, request.current.key);
      onSuccess(order);
    } catch (err) {
      setError(err.message);
      if (err.code === 'ORDER_PRICE_CHANGED') { 
        setPriceChange(err.details); 
        setAcceptPriceChange(false); 
      }
    } finally { 
      locked.current = false; 
      setSaving(false); 
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="purchase-overlay">
      <section 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="checkout-title" 
        className="purchase-modal bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#086288] text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#97D7FF]" />
            </div>
            <h2 id="checkout-title" className="text-xl font-black text-slate-900 tracking-tight m-0">
              Xác Nhận Đặt Hàng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit}>
          <fieldset disabled={saving} className="space-y-5">
            {/* Delivery Method Choice (S3-15) */}
            <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
              <span>Hình thức nhận hàng <span className="text-red-500">*</span></span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('DOOR')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'DOOR' ? 'bg-white text-[#086288] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Giao tận nơi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('SHOWROOM')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'SHOWROOM' ? 'bg-white text-[#086288] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Nhận tại Showroom</span>
                </button>
              </div>
            </div>

            {/* Contact Info Fields */}
            <div className="purchase-fields space-y-3">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                <span>Họ và tên người nhận <span className="text-red-500">*</span></span>
                <input 
                  required 
                  maxLength={120} 
                  type="text" 
                  value={contact.name} 
                  onChange={event => setContact({ ...contact, name: event.target.value })} 
                  className="p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#086288] focus:ring-2 focus:ring-[#086288]/15 outline-none transition"
                  placeholder="Nhập họ và tên..."
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                <span>Số điện thoại liên hệ <span className="text-red-500">*</span></span>
                <input 
                  required 
                  maxLength={30} 
                  type="tel" 
                  value={contact.phone} 
                  onChange={event => setContact({ ...contact, phone: event.target.value })} 
                  className="p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#086288] focus:ring-2 focus:ring-[#086288]/15 outline-none transition"
                  placeholder="Nhập số điện thoại..."
                />
              </label>

              {deliveryMethod === 'DOOR' ? (
                <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                  <span>Địa chỉ giao hàng chi tiết <span className="text-red-500">*</span></span>
                  <input 
                    required 
                    maxLength={500} 
                    type="text" 
                    value={contact.address} 
                    onChange={event => setContact({ ...contact, address: event.target.value })} 
                    className="p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#086288] focus:ring-2 focus:ring-[#086288]/15 outline-none transition"
                    placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
                  <span>Chọn Showroom tiếp nhận <span className="text-red-500">*</span></span>
                  <select
                    value={selectedShowroom}
                    onChange={event => setSelectedShowroom(event.target.value)}
                    className="p-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#086288] focus:ring-2 focus:ring-[#086288]/15 outline-none transition bg-white"
                  >
                    <option value="Flagship Q.1 (TP.HCM) - 123 Lê Lợi, P. Bến Thành, Q.1">Flagship Q.1 (TP.HCM) - 123 Lê Lợi, P. Bến Thành, Q.1</option>
                    <option value="Tràng Tiền Plaza (Hà Nội) - 24 Hai Bà Trưng, Q. Hoàn Kiếm">Tràng Tiền Plaza (Hà Nội) - 24 Hai Bà Trưng, Q. Hoàn Kiếm</option>
                    <option value="Thảo Điền Store (Q.2) - 88 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức">Thảo Điền Store (Q.2) - 88 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức</option>
                  </select>
                </label>
              )}
            </div>

            {/* Cart Summary */}
            <div className="purchase-summary bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                Chi tiết sản phẩm
              </div>
              {cart.map(item => (
                <p key={item.sku} className="flex justify-between items-center text-slate-600 m-0">
                  <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                  <strong className="text-slate-900 font-bold ml-2">{money(item.price * item.quantity)}</strong>
                </p>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900 mt-2">
                <span>Tạm tính</span>
                <strong className="text-base font-black text-[#086288]">{money(totalAmount)}</strong>
              </div>
            </div>

            {/* Prescription Snapshot Callout */}
            {rx && (
              <div className="purchase-rx-summary p-4 bg-[#f0f9ff] border border-[#97D7FF] rounded-2xl space-y-1.5 text-xs text-[#0369a1]">
                <strong className="text-xs font-bold text-[#086288] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#086288]" /> Thông số khách cung cấp
                </strong>
                <p className="m-0">OD: SPH {rx.odSph} / CYL {rx.odCyl} / AXIS {rx.odAxis}°</p>
                <p className="m-0">OS: SPH {rx.osSph} / CYL {rx.osCyl} / AXIS {rx.osAxis}° · PD {rx.pd} mm</p>
                <p className="text-[11px] text-sky-600 pt-1 m-0">
                  Nhân viên khúc xạ sẽ kiểm tra tính tương thích trước khi xác nhận gia công.
                </p>
              </div>
            )}

            <p className="purchase-muted text-xs text-slate-500 m-0 leading-relaxed">
              Thanh toán chuyển khoản, chờ xác nhận. Số tiền cuối cùng được tính lại theo danh mục khi đặt hàng.
            </p>

            {/* Price Change Warning */}
            {priceChange && (
              <div className="purchase-rx-summary bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl space-y-2">
                <strong className="text-xs font-bold text-amber-900">
                  Tổng tiền cập nhật: {money(priceChange.newTotal)}
                </strong>
                <label className="purchase-check flex items-start gap-2 text-xs cursor-pointer">
                  <input 
                    type="checkbox" 
                    required 
                    checked={acceptPriceChange} 
                    onChange={event => setAcceptPriceChange(event.target.checked)} 
                    className="accent-[#086288] mt-0.5"
                  />
                  <span>Tôi đồng ý với số tiền cập nhật trước khi đặt hàng.</span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div role="alert" className="purchase-error bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="purchase-actions pt-2 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              >
                Quay lại
              </button>
              <button 
                type="submit" 
                className="purchase-primary px-6 py-2.5 rounded-xl text-xs font-bold bg-[#086288] hover:bg-[#064e6d] text-white shadow-sm transition active:scale-95"
              >
                {saving ? 'Đang đặt hàng…' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
