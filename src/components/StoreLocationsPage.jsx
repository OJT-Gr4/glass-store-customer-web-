import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, Search, ShieldCheck, 
  Calendar, ArrowRight, Eye, CheckCircle2 
} from 'lucide-react';
import { locationApi } from '../api/locationApi';

export default function StoreLocationsPage({ setActiveTab }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('ALL'); // ALL, HCM, HN, DN
  const [searchKeyword, setSearchKeyword] = useState('');

  // Default fallback showrooms if database has not seeded
  const defaultShowrooms = [
    {
      id: 'Q1',
      code: 'Q1',
      city: 'HCM',
      name: 'OptiVision Flagship Quận 1',
      address: '85 Lê Thánh Tôn, P. Bến Nghé, Quận 1, TP.HCM',
      phone: '028 3822 6868',
      hours: '08:30 - 21:30 (Thứ 2 - CN)',
      headDoctor: 'BS. Khúc xạ Lâm Hoàng Phúc',
      equipment: 'Máy đo Topcon KR-800 Nhật Bản, Essilor Delta 200 Pháp',
      features: ['Đo mắt 12 bước', 'Lấy ngay 20 phút', 'Đậu xe hơi miễn phí'],
      image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'HK',
      code: 'HK',
      city: 'HN',
      name: 'OptiVision Flagship Hoàn Kiếm',
      address: '24 Tràng Tiền, Hoàn Kiếm, Hà Nội',
      phone: '024 3936 6868',
      hours: '08:30 - 21:30 (Thứ 2 - CN)',
      headDoctor: 'ThS. Đỗ Thùy Trang (ĐHY Hà Nội)',
      equipment: 'Hệ thống Topcon CV-5000 tự động, Essilor Pro Special 2.0',
      features: ['Đo mắt 12 bước', 'Lấy ngay 20 phút', 'Valet Parking ô tô'],
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'HC',
      code: 'HC',
      city: 'DN',
      name: 'OptiVision Hải Châu – Đà Nẵng',
      address: '102 Nguyễn Văn Linh, P. Nam Dương, Hải Châu, Đà Nẵng',
      phone: '0236 388 6868',
      hours: '08:30 - 21:30 (Thứ 2 - CN)',
      headDoctor: 'Cử nhân Khúc xạ Nguyễn Văn Bình',
      equipment: 'Máy đo khúc xạ Topcon KR-800, máy mài Nidek LE-900',
      features: ['Đo mắt 12 bước', 'Chỗ đậu xe rộng'],
      image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80',
    },
  ];

  useEffect(() => {
    let active = true;
    setLoading(true);

    locationApi.getActiveLocations()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          // Normalize real data from database
          const mapped = data.map((loc, idx) => {
            const addr = loc.address || '';
            const detectedCity = addr.includes('Hà Nội') ? 'HN' 
              : addr.includes('Đà Nẵng') ? 'DN' 
              : 'HCM';
            return {
              id: loc.code || loc.id || `LOC-${idx}`,
              code: loc.code || `LOC-${idx}`,
              city: loc.city || detectedCity,
              name: loc.name || `Phòng Khám OptiVision ${loc.code}`,
              address: loc.address || 'Đang cập nhật địa chỉ',
              phone: loc.phone || '1900 6868',
              hours: loc.openingHours || '08:30 - 21:30 (Thứ 2 - CN)',
              headDoctor: loc.managerName || 'Chuyên viên Khúc xạ OptiVision',
              equipment: loc.equipment || 'Thiết bị đo tự động Topcon KR-800',
              features: ['Đo mắt 12 bước chuẩn quốc tế', 'Mài lắp tự động Đức'],
              image: loc.imageUrl || defaultShowrooms[idx % defaultShowrooms.length].image
            };
          });
          setLocations(mapped);
        } else {
          setLocations(defaultShowrooms);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải danh sách chi nhánh từ CSDL, dùng mặc định:', err);
        setLocations(defaultShowrooms);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const displayedList = locations.length > 0 ? locations : defaultShowrooms;

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <MapPin className="w-3 h-3 text-[#086288]" />
            Dữ liệu đồng bộ trực tiếp từ hệ thống
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Hệ Thống Cửa Hàng &amp; Phòng Đo Khúc Xạ
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Tìm phòng khám và cơ sở OptiVision gần nhất để được đo mắt 12 bước miễn phí và tư vấn kính chuyên sâu.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('booking')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#cae6ff]" />
          <span>Đặt Lịch Đo Mắt Ngay</span>
        </button>
      </div>

      {/* 2. Search & City Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#40484e] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên chi nhánh, địa chỉ, quận huyện..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-xs bg-[#f9f9ff] border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] outline-none focus:border-[#086288] focus:ring-1 focus:ring-[#086288]"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 text-xs shrink-0">
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
                  ? 'bg-[#086288] text-white font-bold shadow-xs'
                  : 'text-[#40484e] hover:text-[#111c2d]'
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
      ) : filteredShowrooms.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff] p-8">
          Không tìm thấy chi nhánh nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowrooms.map((showroom) => (
            <div
              key={showroom.id}
              className="bg-white rounded-xl border border-[#dee8ff] overflow-hidden shadow-xs hover:border-[#086288] transition flex flex-col justify-between"
            >
              <div className="h-44 w-full bg-[#f0f3ff] relative overflow-hidden">
                <img
                  src={showroom.image}
                  alt={showroom.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#e7eeff] text-[#004967] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#dee8ff]">
                  Mã: {showroom.code}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111c2d]">
                    {showroom.name}
                  </h3>
                  <p className="text-xs text-[#40484e] mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#086288] shrink-0 mt-0.5" />
                    <span>{showroom.address}</span>
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#f0f3ff] text-xs text-[#40484e]">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#086288]" />
                    <span>Giờ mở cửa: {showroom.hours}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#004967]">
                    <Phone className="w-3.5 h-3.5 text-[#086288]" />
                    <span>Hotline: {showroom.phone}</span>
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="flex-1 bg-[#086288] hover:bg-[#004967] text-white py-2 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                  >
                    Đặt lịch khám tại đây
                  </button>
                  <button
                    onClick={() => alert(`Đang chỉ đường tới: ${showroom.name} - ${showroom.address}`)}
                    className="px-3 py-2 bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Chỉ đường
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
