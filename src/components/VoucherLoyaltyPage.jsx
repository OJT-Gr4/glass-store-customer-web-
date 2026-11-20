import React, { useState, useEffect } from 'react';
import { 
  Award, Gift, Sparkles, Clock, Copy, Check, Filter, 
  Tag, ShieldCheck, Eye, Users, Percent, ArrowRight, Loader2, AlertCircle 
} from 'lucide-react';
import { copyToClipboard } from './browserSafe';
import { voucherAvailability, voucherDisplay } from './voucherDisplay';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

export default function VoucherLoyaltyPage({ setActiveTab, currentUser }) {
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Loyalty account from real database
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Fetch real loyalty points from order-pos-service database
  useEffect(() => {
    setLoyaltyAccount(null);
    if (!currentUser?.id) return;
    let active = true;
    setLoyaltyLoading(true);

    const token = localStorage.getItem('optivision_customer_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const load = () => fetch(`${API_BASE_URL}/api/loyalty/accounts/${currentUser.id}`, { headers })
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

    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [currentUser?.id]);

  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [vouchersError, setVouchersError] = useState(false);
  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    const token = localStorage.getItem('optivision_customer_token');
    setVouchersLoading(true); setVouchersError(false);
    fetch(`${API_BASE_URL}/api/vouchers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => { if (!res.ok) throw new Error('voucher request failed'); return res.json(); })
      .then(body => { if (!Array.isArray(body?.data)) throw new Error('invalid voucher data'); if (active) setVouchers(body.data.filter(v => voucherAvailability(v)).map(voucherDisplay)); })
      .catch(() => { if (active) setVouchersError(true); })
      .finally(() => { if (active) setVouchersLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id]);

  const handleCheckCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true); setCouponResult(null);
    try {
      const token = localStorage.getItem('optivision_customer_token');
      const res = await fetch(`${API_BASE_URL}/api/vouchers/${encodeURIComponent(code)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.data && voucherAvailability(body.data)) {
        const voucher = voucherDisplay(body.data);
        setCouponResult({ valid: true, msg: `${voucher.code}: ${voucher.title}. ${voucher.desc}` });
      } else {
        setCouponResult({ valid: false, msg: res.status === 404 || res.ok ? 'Mã voucher không tồn tại hoặc hiện không áp dụng.' : 'Không thể kiểm tra mã voucher. Vui lòng thử lại.' });
      }
    } catch {
      setCouponResult({ valid: false, msg: 'Không thể kết nối máy chủ kiểm tra mã giảm giá.' });
    } finally { setCouponLoading(false); }
  };

  const handleCopyCode = (code) => {
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = vouchers;

  const pointsBalance = Number(loyaltyAccount?.balance ?? 0);
  const tierPoints = Number(loyaltyAccount?.tierPoints ?? pointsBalance);
  const tierCode = loyaltyAccount?.tierCode || (tierPoints >= 10000 ? 'DIAMOND' : tierPoints >= 5000 ? 'GOLD' : tierPoints >= 1000 ? 'SILVER' : 'MEMBER');
  const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';
  const pointHistory = (loyaltyAccount?.entries || []).filter(entry => Number(entry.points) !== 0);
  const currentTier = loyaltyAccount?.tier || (loyaltyAccount ? (pointsBalance >= 10000 ? 'Hạng Kim Cương' : pointsBalance >= 5000 ? 'Hạng Vàng' : pointsBalance >= 1000 ? 'Hạng Bạc' : 'Thành Viên') : 'Chưa tải được');

  // Next tier progress calculation
  const nextTierTarget = { MEMBER: 1000, SILVER: 5000, GOLD: 10000 }[tierCode] || null;
  const nextTierName = { MEMBER: 'Hạng Bạc', SILVER: 'Hạng Vàng', GOLD: 'Hạng Kim Cương' }[tierCode] || null;
  const tierProgressPercent = nextTierTarget 
    ? Math.min(100, Math.round((tierPoints / nextTierTarget) * 100))
    : 100;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e4e4db]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eceee7] text-[#253c33] text-[11px] font-semibold mb-1">
            <Award className="w-3 h-3 text-[#30483b]" />
            Chương trình khách hàng thân thiết &amp; Kho Voucher
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202924] tracking-tight">
            Kho Voucher Ưu Đãi &amp; Điểm Tích Lũy OptiVIP
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Tích lũy 1 điểm cho mỗi 1.000đ đơn hàng đã thanh toán. Nâng hạng thành viên để nhận đặc quyền riêng biệt.
          </p>
        </div>

        {/* Real points & Tier overview */}
        <div className="bg-white px-4 py-3 rounded-2xl border border-[#e4e4db] shadow-sm flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#30483b] to-[#253c33] text-white flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-5 h-5 text-[#dce5d9]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#40484e] font-semibold uppercase tracking-wider">Hạng:</span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                currentTier.includes('Kim Cương') ? 'bg-purple-100 text-purple-800' :
                currentTier.includes('Vàng') ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {currentTier}
              </span>
            </div>
            <div className="text-base font-black text-[#30483b] mt-0.5">
              {loyaltyLoading ? 'Đang tải…' : loyaltyAccount ? `${pointsBalance.toLocaleString('vi-VN')} Điểm` : 'Chưa tải được điểm'}
            </div>
          </div>
        </div>
      </div>

      {/* Membership Tiers & Benefit Progress */}
      <div className="bg-gradient-to-r from-[#f1f2ec] to-[#f9f8f4] p-4 sm:p-5 rounded-2xl border border-[#e4e4db]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#202924] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#30483b]" />
              Tiến trình nâng hạng thành viên
            </h3>
            <p className="text-[11px] text-[#40484e] mt-0.5">
              {!loyaltyAccount ? (loyaltyLoading ? 'Đang tải tiến trình…' : 'Chưa tải được tiến trình thành viên.') : nextTierTarget
                ? `Bạn còn thiếu ${Math.max(0, nextTierTarget - tierPoints).toLocaleString('vi-VN')} điểm xét hạng để đạt ${nextTierName}.`
                : 'Chúc mừng! Bạn đã đạt hạng Kim Cương cao cấp nhất với trọn bộ đặc quyền VIP.'}
            </p>
          </div>
          <div className="text-[11px] text-[#253c33] font-semibold bg-white/80 px-3 py-1.5 rounded-xl border border-[#e4e4db] shrink-0">
            Quy tắc: 1.000đ = +1 điểm tích lũy
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-[#30483b] to-sky-400 rounded-full transition-all duration-500"
            style={{ width: `${tierProgressPercent}%` }}
          />
        </div>

        {/* Membership levels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className={`p-3 rounded-xl border transition ${
            currentTier === 'Thành Viên' ? 'bg-white border-[#30483b] shadow-sm ring-1 ring-[#30483b]/20' : 'bg-white/60 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Thành Viên</span>
              <span className="text-[10px] text-slate-500 font-mono">0 - 999 pts</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Khởi tạo khi đăng ký (0 điểm), tích lũy tự động qua mỗi đơn hàng.</p>
          </div>

          <div className={`p-3 rounded-xl border transition ${currentTier.includes('Bạc') ? 'bg-white border-[#30483b] shadow-sm ring-1 ring-[#30483b]/20' : 'bg-white/60 border-slate-200'}`}>
            <div className="flex items-center justify-between"><span className="font-bold text-slate-700">Hạng Bạc</span><span className="text-[10px] text-slate-500 font-mono">1.000 - 4.999 pts</span></div>
            <p className="text-[11px] text-slate-600 mt-1">Ưu đãi dành cho thành viên hạng Bạc.</p>
          </div>

          <div className={`p-3 rounded-xl border transition ${
            currentTier.includes('Vàng') ? 'bg-white border-amber-500 shadow-sm ring-1 ring-amber-500/20' : 'bg-white/60 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 flex items-center gap-1">★ Hạng Vàng</span>
              <span className="text-[10px] text-amber-700 font-mono">5.000 - 9.999 pts</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Ưu tiên phục vụ phòng khám, voucher quà tặng ngày hội thành viên.</p>
          </div>

          <div className={`p-3 rounded-xl border transition ${
            currentTier.includes('Kim Cương') ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-500/20' : 'bg-white/60 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-800 flex items-center gap-1">✦ Hạng Kim Cương</span>
              <span className="text-[10px] text-purple-700 font-mono">10.000+ pts</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Đặc quyền cao nhất: Miễn phí mài lắp kỹ thuật số, vệ sinh &amp; cân chỉnh trọn đời.</p>
          </div>
        </div>
      </div>

      {/* 2. Real Voucher Search / Check Bar */}
      {loyaltyAccount && <section aria-label="Bảo lưu điểm thân thiết" className="rounded-2xl border border-[#e4e4db] bg-white p-4 sm:p-5 space-y-4 text-sm text-[#253c33]">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><h2 className="font-bold">Điểm xét hạng trong 12 tháng</h2><p className="mt-1 text-lg font-semibold">{tierPoints.toLocaleString('vi-VN')} điểm</p><p className="text-xs mt-1 text-[#40484e]">Hạng hiện tại được bảo lưu đến {formatDate(loyaltyAccount.tierProtectedUntil)}. Dùng điểm và giảm điểm do không hoạt động không trừ điểm xét hạng.</p></div>
          <div><h2 className="font-bold">Bảo lưu điểm đang có</h2><p className="mt-1">{pointsBalance > 0 && loyaltyAccount.nextDecayAt ? <>Dự kiến giảm <strong>{Number(loyaltyAccount.nextDecayPoints || 0).toLocaleString('vi-VN')} điểm</strong> vào <strong>{formatDate(loyaltyAccount.nextDecayAt)}</strong> nếu không có hoạt động mới.</> : 'Chưa có điểm cần bảo lưu.'}</p><p className="text-xs mt-1 text-[#40484e]">{loyaltyAccount.lastActivityAt ? 'Hoạt động hợp lệ gần nhất' : 'Bắt đầu bảo lưu'}: {formatDate(loyaltyAccount.lastActivityAt || loyaltyAccount.protectionStartedAt)}.</p></div>
        </div>
        <p className="rounded-xl bg-[#f1f2ec] p-3 text-xs leading-relaxed">Mỗi lần mua hàng đã thanh toán hoặc hoàn tất dịch vụ chăm sóc kính sẽ bảo lưu điểm thêm 6 tháng. Sau đó, giảm 5% số dư mỗi tháng, làm tròn số điểm giảm lên. Bạn được nhắc trước 15 ngày qua thông báo trong tài khoản. Đăng nhập và đặt lịch chưa thực hiện không gia hạn điểm.</p>
        <details className="border-t border-[#e4e4db] pt-3"><summary className="cursor-pointer font-semibold py-2">Lịch sử điểm ({pointHistory.length})</summary>
          {pointHistory.length === 0 ? <p className="text-xs py-3">Chưa có thay đổi điểm.</p> : <ul className="max-h-72 overflow-y-auto divide-y divide-[#e4e4db]">{pointHistory.map(entry => <li key={entry.id} className="flex justify-between gap-4 py-3"><div className="min-w-0"><p className="text-sm break-words">{entry.reason || entry.entryType}</p><p className="text-xs text-[#40484e] mt-1">{formatDate(entry.createdAt)}</p></div><strong className={`shrink-0 ${entry.points < 0 ? 'text-amber-800' : 'text-[#30483b]'}`}>{entry.points > 0 ? '+' : ''}{Number(entry.points).toLocaleString('vi-VN')} điểm</strong></li>)}</ul>}
        </details>
      </section>}
      <div className="bg-white p-4 rounded-xl border border-[#e4e4db] shadow-sm">
        <form onSubmit={handleCheckCoupon} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-[#40484e] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Nhập mã voucher để kiểm tra..."
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="w-full text-xs bg-[#f9f8f4] border border-[#e4e4db] rounded-xl pl-9 pr-3 py-2 text-[#202924] uppercase font-mono outline-none focus:border-[#30483b]"
            />
          </div>
          <button
            type="submit"
            disabled={couponLoading || !couponInput.trim()}
            className="px-5 py-2 rounded-xl bg-[#30483b] hover:bg-[#253c33] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
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

      <h2 className="text-sm font-bold text-[#253c33]">Ưu đãi hiện có</h2>

      {vouchersLoading && <p role="status">Đang tải ưu đãi…</p>}
      {vouchersError && <p role="alert">Không thể tải danh sách ưu đãi. Vui lòng tải lại trang.</p>}
      {!vouchersLoading && !vouchersError && filteredVouchers.length === 0 && <p>Chưa có ưu đãi phù hợp.</p>}
      {/* 4. Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="bg-white p-4 rounded-xl border border-[#e4e4db] shadow-xs hover:border-[#30483b] transition flex items-center justify-between gap-4"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#eceee7] text-[#253c33] border border-[#e4e4db]">
                  {voucher.badge}
                </span>
                <span className="text-[10px] text-[#40484e] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#30483b]" />
                  {voucher.expiry}
                </span>
              </div>
              <h3 className="font-bold text-xs text-[#202924]">{voucher.title}</h3>
              <p className="text-[11px] text-[#40484e]">{voucher.desc}</p>
            </div>

            <div className="shrink-0 text-right space-y-1">
              <div className="font-mono font-bold text-xs text-[#30483b] bg-[#f1f2ec] px-2.5 py-1 rounded border border-[#e4e4db]">
                {voucher.code}
              </div>
              <button
                onClick={() => handleCopyCode(voucher.code)}
                className="text-[11px] font-semibold text-[#253c33] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
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
