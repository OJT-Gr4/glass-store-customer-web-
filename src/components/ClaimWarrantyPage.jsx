import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Upload, MapPin, Truck, Check,
  AlertCircle, ArrowRight, X, Phone, Clock, FileText, Loader2
} from 'lucide-react';
import { warrantyApi } from '../api/warrantyApi';
import { customerOrdersApi } from '../api/customerOrdersApi';
import { locationApi } from '../api/locationApi';

export default function ClaimWarrantyPage({ setActiveTab, currentUser, openAuth }) {
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [claimType, setClaimType] = useState('RX_INSURANCE'); // RX_INSURANCE, FRAME_TECH, LENS_WARRANTY, EXCHANGE_7D
  const [description, setDescription] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('SHOWROOM');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch real orders of the authenticated customer & locations from database
  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    setLoadingOrders(true);

    customerOrdersApi.list(currentUser.id)
      .then((rows) => {
        if (!active) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setOrders(rows);
          setSelectedOrderId(rows[0].id || rows[0].orderCode);
        }
      })
      .catch((err) => console.warn('Lỗi tải đơn hàng của khách:', err))
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    locationApi.getActiveLocations()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data);
          setSelectedBranch(data[0].code);
        }
      })
      .catch((err) => console.warn('Lỗi tải chi nhánh:', err));

    return () => { active = false; };
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#dee8ff] p-8 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <ShieldCheck className="w-12 h-12 text-[#086288] mx-auto" />
          <h2 className="text-base font-bold text-[#111c2d]">Yêu Cầu Đăng Nhập</h2>
          <p className="text-xs text-[#40484e]">
            Vui lòng đăng nhập tài khoản để đồng bộ danh sách đơn hàng đã mua từ cơ sở dữ liệu và gửi yêu cầu hậu mãi.
          </p>
          <button
            onClick={openAuth}
            className="w-full py-2.5 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  const selectedOrderObj = orders.find(o => String(o.id) === String(selectedOrderId) || o.orderCode === selectedOrderId) || orders[0];
  const orderItems = selectedOrderObj?.items || [];
  const primaryItem = orderItems[0] || null;

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!description.trim()) {
      alert('Vui lòng mô tả chi tiết sự cố cần bảo hành hoặc đổi trả!');
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const isLens = claimType === 'RX_INSURANCE' || claimType === 'LENS_WARRANTY';
      const branchObj = locations.find(l => l.code === selectedBranch);

      const payload = {
        warrantyCode: `WAR-${Date.now().toString().slice(-4)}`,
        originalOrderCode: selectedOrderObj?.orderCode || 'ORD-COUNTER',
        customerName: currentUser.fullName || currentUser.name || 'Khách Hàng',
        customerPhone: currentUser.phoneNumber || currentUser.phone || '0900000000',
        customerTier: 'Thành viên OptiVIP',
        productName: primaryItem ? (primaryItem.productName || primaryItem.skuId) : (isLens ? 'Tròng Kính Khúc Xạ Y Khoa' : 'Gọng Kính Chính Hãng'),
        productSku: primaryItem?.skuId || (isLens ? 'SKU-LENS-GEN' : 'SKU-FRAME-GEN'),
        claimType: claimType,
        issueDescription: description.trim(),
        policyRef: claimType === 'RX_INSURANCE' 
          ? 'Bảo hiểm độ khúc xạ 180 ngày'
          : (claimType === 'FRAME_TECH' ? 'Bảo hành kỹ thuật gọng kính 12 tháng' : 'Chính sách bảo hành quang học'),
        status: 'WAITING_PROCESS',
        statusLabel: 'Chờ tiếp nhận',
        statusColor: '#f59e0b',
        cost: '0 đ (Miễn phí)',
        techNote: `Chi nhánh hẹn: ${branchObj ? branchObj.name : selectedBranch}. Phương thức: ${deliveryMethod === 'SHOWROOM' ? 'Tại Showroom' : 'Shipper tận nhà'}`
      };

      const result = await warrantyApi.createClaim(payload);
      setFeedback({
        type: 'success',
        code: result.warrantyCode || payload.warrantyCode,
        product: payload.productName,
        policy: payload.policyRef
      });
      setDescription('');
    } catch (err) {
      alert(err.message || 'Không thể gửi yêu cầu bảo hành. Vui lòng kiểm tra và thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <ShieldCheck className="w-3 h-3 text-[#086288]" />
            Dữ liệu đồng bộ trực tiếp từ đơn hàng của tài khoản
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Gửi Yêu Cầu Bảo Hành &amp; Đổi Trả Kính
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Tiếp nhận xử lý sự cố tròng trầy xước, lệch tâm, không thích nghi độ, hoặc đổi gọng trong vòng 7 ngày.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('warranty')}
          className="px-3.5 py-2 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition shrink-0 cursor-pointer"
        >
          Tra Cứu Lịch Sử Bảo Hành
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Yêu cầu hậu mãi đã được lưu thành công vào CSDL hệ thống!</span>
          </div>
          <p>Mã phiếu kỹ thuật: <strong>#{feedback.code}</strong> · Sản phẩm: {feedback.product}</p>
          <p>Chính sách: {feedback.policy}. Kỹ thuật viên sẽ gọi điện xác nhận trong vòng 2 giờ.</p>
        </div>
      )}

      {/* 2. Main Form Grid */}
      <form onSubmit={handleSubmitClaim} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 4 Steps */}
        <div className="lg:col-span-8 space-y-4">
          {/* Bước 1: Chọn đơn hàng thực tế */}
          <div className="bg-white rounded-xl border border-[#dee8ff] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#086288] text-white flex items-center justify-center text-[10px]">1</span>
                Chọn đơn hàng đã mua trong cơ sở dữ liệu
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {loadingOrders ? 'Đang tải đơn hàng…' : `${orders.length} đơn hàng khả dụng`}
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-4 text-center text-xs text-[#40484e]">Đang tải dữ liệu đơn hàng…</div>
            ) : orders.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#40484e] bg-[#f9f9ff] rounded-lg border border-[#dee8ff]">
                Tài khoản của bạn chưa có đơn hàng nào trong hệ thống.
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-2.5 text-xs text-[#111c2d] outline-none font-medium"
              >
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    #{order.orderCode} · {order.items?.map(i => i.productName || i.skuId).join(', ') || 'Đơn hàng kính mắt'}
                  </option>
                ))}
              </select>
            )}

            {/* Selected order summary preview */}
            {selectedOrderObj && (
              <div className="p-3 bg-[#f0f3ff] rounded-lg border border-[#dee8ff] text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#004967]">
                  <span>Mã đơn: #{selectedOrderObj.orderCode}</span>
                  <span>Trạng thái: {selectedOrderObj.status}</span>
                </div>
                <div className="text-[#40484e]">
                  Sản phẩm: {selectedOrderObj.items?.map(i => `${i.productName || i.skuId} (x${i.quantity})`).join(', ') || 'Kính mắt'}
                </div>
                {selectedOrderObj.prescription && (
                  <div className="text-[11px] font-mono text-[#086288] pt-1 border-t border-[#dee8ff]">
                    Toa kính: OD SPH {selectedOrderObj.prescription.odSph} / CYL {selectedOrderObj.prescription.odCyl} · OS SPH {selectedOrderObj.prescription.osSph} / CYL {selectedOrderObj.prescription.osCyl}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bước 2: Chọn phân loại yêu cầu */}
          <div className="bg-white rounded-xl border border-[#dee8ff] p-5 shadow-xs space-y-3">
            <span className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#086288] text-white flex items-center justify-center text-[10px]">2</span>
              Chọn diện bảo hành / hỗ trợ kỹ thuật
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'RX_INSURANCE', title: 'Bảo hiểm độ khúc xạ (180 Ngày)', sub: 'Đổi độ tròng miễn phí nếu tăng độ hoặc không êm mắt' },
                { id: 'FRAME_TECH', title: 'Bảo hành kỹ thuật gọng (12 Tháng)', sub: 'Hàn ốc, nắn chỉnh form, gãy khớp càng gọng kính' },
                { id: 'LENS_WARRANTY', title: 'Bảo hành váng phủ tròng kính', sub: 'Bong tróc lớp phản quang, chống trầy lỗi sản xuất' },
                { id: 'EXCHANGE_7D', title: 'Đổi mẫu gọng mới trong 7 ngày', sub: 'Đổi size/mẫu kính nếu không vừa khuôn mặt' },
              ].map((c) => (
                <div
                  key={c.id}
                  onClick={() => setClaimType(c.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    claimType === c.id
                      ? 'bg-[#e7eeff] border-[#086288] text-[#004967]'
                      : 'bg-[#f9f9ff] border-[#dee8ff] text-[#40484e]'
                  }`}
                >
                  <div className="font-bold">{c.title}</div>
                  <div className="text-[11px] mt-0.5 opacity-80">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bước 3: Mô tả triệu chứng sự cố */}
          <div className="bg-white rounded-xl border border-[#dee8ff] p-5 shadow-xs space-y-3">
            <span className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#086288] text-white flex items-center justify-center text-[10px]">3</span>
              Mô tả chi tiết tình trạng kính
            </span>

            <textarea
              rows={4}
              required
              placeholder="VD: Khi đeo kính làm việc trước màn hình khoảng 30 phút mắt trái bị mỏi hoặc càng kính bên phải bị lỏng ốc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-3 text-xs text-[#111c2d] outline-none"
            />
          </div>

          {/* Bước 4: Địa điểm & Hình thức tiếp nhận */}
          <div className="bg-white rounded-xl border border-[#dee8ff] p-5 shadow-xs space-y-3">
            <span className="font-bold text-xs text-[#111c2d] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#086288] text-white flex items-center justify-center text-[10px]">4</span>
              Chọn chi nhánh tiếp nhận từ hệ thống
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#40484e] mb-1 font-semibold">Chi nhánh tiếp nhận</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-2 text-xs text-[#111c2d] outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#40484e] mb-1 font-semibold">Phương thức giao nhận</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('SHOWROOM')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      deliveryMethod === 'SHOWROOM'
                        ? 'bg-[#e7eeff] border-[#086288] text-[#004967]'
                        : 'bg-[#f9f9ff] border-[#dee8ff] text-[#40484e]'
                    }`}
                  >
                    Tại Showroom
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('DOOR')}
                    className={`p-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      deliveryMethod === 'DOOR'
                        ? 'bg-[#e7eeff] border-[#086288] text-[#004967]'
                        : 'bg-[#f9f9ff] border-[#dee8ff] text-[#40484e]'
                    }`}
                  >
                    Shipper tận nhà
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            {submitting ? 'Đang gửi yêu cầu lên máy chủ…' : 'Xác Nhận Gửi Yêu Cầu Hậu Mãi (0đ)'}
          </button>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-[#dee8ff] shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-[#111c2d] text-sm">Thông Tin Khách Hàng</h3>
          <div className="space-y-1.5 text-[#40484e]">
            <p>Họ tên: <strong className="text-[#111c2d]">{currentUser.fullName || currentUser.name}</strong></p>
            <p>Số điện thoại: <strong className="text-[#111c2d]">{currentUser.phoneNumber || currentUser.phone || 'Chưa cập nhật'}</strong></p>
            <p>Email: <strong className="text-[#111c2d]">{currentUser.email}</strong></p>
          </div>

          <div className="pt-3 border-t border-[#f0f3ff] space-y-2">
            <h4 className="font-bold text-[#111c2d]">Cam Kết Xử Lý Hậu Mãi</h4>
            <div className="space-y-1.5 text-[#40484e] text-[11px]">
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#086288] shrink-0" />
                <span>Tiếp nhận & phản hồi trong vòng 2 giờ</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#086288] shrink-0" />
                <span>Miễn phí 100% đổi tròng lệch tâm quang học</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#086288] shrink-0" />
                <span>Đưa đón kính 2 chiều miễn phí toàn quốc</span>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
