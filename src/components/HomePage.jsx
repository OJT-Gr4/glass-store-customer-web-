import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Clock, Award, Eye, Calendar, Sparkles, 
  MapPin, ChevronRight, Search, FileText, CheckCircle2 
} from 'lucide-react';
import { productApi } from '../api/productApi';
import { locationApi } from '../api/locationApi';

export default function HomePage({ setActiveTab, openBooking, openAuth, onAddToCart, onViewDetail }) {
  const [selectedBestSellerTab, setSelectedBestSellerTab] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch real products and locations from database
  useEffect(() => {
    let active = true;
    setLoadingProducts(true);

    productApi.getAllProducts({ status: 'ACTIVE' })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải sản phẩm từ backend, sử dụng dữ liệu mặc định:', err);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    locationApi.getActiveLocations()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setLocations(data);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải chi nhánh từ backend:', err);
      });

    return () => { active = false; };
  }, []);

  const categories = [
    {
      id: 'frame',
      title: 'Gọng Kính Cao Cấp',
      desc: 'Khung titan, acetate thủ công nhập khẩu từ Nhật & Ý.',
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'lens',
      title: 'Tròng Kính Kỹ Thuật Số',
      desc: 'Lọc ánh sáng xanh, chống lóa và chống trầy xước chuẩn quang học.',
      image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'sun',
      title: 'Kính Râm Thời Trang',
      desc: 'Chống 100% tia UV, tròng phân cực polarized dịu mắt.',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'accessory',
      title: 'Phụ Kiện Kính Mắt',
      desc: 'Hộp da bảo vệ, khăn lau nano chống bám hơi sương.',
      image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Default fallback products if database is empty
  const defaultBestSellers = [
    {
      id: 1,
      brand: 'Ray-Ban',
      name: 'Clubmaster Classic RB3016',
      sku: 'RB3016-W0365',
      price: 4250000,
      image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80',
      tag: 'Bán chạy',
      productType: 'SUNGLASSES'
    },
    {
      id: 2,
      brand: 'BOLON PARIS',
      name: 'Bolon Smart BJ60520 Titanium',
      sku: 'BOLON-BJ60520',
      price: 3850000,
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
      tag: 'Titanium',
      productType: 'FRAME'
    },
    {
      id: 3,
      brand: 'CHARMANT LINE ART',
      name: 'Charmant Excellence CH2110',
      sku: 'CHRM-CH2110',
      price: 7350000,
      image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80',
      tag: 'Cao cấp',
      productType: 'FRAME'
    },
    {
      id: 4,
      brand: 'ESSILOR FRANCE',
      name: 'Crizal® Sapphire™ HR 1.67',
      sku: 'LNS-ESSI-167',
      price: 2950000,
      image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80',
      tag: 'Tròng số 1',
      productType: 'LENS'
    },
  ];

  // Map real products from database or fallback
  const displayedBestSellers = products.length > 0 
    ? products.slice(0, 8).map((p) => {
        const firstVariant = p.variants?.[0];
        const defaultImg = p.productType === 'LENS' 
          ? 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80'
          : p.productType === 'SUNGLASSES'
            ? 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80';
        return {
          id: p.id,
          brand: p.brandName || p.brand || 'OptiVision',
          name: p.name,
          sku: firstVariant?.sku || p.sku || `SKU-${p.id}`,
          price: firstVariant?.price || p.price || 0,
          image: p.imageUrl || p.image || defaultImg,
          tag: p.productType === 'FRAME' ? 'Gọng kính' : p.productType === 'LENS' ? 'Tròng kính' : 'Bán chạy',
          productType: p.productType,
          raw: p
        };
      })
    : defaultBestSellers;

  // Filter based on tab
  const filteredBestSellers = displayedBestSellers.filter((item) => {
    if (selectedBestSellerTab === 'ALL') return true;
    if (selectedBestSellerTab === 'BEST') return item.tag === 'Bán chạy' || item.productType === 'FRAME';
    if (selectedBestSellerTab === 'TITAN') return item.name.toLowerCase().includes('titan') || item.tag === 'Titanium';
    if (selectedBestSellerTab === 'FASHION') return item.productType === 'SUNGLASSES' || item.productType === 'FRAME';
    return true;
  });

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-10 py-6 max-w-[1440px] mx-auto px-4 sm:px-6">
      {/* 1. Minimal Hero Section - Light, clean, matching Internal Portal */}
      <section className="bg-white rounded-2xl border border-[#dee8ff] p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e7eeff] text-[#004967] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#086288]"></span>
              Chuỗi Cửa Hàng Kính Mắt Chính Hãng
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#111c2d] tracking-tight leading-tight">
              Thấu thị tinh hoa, <br />
              <span className="text-[#086288]">Định hình phong cách.</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#40484e] leading-relaxed max-w-xl">
              Phân phối gọng kính thời trang, tròng kính kiểm soát khúc xạ và phụ kiện quang học chính hãng từ Ray-Ban, Bolon, Gentle Monster, Essilor và Zeiss.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
              >
                <span>Khám Phá Bộ Sưu Tập</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={openBooking}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#086288]" />
                <span>Đặt Lịch Đo Mắt Showroom</span>
              </button>
            </div>

            {/* Quick trust checklist */}
            <div className="pt-4 border-t border-[#e7eeff] flex flex-wrap items-center gap-6 text-xs text-[#40484e]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#086288]" />
                <span>{locations.length > 0 ? `${locations.length}+ Showroom toàn quốc` : 'Showroom hiện đại'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#086288]" />
                <span>100% Tròng chính hãng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#086288]" />
                <span>Bảo hành độ khúc xạ 180 ngày</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean image card */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden border border-[#dee8ff] shadow-sm bg-[#f0f3ff] aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80"
                alt="Bộ sưu tập kính mắt OptiVision"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Curated Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111c2d]">
              Danh Mục Sản Phẩm &amp; Dịch Vụ
            </h2>
            <p className="text-xs text-[#40484e]">
              Khám phá các dòng sản phẩm gọng kính, tròng kính và phụ kiện tuyển chọn
            </p>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="text-xs font-bold text-[#086288] hover:text-[#004967] flex items-center gap-1 transition cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setActiveTab('products')}
              className="group bg-white rounded-xl overflow-hidden border border-[#dee8ff] hover:border-[#086288] transition duration-200 cursor-pointer flex flex-col justify-between shadow-xs"
            >
              <div className="h-40 w-full overflow-hidden bg-[#f0f3ff]">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#111c2d] text-xs group-hover:text-[#086288] transition">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-[#40484e] mt-1 leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Bestsellers Section (From Real Database) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111c2d]">
              Sản Phẩm Nổi Bật ({filteredBestSellers.length})
            </h2>
            <p className="text-xs text-[#40484e]">
              Bộ sưu tập gọng kính và tròng kính thịnh hành được yêu thích nhất
            </p>
          </div>

          {/* Filter switcher pill */}
          <div className="flex bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 text-xs">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'BEST', label: 'Bán chạy' },
              { id: 'TITAN', label: 'Titanium' },
              { id: 'FASHION', label: 'Thời trang' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedBestSellerTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedBestSellerTab === tab.id
                    ? 'bg-[#086288] text-white font-bold shadow-xs'
                    : 'text-[#40484e] hover:text-[#111c2d]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBestSellers.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden border border-[#dee8ff] hover:border-[#086288]/60 transition flex flex-col justify-between shadow-xs"
            >
              <div className="relative h-44 bg-[#f9f9ff] p-2 flex items-center justify-center overflow-hidden border-b border-[#f0f3ff]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <span className="absolute top-3 left-3 bg-[#e7eeff] text-[#004967] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#dee8ff]">
                  {item.tag}
                </span>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#086288] tracking-wider block">
                    {item.brand}
                  </span>
                  <h3 className="font-bold text-[#111c2d] text-xs mt-0.5 line-clamp-1">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#f0f3ff] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111c2d]">
                    {formatPrice(item.price)}
                  </span>
                  <button
                    onClick={() => {
                      if (item.raw && onViewDetail) onViewDetail(item.raw);
                      else if (onAddToCart) onAddToCart(item);
                    }}
                    className="bg-[#086288] hover:bg-[#004967] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Electronic Prescription Callout Card */}
      <section className="bg-[#f0f3ff] border border-[#dee8ff] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#086288] text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5 text-[#cae6ff]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111c2d]">
              Bạn đã từng đo khúc xạ tại phòng khám OptiVision?
            </h3>
            <p className="text-xs text-[#40484e] mt-0.5">
              Tra cứu nhanh số đo SPH, CYL, AXIS và khoảng cách đồng tử PD trong hồ sơ thị lực để đặt kính trực tuyến.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('records')}
            className="flex-1 md:flex-initial bg-[#086288] hover:bg-[#004967] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer"
          >
            Xem Hồ Sơ Thị Lực
          </button>
          <button
            onClick={openBooking}
            className="flex-1 md:flex-initial bg-white border border-[#dee8ff] hover:bg-[#dee8ff] text-[#004967] px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer"
          >
            Đặt Lịch Đo Mới
          </button>
        </div>
      </section>

      {/* 5. 3 Guided Steps */}
      <section className="space-y-4">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-[#111c2d]">
            Quy Trình Mua Kính Chuẩn Y Khoa
          </h2>
          <p className="text-xs text-[#40484e]">
            Đơn giản, minh bạch và chính xác từ khâu đo khám đến thành phẩm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#dee8ff] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#e7eeff] text-[#086288] flex items-center justify-center mb-3 font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-[#111c2d] text-xs">Chọn Gọng Kính Phù Hợp</h3>
              <p className="text-[11px] text-[#40484e] mt-1 leading-relaxed">
                Nhiều lựa chọn gọng titan, acetate chuẩn tỉ lệ khuôn mặt, bền bỉ và trọng lượng siêu nhẹ.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-bold text-[#086288] hover:text-[#004967] flex items-center gap-1 cursor-pointer"
            >
              <span>Xem gọng kính</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#dee8ff] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#e7eeff] text-[#086288] flex items-center justify-center mb-3 font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-[#111c2d] text-xs">Đo Khúc Xạ &amp; Nhập Toa Kính</h3>
              <p className="text-[11px] text-[#40484e] mt-1 leading-relaxed">
                Đo khám thị lực trực tiếp tại showroom hoặc sử dụng lại toa kính trong hồ sơ thị lực.
              </p>
            </div>
            <button
              onClick={openBooking}
              className="text-xs font-bold text-[#086288] hover:text-[#004967] flex items-center gap-1 cursor-pointer"
            >
              <span>Đặt lịch đo mắt</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#dee8ff] shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#e7eeff] text-[#086288] flex items-center justify-center mb-3 font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-[#111c2d] text-xs">Gia Công Lab &amp; Nhận Kính</h3>
              <p className="text-[11px] text-[#40484e] mt-1 leading-relaxed">
                Máy mài tự động Essilor Delta 200 gia công chuẩn xác tâm quang học, nhận kính nhanh sau 20 phút.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('warranty')}
              className="text-xs font-bold text-[#086288] hover:text-[#004967] flex items-center gap-1 cursor-pointer"
            >
              <span>Chính sách bảo hành</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Clean Showrooms Overview (From Database) */}
      <section className="bg-white rounded-2xl border border-[#dee8ff] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#111c2d]">
              Hệ Thống Chi Nhánh ({locations.length > 0 ? locations.length : 3} Chi Nhánh)
            </h2>
            <p className="text-xs text-[#40484e]">
              Cơ sở đạt chuẩn phòng khám khúc xạ, nạp trực tiếp từ cơ sở dữ liệu hệ thống
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stores')}
            className="text-xs font-bold text-[#086288] hover:text-[#004967] flex items-center gap-1 cursor-pointer"
          >
            <span>Xem chi tiết showroom</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(locations.length > 0 ? locations.slice(0, 3) : [
            { code: 'Q1', name: 'OptiVision Flagship Quận 1', address: '88 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', phone: '028 3822 6868' },
            { code: 'HK', name: 'OptiVision Flagship Hoàn Kiếm', address: '24 Tràng Tiền, Hoàn Kiếm, Hà Nội', phone: '024 3936 6868' },
            { code: 'HC', name: 'OptiVision Hải Châu', address: '102 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', phone: '0236 388 6868' },
          ]).map((loc, idx) => (
            <div key={loc.code || idx} className="p-4 bg-[#f9f9ff] rounded-xl border border-[#dee8ff] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111c2d]">{loc.name}</span>
                <span className="text-[10px] font-semibold bg-[#e7eeff] text-[#004967] px-2 py-0.5 rounded">
                  {loc.code || `CN-0${idx + 1}`}
                </span>
              </div>
              <p className="text-[11px] text-[#40484e] flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#086288] shrink-0 mt-0.5" />
                <span>{loc.address || 'Đang cập nhật địa chỉ'}</span>
              </p>
              {loc.phone && (
                <p className="text-[10px] text-[#086288] font-semibold">
                  Hotline: {loc.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
