import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, updateQty, removeFromCart, checkout }) {
  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#086288] text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#97D7FF]" />
              </div>
              <h2 className="text-base font-black text-[#086288]">
                Giỏ Hàng ({totalCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List items */}
          <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-600 text-sm">Giỏ hàng đang trống</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Hãy thêm gọng kính hoặc tròng kính yêu thích vào giỏ để tiến hành đặt hàng.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.sku} className="flex gap-3.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-[#086288]/40 transition">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.sku)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-extrabold text-[#086288] mt-0.5 block">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQty(item.sku, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 font-bold text-xs text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.sku, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-semibold text-slate-800">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dịch vụ mài lắp kỹ thuật số:</span>
                  <span className="font-semibold text-emerald-600">Miễn phí 100%</span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                  <span className="text-lg font-black text-[#086288]">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={checkout}
                className="w-full bg-[#086288] hover:bg-[#064e6d] text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98"
              >
                <span>Tiến Hành Đặt Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
