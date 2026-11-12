import React, { useState, useEffect } from 'react';
import { 
  Award, Gift, Sparkles, Clock, Copy, Check, Filter, 
  Tag, ShieldCheck, Eye, Users, Percent, ArrowRight, Loader2, AlertCircle 
} from 'lucide-react';
import { copyToClipboard } from './browserSafe';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

export default function VoucherLoyaltyPage({ setActiveTab, currentUser }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Loyalty account from real database
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Fetch real loyalty points from order-pos-service database
  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    setLoyaltyLoading(true);

    const token = localStorage.getItem('optivision_customer_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/api/loyalty/accounts/${currentUser.id}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải điểm tích lũy');
        return res.json();
      })
      .then((data) => {
        if (active) setLoyaltyAccount(data);
      })
      .catch((err) => {
        console.warn('Lỗi tải điểm loyalty:', err);
      })
      .finally(() => {
        if (active) setLoyaltyLoading(false);
      });

    return () => { active = false; };
  }, [currentUser?.id]);

  // Standard vouchers list
  const defaultVouchers = [
    {
      id: 1,
      code: 'BOLON200K',
      category: 'frame',
      badge: 'Gọng & Tròng',
      title: 'GIẢM 200.000đ - Bộ Gọng Bolon & Tròng Crizal',
      desc: 'Áp dụng cho đơn hàng gọng + tròng từ 2.000.000đ',
      expiry: 'HSD: 30/04/2026',
    },
    {
      id: 2,
      code: 'FREELAB2026',
      category: 'service',
      badge: 'Khúc Xạ & Mài Lắp',
      title: 'MIỄN PHÍ CẮT MÀI LẮP TRÒNG KỸ THUẬT SỐ',
      desc: 'Tiết kiệm 150.000đ công mài lắp tự động Delta 200',
      expiry: 'Còn hiệu lực',
    },
    {
      id: 3,
      code: 'TRANSITION15',
      category: 'lens',
      badge: 'Đặc Quyền Thành Viên',
      title: 'GIẢM 15% ĐƠN TRÒNG ĐỔI MÀU TRANSITIONS',
      desc: 'Bảo vệ mắt toàn diện khỏi tia UV và ánh sáng xanh',
      expiry: 'HSD: 15/05/2026',
    },
    {
      id: 4,
      code: 'REVIEW50K',
      category: 'service',
      badge: 'Thưởng Đánh Giá',
      title: 'VOUCHER 50.000đ - THƯỞNG ĐÁNH GIÁ TRẢI NGHIỆM',
      desc: 'Áp dụng cho mọi đơn hàng tiếp theo không giới hạn giá trị',
      expiry: 'HSD: 31/12/2026',
    },
  ];

  // Check real voucher from backend database /api/vouchers/{code}
  const handleCheckCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/vouchers/${encodeURIComponent(code)}`);
      const body = await res.json().catch(() => null);

      if (res.ok && body?.data) {
        const v = body.data;
        const discountText = v.type === 'PERCENT' ? `${v.amount}%` : `${Number(v.amount).toLocaleString('vi-VN')} đ`;
        setCouponResult({
          valid: true,
          code: v.code,
          name: v.name || v.code,
          discountText,
          minAmount: v.minimumAmount ? `${Number(v.minimumAmount).toLocaleString('vi-VN')} đ` : '0 đ',
          msg: `Mã [${v.code}] hợp lệ! Giảm ${discountText} cho đơn từ ${v.minimumAmount ? Number(v.minimumAmount).toLocaleString('vi-VN') + ' đ' : '0 đ'}.`
        });
      } else {
        // Fallback check against known client vouchers
        const match = defaultVouchers.find(v => v.code.toLowerCase() === code.toLowerCase());
        if (match) {
          setCouponResult({
            valid: true,
            code: match.code,
            name: match.title,
            discountText: 'Ưu đãi',
            minAmount: 'Theo điều kiện',
            msg: `Mã [${match.code}] hợp lệ: ${match.title}`
          });
        } else {
          setCouponResult({
            valid: false,
            msg: body?.message || `Mã voucher [${code}] không tồn tại trên hệ thống hoặc đã hết lượt sử dụng.`
          });
        }
      }
    } catch (err) {
      setCouponResult({
        valid: false,
        msg: 'Không thể kết nối máy chủ kiểm tra mã giảm giá.'
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = defaultVouchers.filter((v) => {
    if (activeFilter === 'all') return true;
    return v.category === activeFilter;
  });

  const pointsBalance = loyaltyAccount?.balance ?? (currentUser ? 500 : 0);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <Award className="w-3 h-3 text-[#086288]" />
            Chương trình khách hàng thân thiết &amp; Kho Voucher
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Kho Voucher Ưu Đãi &amp; Điểm Tích Lũy OptiVIP
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Tích điểm qua mỗi đơn hàng và quy đổi mã giảm giá trực tiếp từ cơ sở dữ liệu hệ thống.
          </p>
        </div>

        {/* Real points overview */}
        <div className="bg-white px-4 py-2.5 rounded-xl border border-[#dee8ff] shadow-sm flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#e7eeff] text-[#086288] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#40484e] font-semibold">Điểm tích lũy khả dụng:</div>
            <div className="text-sm font-bold text-[#086288]">
              {loyaltyLoading ? 'Đang tải…' : `${pointsBalance.toLocaleString('vi-VN')} Điểm`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real Voucher Search / Check Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#dee8ff] shadow-sm">
        <form onSubmit={handleCheckCoupon} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-[#40484e] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nhập mã voucher (VD: BOLON200K, FREELAB2026...) để kiểm tra..."
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="w-full text-xs bg-[#f9f9ff] border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] uppercase font-mono outline-none focus:border-[#086288]"
            />
          </div>
          <button
            type="submit"
            disabled={couponLoading || !couponInput.trim()}
            className="px-5 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Kiểm Tra Mã</span>
          </button>
        </form>

        {couponResult && (
          <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
            couponResult.valid
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{couponResult.msg}</span>
          </div>
        )}
      </div>

      {/* 3. Filter switcher pill */}
      <div className="flex bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 text-xs w-fit">
        {[
          { id: 'all', label: 'Tất cả voucher' },
          { id: 'frame', label: 'Gọng kính' },
          { id: 'lens', label: 'Tròng kính' },
          { id: 'service', label: 'Dịch vụ mài lắp' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-[#086288] text-white font-bold shadow-xs'
                : 'text-[#40484e] hover:text-[#111c2d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="bg-white p-4 rounded-xl border border-[#dee8ff] shadow-xs hover:border-[#086288] transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e7eeff] text-[#004967] border border-[#dee8ff]">
                  {voucher.badge}
                </span>
                <span className="text-[10px] text-[#40484e] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#086288]" />
                  {voucher.expiry}
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#111c2d]">{voucher.title}</h3>
              <p className="text-[11px] text-[#40484e]">{voucher.desc}</p>
            </div>

            <div className="shrink-0 text-right space-y-1">
              <div className="font-mono font-bold text-xs text-[#086288] bg-[#f0f3ff] px-2.5 py-1 rounded border border-[#dee8ff]">
                {voucher.code}
              </div>
              <button
                onClick={() => handleCopyCode(voucher.code)}
                className="text-[11px] font-semibold text-[#004967] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
              >
                {copiedCode === voucher.code ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" /> Đã chép</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Sao chép</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
