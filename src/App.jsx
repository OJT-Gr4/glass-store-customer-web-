import React, { useEffect, useState } from 'react';
import { productApi } from './api/productApi';
import {
  ShoppingBag, Search, Eye, Sparkles, ShieldCheck, Clock, CheckCircle2,
  X, Plus, Minus, Trash2, ArrowRight, Phone, MapPin, Award
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [cart, setCart] = useState([
    {
      id: 1,
      name: 'Gọng Kính Titanium Bolon Square',
      sku: 'FRM-BOLON-BLK',
      price: 3250000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=500&q=80'
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'ALL' ? { productType: selectedType } : {};
      const data = await productApi.getAllProducts(params);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        throw new Error('Fallback sample');
      }
    } catch (err) {
      // Dữ liệu mẫu kính chuẩn nhãn khoa & thời trang
      setProducts([
        {
          id: 1,
          name: 'Gọng Kính Titanium Bolon Square Mắt Vuông',
          categoryName: 'Gọng Kính',
          brandName: 'Bolon',
          productType: 'FRAME',
          tag: 'Titanium Siêu Nhẹ',
          description: 'Gọng Titanium siêu nhẹ cao cấp, chống ăn mòn, thiết kế mắt vuông nam tính tôn nét mặt.',
          variants: [
            {
              id: 1,
              name: 'Gọng Bolon Titanium - Đen Nhám',
              sku: 'FRM-BOLON-BLK',
              price: 3250000,
              color: 'Đen',
              material: 'Titanium B-Titan',
              stockQuantity: 45,
              imageUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80'
            }
          ]
        },
        {
          id: 2,
          name: 'Gọng Kính Nhựa Dẻo Gentle Monster South Side',
          categoryName: 'Gọng Kính',
          brandName: 'Gentle Monster',
          productType: 'FRAME',
          tag: 'Hàn Quốc Hot Trend',
          description: 'Chất liệu TR90 siêu bền uốn dẻo, dáng mắt vintage cá tính chuẩn xu hướng giới trẻ.',
          variants: [
            {
              id: 3,
              name: 'Gọng Gentle Monster TR90 - Đen Bóng',
              sku: 'FRM-GM-BLK',
              price: 1850000,
              color: 'Đen bóng',
              material: 'Nhựa TR90 Thụy Sĩ',
              stockQuantity: 50,
              imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80'
            }
          ]
        },
        {
          id: 3,
          name: 'Tròng Cận Chống Ánh Sáng Xanh Chemi U2 1.60',
          categoryName: 'Tròng Kính',
          brandName: 'Chemi Lens',
          productType: 'LENS',
          tag: 'BlueCut Chống Mỏi',
          description: 'Chiết suất 1.60 mỏng nhẹ, lớp phủ Crystal U2 hạn chế trầy xước, ngăn 99% ánh sáng xanh từ màn hình.',
          variants: [
            {
              id: 6,
              name: 'Cặp Tròng Chemi U2 BlueCut 1.60',
              sku: 'LNS-CHEMI-160',
              price: 650000,
              lensIndex: '1.60',
              stockQuantity: 100,
              imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80'
            }
          ]
        },
        {
          id: 4,
          name: 'Kính Râm Ray-Ban Classic Wayfarer Polarized',
          categoryName: 'Kính Râm',
          brandName: 'Ray-Ban',
          productType: 'SUNGLASSES',
          tag: 'Phân Cực Polarized',
          description: 'Huyền thoại Ray-Ban Wayfarer gọng đen bóng, mắt xanh rêu phân cực chống lóa lái xe tối ưu.',
          variants: [
            {
              id: 8,
              name: 'Kính Râm Ray-Ban Wayfarer Polarized',
              sku: 'SUN-RB-WAYF-BLK',
              price: 4950000,
              color: 'Đen bóng',
              stockQuantity: 20,
              imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80'
            }
          ]
        },
        {
          id: 5,
          name: 'Tròng Đổi Màu Thông Minh Essilor Transitions Gen 8',
          categoryName: 'Tròng Kính',
          brandName: 'Essilor Pháp',
          productType: 'LENS',
          tag: 'Đổi Màu Khói Siêu Nhanh',
          description: 'Công nghệ đổi màu theo cường độ tia UV, trong suốt trong nhà và đổi râm ngoài trời tức thì.',
          variants: [
            {
              id: 9,
              name: 'Cặp Tròng Essilor Transitions Classic 1.56',
              sku: 'LNS-ESSI-GEN8',
              price: 3380000,
              lensIndex: '1.56',
              stockQuantity: 30,
              imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80'
            }
          ]
        },
        {
          id: 6,
          name: 'Gọng Kính Nửa Viền Browline Clubmaster Retro',
          categoryName: 'Gọng Kính',
          brandName: 'Clubmaster',
          productType: 'FRAME',
          tag: 'Cổ Điển Tri Thức',
          description: 'Thiết kế browline cổ điển thanh lịch, phù hợp môi trường công sở và học thuật.',
          variants: [
            {
              id: 11,
              name: 'Gọng Browline Clubmaster Đồi Mồi Vàng',
              sku: 'FRM-CLUB-TRT',
              price: 1650000,
              color: 'Đồi mồi',
              material: 'Hợp kim & Acetate',
              stockQuantity: 25,
              imageUrl: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=80'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, variant) => {
    const existingIndex = cart.findIndex(item => item.sku === (variant?.sku || product.id));
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          sku: variant?.sku || `SKU-${product.id}`,
          name: product.name,
          price: variant?.price || 0,
          quantity: 1,
          image: variant?.imageUrl || 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'
        }
      ]);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = (sku, delta) => {
    setCart(cart.map(item => {
      if (item.sku === sku) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (sku) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter & Search
  let filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.brandName && p.brandName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  if (sortBy === 'PRICE_ASC') {
    filteredProducts.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0));
  } else if (sortBy === 'PRICE_DESC') {
    filteredProducts.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0));
  }

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#086288] text-white text-xs py-2 px-4 border-b border-[#4D8DBA]/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFEFC4] text-[#086288] px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide">
              Ưu đãi tháng
            </span>
            <span className="text-[#97D7FF]">
              Đo thị lực khúc xạ nhãn khoa miễn phí 100% tại hệ thống cửa hàng GlassStore
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-200">
            <span className="flex items-center gap-1 hover:text-white cursor-pointer">
              <Phone className="w-3.5 h-3.5 text-[#97D7FF]" /> Hotline: 1800 6868 (Miễn phí)
            </span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FFEFC4]" /> Hệ thống 12 cửa hàng
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedType('ALL')}>
            <div className="bg-[#086288] text-white p-2.5 rounded-xl shadow-md shadow-[#086288]/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-[#97D7FF]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-[#086288]">
                  Glass<span className="text-[#4D8DBA]">Store</span>
                </span>
                <span className="bg-[#FFEFC4] text-[#086288] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#086288]/20">
                  RETAIL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Chuỗi Kính Mắt Nhãn Khoa Cao Cấp
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-lg mx-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4" />
            <input
              type="text"
              placeholder="Tìm gọng kính Titan, tròng Chemi, tròng Essilor, Ray-Ban..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-100/80 text-sm pl-11 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-[#086288] focus:bg-white focus:ring-2 focus:ring-[#97D7FF] transition-all outline-none"
            />
          </div>

          {/* Header Action: Cart Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 bg-[#086288] hover:bg-[#4D8DBA] text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#086288]/20 active:scale-95"
            >
              <ShoppingBag className="w-5 h-5 text-[#97D7FF]" />
              <span className="hidden sm:inline font-semibold text-sm">Giỏ hàng</span>
              <span className="bg-[#FFEFC4] text-[#086288] font-bold text-xs px-2 py-0.5 rounded-full shadow-sm">
                {cartItemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Banner (Designed with official palette: #086288, #4D8DBA, #97D7FF, #FFEFC4) */}
      <div className="bg-gradient-to-r from-[#086288] via-[#0d719c] to-[#4D8DBA] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-inner">
        {/* Decorative soft circles */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#97D7FF]/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#FFEFC4]/15 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFEFC4] text-[#086288] shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-[#086288]" /> Hệ Thống Bán Lẻ & Đo Mắt Chuẩn Nhãn Khoa
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Khám Phá Bộ Sưu Tập <br />
              <span className="text-[#97D7FF]">Kính Mắt Chính Hãng</span>
            </h1>
            <p className="text-slate-100 text-sm sm:text-base leading-relaxed mb-6 font-medium">
              Gọng Titanium siêu nhẹ chống ăn mòn, tròng lọc ánh sáng xanh Chemi Hàn Quốc, tròng đổi màu Essilor Gen 8 Pháp. Đo khúc xạ miễn phí chuẩn xác từng độ cận.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#products-section"
                className="bg-[#FFEFC4] hover:bg-white text-[#086288] px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all inline-flex items-center gap-2"
              >
                Xem Sản Phẩm Ngay <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => alert('Vui lòng gọi hotline 1800 6868 hoặc ghé trực tiếp chi nhánh gần nhất để được đo khúc xạ miễn phí!')}
                className="bg-[#086288]/40 hover:bg-[#086288]/60 border border-[#97D7FF] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all"
              >
                Đặt Lịch Đo Mắt Tại Cửa Hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trust Badges Strip */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <ShieldCheck className="w-5 h-5 text-[#086288]" />
            <span>100% Chính Hãng (Bảo hành 12T)</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <Eye className="w-5 h-5 text-[#4D8DBA]" />
            <span>Đo Khúc Xạ Máy Điện Tử Miễn Phí</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <Clock className="w-5 h-5 text-[#086288]" />
            <span>Mài Lắp Lấy Ngay Trong 20 Phút</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <Award className="w-5 h-5 text-[#4D8DBA]" />
            <span>Đổi Trả 7 Ngày Nếu Không Êm Mắt</span>
          </div>
        </div>
      </div>

      {/* 5. Products Section */}
      <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Category Filters Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {[
              { label: 'Tất cả sản phẩm', value: 'ALL' },
              { label: 'Gọng Kính', value: 'FRAME' },
              { label: 'Tròng Kính Thuốc', value: 'LENS' },
              { label: 'Kính Râm Thời Trang', value: 'SUNGLASSES' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedType(tab.value)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  selectedType === tab.value
                    ? 'bg-[#086288] text-white shadow-md shadow-[#086288]/25 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-[#4D8DBA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort & Counter */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs text-slate-500">
              Có <strong className="text-[#086288] font-bold">{filteredProducts.length}</strong> sản phẩm
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-[#086288]"
            >
              <option value="DEFAULT">Sắp xếp: Mặc định</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#086288] border-t-transparent mb-3" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh mục kính mắt...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
            {filteredProducts.map((product) => {
              const primaryVariant = product.variants?.[0] || {};
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#4D8DBA] transition-all duration-300 group flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100 flex items-center justify-center">
                    <img
                      src={primaryVariant.imageUrl || 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80'}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Brand Pill */}
                    {product.brandName && (
                      <span className="absolute top-3 left-3 bg-[#FFEFC4] text-[#086288] border border-[#086288]/20 text-xs px-3 py-1 rounded-full font-extrabold shadow-sm">
                        {product.brandName}
                      </span>
                    )}

                    {/* Feature Tag */}
                    {product.tag && (
                      <span className="absolute top-3 right-3 bg-[#086288]/90 text-[#97D7FF] text-[11px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm">
                        {product.tag}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-[#4D8DBA] font-extrabold">
                          {product.categoryName || product.productType}
                        </span>
                        {primaryVariant.material && (
                          <span className="text-[11px] text-slate-400">
                            • {primaryVariant.material}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base group-hover:text-[#086288] transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Giá niêm yết
                        </span>
                        <span className="text-xl font-black text-[#086288]">
                          {formatPrice(primaryVariant.price || 0)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product, primaryVariant)}
                        className="bg-[#086288] hover:bg-[#4D8DBA] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#97D7FF]" />
                        <span>Thêm Giỏ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Slide-Over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#086288]" />
                  <h2 className="text-lg font-bold text-[#086288]">
                    Giỏ Hàng Của Bạn ({cartItemCount})
                  </h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Items List */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300" />
                    <p className="text-sm">Giỏ hàng của bạn đang trống</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.sku} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.sku)}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] font-semibold text-[#086288]">
                            {formatPrice(item.price)}
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-slate-300 rounded-md bg-white">
                            <button
                              onClick={() => updateCartQty(item.sku, -1)}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded-l"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.sku, 1)}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded-r"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tạm tính tiền hàng:</span>
                      <span className="font-semibold text-slate-800">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Ưu đãi vận chuyển:</span>
                      <span className="font-semibold text-emerald-600">Miễn phí</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">Tổng cộng:</span>
                      <span className="text-xl font-black text-[#086288]">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Đã gửi đơn hàng thành công! Tổng thanh toán: ${formatPrice(cartTotal)}. Cảm ơn bạn đã mua hàng tại GlassStore!`);
                      setCart([]);
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-[#086288] hover:bg-[#4D8DBA] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-[#086288]/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <span>Tiến Hành Đặt Hàng</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-[#086288] text-white p-1.5 rounded-lg">
                <Eye className="w-5 h-5 text-[#97D7FF]" />
              </div>
              <span className="text-lg font-black text-white">GlassStore</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Hệ thống bán lẻ kính mắt đa kênh & trung tâm đo khúc xạ chuẩn y khoa. Đối tác phân phối chính thức của Bolon, Gentle Monster, Chemi Lens, Essilor.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Danh Mục Kính</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="hover:text-white cursor-pointer">Gọng Kính Titanium Siêu Nhẹ</li>
              <li className="hover:text-white cursor-pointer">Tròng Cận Chống Ánh Sáng Xanh</li>
              <li className="hover:text-white cursor-pointer">Tròng Kính Đổi Màu Transitions</li>
              <li className="hover:text-white cursor-pointer">Kính Râm Phân Cực Polarized</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Dịch Vụ & Bảo Hành</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="hover:text-white cursor-pointer">Quy trình đo khúc xạ 12 bước</li>
              <li className="hover:text-white cursor-pointer">Chính sách bảo hành 1 đổi 1 trong 1 năm</li>
              <li className="hover:text-white cursor-pointer">Căn chỉnh gọng, vệ sinh sóng siêu âm trọn đời</li>
              <li className="hover:text-white cursor-pointer">Tra cứu đơn hàng trực tuyến</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Chi Nhánh & Hỗ Trợ</h4>
            <p className="text-slate-400 mb-2">📍 Chi nhánh Quận 1: 123 Nguyễn Huệ, P. Bến Nghé, TP.HCM</p>
            <p className="text-slate-400 mb-2">📍 Chi nhánh Cầu Giấy: 45 Xuân Thủy, Q. Cầu Giấy, Hà Nội</p>
            <p className="text-slate-400">📞 Hotline tư vấn: 1800 6868 (8:00 - 21:30)</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© 2026 GlassStore - Dự Án OJT Nhóm 4. Hệ Thống Quản Lý Bán Lẻ Kính Mắt Đa Kênh Toàn Diện.</p>
        </div>
      </footer>
    </div>
  );
}
