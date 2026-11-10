import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Search, Wrench, Eye, Clock, 
  MapPin, Check, ArrowRight, AlertCircle, Phone, Award, Loader2, Sparkles
} from 'lucide-react';
import { warrantyApi } from '../api/warrantyApi';

export default function WarrantyCenterPage({ setActiveTab, currentUser }) {
  const userPhone = currentUser?.phoneNumber || currentUser?.phone || '';
  const [searchCode, setSearchCode] = useState(userPhone || '');
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  // Group warranties by product to prevent duplicate cards
  const groupedWarranties = useMemo(() => {
    const map = new Map();
    warranties.forEach((w) => {
      const key = `${w.originalOrderCode || w.orderCode || 'POS'}_${w.productName}`;
      if (!map.has(key)) {
        map.set(key, {
          productName: w.productName,
          orderCode: w.originalOrderCode || w.orderCode || 'Tại quầy',
          customerName: w.customerName,
          customerPhone: w.customerPhone,
          prescriptionNote: w.prescriptionNote,
          primaryCode: w.warrantyCode,
          policies: []
        });
      }
      map.get(key).policies.push(w);
    });
    return Array.from(map.values());
  }, [warranties]);

  // Form bảo dưỡng nhanh
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedService, setSelectedService] = useState('ALIGN');
  const [deliveryMethod, setDeliveryMethod] = useState('SHOWROOM');
  const [notes, setNotes] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  // Tự động tìm kiếm nếu có tài khoản hoặc nạp danh sách
  useEffect(() => {
    if (userPhone) {
      setSearchCode(userPhone);
      performSearch(userPhone, false);
    } else {
      // Load all visible warranties for current user/public
      setLoading(true);
      warrantyApi.getAllWarranties()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setWarranties(data);
            setSelectedProduct(data[0]?.warrantyCode || '');
          }
        })
        .catch((err) => console.warn('Lỗi tải danh sách bảo hành:', err))
        .finally(() => setLoading(false));
    }
  }, [userPhone]);

  const performSearch = async (query, showNotification = true) => {
    const q = (query || '').replace(/\s+/g, '').trim();
    if (!q) {
      setLoading(true);
      warrantyApi.getAllWarranties()
        .then((data) => {
          setWarranties(Array.isArray(data) ? data : []);
          if (data?.[0]?.warrantyCode) setSelectedProduct(data[0].warrantyCode);
        })
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    setSearchFeedback(null);
    try {
      const data = await warrantyApi.searchWarranties(q);
      setHasSearched(true);
      if (Array.isArray(data) && data.length > 0) {
        setWarranties(data);
        setSelectedProduct(data[0]?.warrantyCode || '');
        if (showNotification) {
          setSearchFeedback({
            type: 'success',
            msg: `Đã tìm thấy ${data.length} chính sách bảo hành chính hãng hợp lệ!`
          });
        }
      } else {
        setWarranties([]);
        if (showNotification) {
          setSearchFeedback({
            type: 'empty',
            msg: `Không tìm thấy phiếu bảo hành nào cho từ khóa [${query}]. Vui lòng kiểm tra lại SĐT hoặc mã đơn hàng.`
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi tra cứu bảo hành từ API:', err);
      setWarranties([]);
      if (showNotification) {
        setSearchFeedback({
          type: 'error',
          msg: 'Không thể kết nối máy chủ tra cứu bảo hành. Vui lòng thử lại sau.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchWarranty = (e) => {
    e.preventDefault();
    performSearch(searchCode, true);
  };

  const handleSubmitWarrantyRequest = async (e) => {
    e.preventDefault();
    setSubmittingService(true);
    try {
      const selectedItem = warranties.find(w => w.warrantyCode === selectedProduct) || warranties[0];
      const payload = {
        warrantyCode: `WAR-${Date.now().toString().slice(-4)}`,
        originalOrderCode: selectedItem ? (selectedItem.originalOrderCode || selectedItem.orderCode || 'ORD-COUNTER') : 'ORD-COUNTER',
        customerName: currentUser?.fullName || currentUser?.name || selectedItem?.customerName || 'Khách Hàng',
        customerPhone: userPhone || searchCode.replace(/\s+/g, '') || selectedItem?.customerPhone || '0900000000',
        productName: selectedItem ? selectedItem.productName : 'Kính mắt OptiVision',
        productSku: selectedItem ? (selectedItem.productSku || 'SKU-OPT') : 'SKU-OPT',
        claimType: selectedService === 'RX_INSURANCE' ? 'RX_INSURANCE' : 'FRAME_TECH',
        issueDescription: `[Dịch vụ: ${selectedService}] ${notes.trim() || 'Yêu cầu bảo dưỡng / căn chỉnh'}`,
        policyRef: 'Chính sách bảo dưỡng & căn chỉnh miễn phí trọn đời',
        status: 'WAITING_PROCESS',
        statusLabel: 'Chờ tiếp nhận',
        statusColor: '#f59e0b',
        cost: '0 đ (Miễn phí)',
        techNote: `Hình thức: ${deliveryMethod === 'SHOWROOM' ? 'Tại Showroom' : 'Đưa đón tận nơi 2 chiều'}`
      };

      const result = await warrantyApi.createClaim(payload);
      alert(
        '🎉 YÊU CẦU BẢO DƯỠNG ĐÃ ĐƯỢC GỬI THÀNH CÔNG LÊN CƠ SỞ DỮ LIỆU!\n\n' +
        `Mã phiếu kỹ thuật: #${result.warrantyCode || payload.warrantyCode}\n` +
        `Khách hàng: ${payload.customerName} - ${payload.customerPhone}\n` +
        `Dịch vụ: ${selectedService === 'ALIGN' ? 'Nắn chỉnh gọng' : selectedService === 'ULTRASONIC' ? 'Vệ sinh siêu âm' : 'Thay phụ kiện'}\n\n` +
        'Kỹ thuật viên phòng Lab sẽ liên hệ xác nhận trong vòng 30 phút.'
      );
      setNotes('');
      // Reload from database
      performSearch(searchCode, false);
    } catch (err) {
      alert(err.message || 'Không thể gửi yêu cầu bảo dưỡng. Vui lòng thử lại!');
    } finally {
      setSubmittingService(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <ShieldCheck className="w-3 h-3 text-[#086288]" />
            Hệ thống bảo hành điện tử E-Warranty CRM
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Trung Tâm Bảo Hành &amp; Tra Cứu Hậu Mãi
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Dữ liệu được số hóa và đồng bộ thời gian thực từ cơ sở dữ liệu hệ thống bán lẻ &amp; phòng khám nhãn khoa.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('claim-warranty')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-[#cae6ff]" />
          <span>Gửi Yêu Cầu Bảo Hành / Đổi Trả</span>
        </button>
      </div>

      {/* 2. Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#dee8ff] shadow-sm">
        <form onSubmit={handleSearchWarranty} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#40484e] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nhập số điện thoại đặt hàng, mã bảo hành (VD: WAR-...) hoặc mã đơn hàng..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full text-xs bg-[#f9f9ff] border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] outline-none focus:border-[#086288] focus:ring-1 focus:ring-[#086288]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Tra Cứu Bảo Hành</span>
          </button>
        </form>

        {searchFeedback && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
            searchFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* 3. Main Content: Warranties List & Quick Care Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Grouped Warranties List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111c2d]">
              Sản Phẩm Đang Được Bảo Hành ({groupedWarranties.length})
            </h2>
            <span className="text-[11px] text-[#40484e]">
              {currentUser ? `Tài khoản: ${currentUser.name || currentUser.fullName}` : 'Khách vãng lai'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff]">
              Đang tra cứu dữ liệu bảo hành chính hãng…
            </div>
          ) : groupedWarranties.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff] p-6 space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#40484e] mx-auto opacity-40" />
              <p className="font-semibold text-[#111c2d]">Chưa tìm thấy sản phẩm bảo hành nào</p>
              <p>Hãy nhập đúng số điện thoại đặt hàng để hệ thống truy xuất hồ sơ.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedWarranties.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-[#dee8ff] shadow-xs space-y-3 hover:border-[#086288] transition"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#086288]">
                        Đơn: {item.orderCode}
                      </span>
                      <span className="text-[11px] text-[#40484e]">· Khách: {item.customerName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Bảo hành chính hãng
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-[#111c2d] leading-snug">
                      {item.productName}
                    </h3>
                  </div>

                  {/* Active policies grouped */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#70787f] tracking-wider block">
                      Các quyền lợi & chính sách bảo hành đang áp dụng:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.policies.map((pol) => {
                        const isExchange = pol.policyRef?.includes('EXCHANGE') || pol.policyRef?.includes('30_DAYS');
                        const isAdjustment = pol.policyRef?.includes('ADJUSTMENT') || pol.policyRef?.includes('LIFETIME');
                        return (
                          <div 
                            key={pol.id || pol.warrantyCode}
                            className="p-2 rounded-lg bg-[#f8fafc] border border-slate-200/80 flex items-start gap-2"
                          >
                            <div className="w-5 h-5 rounded-md bg-[#e7eeff] text-[#086288] flex items-center justify-center shrink-0 mt-0.5">
                              {isExchange ? <Award className="w-3 h-3" /> : isAdjustment ? <Wrench className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            </div>
                            <div className="text-[11px] leading-tight flex-1">
                              <span className="font-bold text-[#111c2d] block">
                                {isExchange ? 'Đổi mới 30 ngày (Lỗi NSX)' : isAdjustment ? 'Nắn chỉnh gọng trọn đời' : (pol.policyRef || 'Bảo hành tiêu chuẩn')}
                              </span>
                              <span className="text-[10px] text-[#086288] font-mono">
                                #{pol.warrantyCode.slice(0, 16)}...
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {item.prescriptionNote && (
                    <div className="p-2.5 bg-[#f0f3ff] rounded-lg border border-[#dee8ff] text-[11px] text-[#004967] font-mono">
                      <div>OD: {item.prescriptionNote.od || '—'}</div>
                      <div>OS: {item.prescriptionNote.os || '—'}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#f0f3ff] flex items-center justify-between text-[11px] text-[#40484e]">
                    <span>Thời hạn: 12 Tháng chính hãng</span>
                    <button
                      onClick={() => {
                        setSelectedProduct(item.primaryCode);
                        const formEl = document.getElementById('quick-service-form');
                        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-[#086288] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Bảo dưỡng sản phẩm này →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Service Request Form */}
        <div id="quick-service-form" className="lg:col-span-5 bg-white p-5 rounded-xl border border-[#dee8ff] shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111c2d]">
              Đăng Ký Bảo Dưỡng Kính Nhanh
            </h3>
            <p className="text-xs text-[#40484e] mt-0.5">
              Miễn phí 100% căn chỉnh form gọng, thay đệm mũi và vệ sinh bằng sóng siêu âm.
            </p>
          </div>

          <form onSubmit={handleSubmitWarrantyRequest} className="space-y-3 text-xs">
            {/* Select Product */}
            <div>
              <label className="block font-semibold text-[#111c2d] mb-1">
                Sản phẩm kính cần chăm sóc
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-2 text-xs text-[#111c2d] outline-none"
              >
                {warranties.length > 0 ? (
                  warranties.map((w) => (
                    <option key={w.warrantyCode} value={w.warrantyCode}>
                      {w.warrantyCode} - {w.productName}
                    </option>
                  ))
                ) : (
                  <option value="GENERAL">Kính mắt OptiVision bất kỳ</option>
                )}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block font-semibold text-[#111c2d] mb-1">
                Dịch vụ kỹ thuật yêu cầu
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ALIGN', label: 'Nắn chỉnh càng kính' },
                  { id: 'ULTRASONIC', label: 'Rửa sóng siêu âm' },
                  { id: 'PAD_REPLACE', label: 'Thay đệm mũi silicone' },
                  { id: 'RX_INSURANCE', label: 'Đổi độ khúc xạ 180N' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedService(s.id)}
                    className={`p-2 rounded-lg text-left text-xs font-semibold border transition cursor-pointer ${
                      selectedService === s.id
                        ? 'bg-[#e7eeff] border-[#086288] text-[#004967]'
                        : 'bg-[#f9f9ff] border-[#dee8ff] text-[#40484e]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <label className="block font-semibold text-[#111c2d] mb-1">
                Hình thức tiếp nhận
              </label>
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
                  Mang tới Showroom
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
                  Giao nhận tận nơi
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-[#111c2d] mb-1">
                Ghi chú tình trạng kính
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả tình trạng: lỏng ốc, lệch sống mũi, hoặc độ nhìn mờ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#f9f9ff] border border-[#dee8ff] rounded-lg p-2 text-xs text-[#111c2d] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingService}
              className="w-full py-2.5 rounded-xl bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              {submittingService ? 'Đang gửi yêu cầu bảo dưỡng…' : 'Xác Nhận Đăng Ký Bảo Dưỡng (0đ)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
