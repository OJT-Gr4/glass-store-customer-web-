import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Search, ShieldCheck, 
  Calendar, ArrowRight, Eye, CheckCircle2 
} from 'lucide-react';
import { locationApi } from '../api/locationApi';

export default function StoreLocationsPage({ setActiveTab, onBookLocation }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL'); // ALL, HCM, HN, DN
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    locationApi.getActiveLocations()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          // Normalize real data from database
          const mapped = data.filter(loc => loc.code !== 'LAB' && loc.locationType !== 'LAB').map((loc, idx) => {
            const addr = loc.address || '';
            const detectedCity = addr.includes('Hà Nội') ? 'HN' 
              : addr.includes('Đà Nẵng') ? 'DN' 
              : addr.includes('Hồ Chí Minh') ? 'HCM' : '';
            return {
              id: loc.code || loc.id || `LOC-${idx}`,
              code: loc.code || `LOC-${idx}`,
              city: loc.city || detectedCity,
              name: loc.name || `Phòng Khám GlassStore ${loc.code}`,
              address: loc.address || '',
              phone: loc.phone || '',
              hours: loc.openingHours || '',
              headDoctor: loc.managerName || 'Chuyên viên Khúc xạ GlassStore',
              equipment: loc.equipment || 'Thiết bị đo tự động Topcon KR-800',
              features: ['Đo mắt 12 bước chuẩn quốc tế', 'Mài lắp tự động Đức'],
              image: loc.imageUrl || ''
            };
          });
          setLocations(mapped);
        } else {
          setLocations([]);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải danh sách chi nhánh từ CSDL, dùng mặc định:', err);
        setError('Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.');
        setLocations([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const displayedList = locations;

  const filteredShowrooms = displayedList.filter((s) => {
    if (cityFilter !== 'ALL' && s.city !== cityFilter) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchAddr = (s.address || '').toLowerCase().includes(q);
      const matchCode = (s.code || '').toLowerCase().includes(q);
      if (!matchName && !matchAddr && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="locations-page max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e4e4db]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eceee7] text-[#253c33] text-[11px] font-semibold mb-1">
            <MapPin className="w-3 h-3 text-[#30483b]" />
            Tìm cửa hàng gần bạn
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202924] tracking-tight">
            Hệ Thống Cửa Hàng &amp; Phòng Đo Khúc Xạ
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Tìm phòng khám và cơ sở GlassStore gần nhất để được đo mắt 12 bước miễn phí và tư vấn kính chuyên sâu.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('booking')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#30483b] hover:bg-[#253c33] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#dce5d9]" />
          <span>Đặt Lịch Đo Mắt Ngay</span>
        </button>
      </div>

      {/* 2. Search & City Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#e4e4db] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#40484e] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên chi nhánh, địa chỉ, quận huyện..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-xs bg-[#f9f8f4] border border-[#e4e4db] rounded-xl pl-9 pr-3 py-2 text-[#202924] outline-none focus:border-[#30483b] focus:ring-1 focus:ring-[#30483b]"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex bg-[#f1f2ec] p-1 rounded-xl border border-[#e4e4db]/60 text-xs shrink-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'HCM', label: 'TP. Hồ Chí Minh' },
            { id: 'HN', label: 'Hà Nội' },
            { id: 'DN', label: 'Đà Nẵng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCityFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                cityFilter === tab.id
                  ? 'bg-[#30483b] text-white font-bold shadow-xs'
                  : 'text-[#40484e] hover:text-[#202924]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Showrooms Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#40484e]">
          Đang tải danh sách cơ sở từ cơ sở dữ liệu…
        </div>
      ) : error ? (
        <div role="alert" className="py-16 text-center text-sm">{error}</div>
      ) : filteredShowrooms.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#e4e4db] p-8">
          Không tìm thấy chi nhánh nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowrooms.map((showroom) => (
            <div
              key={showroom.id}
              className="bg-white rounded-xl border border-[#e4e4db] overflow-hidden shadow-xs hover:border-[#30483b] transition flex flex-col justify-between"
            >
              <div className="h-44 w-full bg-[#f1f2ec] relative overflow-hidden">
                {showroom.image ? <img
                  src={showroom.image}
                  alt={showroom.name}
                  className="w-full h-full object-cover"
                /> : <div className="location-image-placeholder"><span>glassstore.</span><small>YOUR LOCAL EYEWEAR DESTINATION</small></div>}
                <span className="absolute top-3 left-3 bg-[#eceee7] text-[#253c33] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#e4e4db]">
                  Mã: {showroom.code}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#202924]">
                    {showroom.name}
                  </h3>
                  <p className="text-xs text-[#40484e] mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#30483b] shrink-0 mt-0.5" />
                    <span>{showroom.address || 'Địa chỉ đang được cập nhật'}</span>
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#f1f2ec] text-xs text-[#40484e]">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#30483b]" />
                    <span>Giờ mở cửa: {showroom.hours || 'Đang cập nhật'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#253c33]">
                    <Phone className="w-3.5 h-3.5 text-[#30483b]" />
                    <span>Hotline: {showroom.phone || 'Đang cập nhật'}</span>
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onBookLocation(showroom.code)}
                    className="flex-1 bg-[#30483b] hover:bg-[#253c33] text-white py-2 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                  >
                    Đặt lịch khám tại đây
                  </button>
                  {showroom.address && <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showroom.address)}`, '_blank', 'noopener,noreferrer')}
                    className="px-3 py-2 bg-[#eceee7] hover:bg-[#e4e4db] text-[#253c33] rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Chỉ đường
                  </button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
