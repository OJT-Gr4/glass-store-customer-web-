import React, { useState, useEffect } from 'react';
import {
  Star, CheckCircle2, ShieldCheck, Camera, Upload,
  X, ArrowRight, Sparkles, AlertCircle, Phone, FileText, Check, Package
} from 'lucide-react';
import { customerOrdersApi } from '../api/customerOrdersApi';
import { orderDate } from './customerOrderUtils';

export default function ReviewFeedbackPage({ setActiveTab, currentUser, orderId }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Rating states (1-5)
  const [frameComfort, setFrameComfort] = useState(5);
  const [lensClarity, setLensClarity] = useState(5);
  const [staffService, setStaffService] = useState(5);

  // Quick feedback tags
  const [selectedTags, setSelectedTags] = useState(['Gọng siêu nhẹ', 'Đo mắt cực chuẩn']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Fetch real customer orders from database
  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    setLoadingOrders(true);

    customerOrdersApi.list(currentUser.id)
      .then((rows) => {
        if (!active) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setOrders(rows);
          if (!selectedOrderId) {
            setSelectedOrderId(rows[0].id || rows[0].orderCode);
          }
        }
      })
      .catch((err) => console.warn('Lỗi nạp đơn hàng:', err))
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => { active = false; };
  }, [currentUser?.id, selectedOrderId]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const selectedOrderObj = orders.find(o => String(o.id) === String(selectedOrderId) || o.orderCode === selectedOrderId) || orders[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFeedbackSuccess(true);
    }, 600);
  };

  const renderStars = (rating, setRating) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className="p-1 focus:outline-none transition hover:scale-110 cursor-pointer"
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
      <span className="text-xs font-bold text-[#111c2d] ml-1.5">{rating}/5</span>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-[#086288]" />
            Khảo sát chất lượng dịch vụ nhãn khoa
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Đánh Giá Trải Nghiệm Mua Kính &amp; Đo Mắt
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Ý kiến phản hồi thực tế từ đơn hàng của bạn giúp phòng khám OptiVision không ngừng hoàn thiện dịch vụ.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('orders')}
          className="px-3.5 py-2 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition shrink-0 cursor-pointer"
        >
          Quay Lại Đơn Hàng
        </button>
      </div>

      {feedbackSuccess ? (
        <div className="bg-white p-8 rounded-xl border border-[#dee8ff] shadow-sm max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#111c2d]">Cảm Ơn Quý Khách Đã Đánh Giá!</h2>
          <p className="text-xs text-[#40484e]">
            Ý kiến đóng góp quý báu của bạn giúp OptiVision không ngừng nâng cao chất lượng dịch vụ và sản phẩm.
          </p>
          <button
            onClick={() => setActiveTab('orders')}
            className="w-full py-2.5 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold transition cursor-pointer"
          >
            Về Danh Sách Đơn Hàng
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Select Real Order & Items */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#dee8ff] shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-[#111c2d]">
                Chọn đơn hàng cần đánh giá trong CSDL
              </h3>

              {loadingOrders ? (
                <div className="py-4 text-center text-xs text-[#40484e]">Đang tải danh sách đơn hàng…</div>
              ) : orders.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#40484e] bg-[#f9f9ff] rounded-lg border border-[#dee8ff]">
                  {currentUser ? 'Chưa có đơn hàng nào trong tài khoản.' : 'Vui lòng đăng nhập để nạp đơn hàng của bạn.'}
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-2.5 text-xs text-[#111c2d] outline-none"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.orderCode} · {orderDate(o.createdAt)}
                    </option>
                  ))}
                </select>
              )}

              {/* Order preview */}
              {selectedOrderObj && (
                <div className="p-3 bg-[#f0f3ff] rounded-lg border border-[#dee8ff] text-xs space-y-2">
                  <div className="flex justify-between font-bold text-[#004967]">
                    <span>Đơn hàng: #{selectedOrderObj.orderCode}</span>
                    <span>{selectedOrderObj.status}</span>
                  </div>
                  <div className="text-[#40484e]">
                    Sản phẩm: {selectedOrderObj.items?.map(i => `${i.productName || i.skuId} (x${i.quantity})`).join(', ') || 'Kính mắt'}
                  </div>
                  {selectedOrderObj.prescription && (
                    <div className="text-[11px] font-mono text-[#086288] pt-1.5 border-t border-[#dee8ff]">
                      OD: SPH {selectedOrderObj.prescription.odSph} / CYL {selectedOrderObj.prescription.odCyl} · OS: SPH {selectedOrderObj.prescription.osSph} / CYL {selectedOrderObj.prescription.osCyl}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Feedback Form */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-[#dee8ff] shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-[#111c2d]">
              Mức độ hài lòng về chất lượng quang học
            </h3>

            <div className="space-y-3 pb-3 border-b border-[#f0f3ff]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#111c2d] font-semibold">Độ êm dịu &amp; vừa vặn của gọng:</span>
                {renderStars(frameComfort, setFrameComfort)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#111c2d] font-semibold">Độ trong suốt &amp; sắc nét của tròng:</span>
                {renderStars(lensClarity, setLensClarity)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#111c2d] font-semibold">Thái độ kỹ thuật viên &amp; bác sĩ đo mắt:</span>
                {renderStars(staffService, setStaffService)}
              </div>
            </div>

            {/* Quick tags */}
            <div>
              <label className="block text-xs font-semibold text-[#111c2d] mb-1.5">
                Nhận xét nhanh về sản phẩm
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Gọng siêu nhẹ', 'Đo mắt cực chuẩn', 'Tròng chống lóa tốt', 
                  'Cắt kính lấy nhanh', 'Bác sĩ tận tình', 'Giá hợp lý'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      selectedTags.includes(tag)
                        ? 'bg-[#e7eeff] border-[#086288] text-[#004967] font-semibold'
                        : 'bg-[#f9f9ff] border-[#dee8ff] text-[#40484e]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                Chia sẻ chi tiết trải nghiệm của bạn
              </label>
              <textarea
                rows={4}
                required
                placeholder="VD: Gọng titan đeo rất nhẹ, tròng chống chói đêm xe tốt, KTV chỉnh càng kính vừa khít khuôn mặt..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-3 text-xs text-[#111c2d] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              {submitting ? 'Đang gửi đánh giá…' : 'Gửi Đánh Giá Trải Nghiệm'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
