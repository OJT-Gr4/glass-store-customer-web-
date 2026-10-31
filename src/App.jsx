import React, { useEffect, useState } from 'react';
import { productApi } from './api/productApi';
import { ShoppingBag, Search, Eye, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [selectedType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'ALL' ? { productType: selectedType } : {};
      const data = await productApi.getAllProducts(params);
      setProducts(data || []);
    } catch (err) {
      console.warn('API Gateway chưa bật hoặc chưa có kết nối, hiển thị dữ liệu mẫu.');
      // Dữ liệu mẫu dự phòng hiển thị giao diện khi chưa bật backend
      setProducts([
        {
          id: 1,
          name: 'Gọng Kính Titanium Bolon Square',
          categoryName: 'Gọng Kính',
          brandName: 'Bolon',
          productType: 'FRAME',
          description: 'Gọng kính Titanium siêu nhẹ cao cấp, chống ăn mòn, thiết kế mắt vuông nam tính',
          variants: [
            {
              id: 1,
              name: 'Gọng Bolon Titanium - Đen Nhám',
              price: 3250000,
              color: 'Đen',
              material: 'Titanium',
              stockQuantity: 45,
              imageUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'
            }
          ]
        },
        {
          id: 2,
          name: 'Gọng Kính Nhựa Dẻo TR90 Gentle Monster South Side',
          categoryName: 'Gọng Kính',
          brandName: 'Gentle Monster',
          productType: 'FRAME',
          description: 'Chất liệu TR90 siêu bền uốn dẻo, dáng mắt tròn vintage phong cách Hàn Quốc',
          variants: [
            {
              id: 3,
              name: 'Gọng Gentle Monster TR90 - Đen Bóng',
              price: 1850000,
              color: 'Đen',
              material: 'Nhựa TR90',
              stockQuantity: 50,
              imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500'
            }
          ]
        },
        {
          id: 3,
          name: 'Tròng Kính Cận Chống Ánh Sáng Xanh Chemi U2 1.60',
          categoryName: 'Tròng Kính',
          brandName: 'Chemi',
          productType: 'LENS',
          description: 'Chiết suất 1.60 mỏng nhẹ, lớp phủ Crystal U2 chống trầy xước, ngăn ánh sáng xanh màn hình',
          variants: [
            {
              id: 6,
              name: 'Cặp Tròng Chemi U2 BlueCut 1.60',
              price: 650000,
              lensIndex: '1.60',
              stockQuantity: 100,
              imageUrl: 'https://images.unsplash.com/photo-1582142839970-2b9da988941f?w=500'
            }
          ]
        },
        {
          id: 4,
          name: 'Kính Râm Ray-Ban Classic Wayfarer Polarized',
          categoryName: 'Kính Râm',
          brandName: 'Ray-Ban',
          productType: 'SUNGLASSES',
          description: 'Kính râm gọng đen mắt xanh đen phân cực chống lóa kinh điển',
          variants: [
            {
              id: 8,
              name: 'Kính Râm Ray-Ban Wayfarer Polarized',
              price: 4950000,
              color: 'Đen bóng',
              stockQuantity: 20,
              imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.brandName && p.brandName.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 text-white p-2 rounded-xl shadow-md">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                GlassStore
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 uppercase tracking-widest border-l border-slate-300 pl-2">
                Omnichannel Eyewear
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Tìm kiếm gọng kính, tròng kính, thương hiệu..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-100 text-sm pl-9 pr-4 py-2 rounded-full border-none focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition-colors">
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">0</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Chuỗi bán lẻ kính mắt công nghệ mới
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Khám phá Bộ sưu tập Kính Mắt Cao Cấp
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base">
            Gọng Titanium siêu nhẹ, tròng chống ánh sáng xanh Chemi, đổi màu Essilor. Đo thị lực khúc xạ chuẩn xác tại hệ thống cửa hàng.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { label: 'Tất cả sản phẩm', value: 'ALL' },
              { label: 'Gọng Kính', value: 'FRAME' },
              { label: 'Tròng Kính Thuốc', value: 'LENS' },
              { label: 'Kính Râm Thời Trang', value: 'SUNGLASSES' },
              { label: 'Phụ Kiện', value: 'ACCESSORY' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedType(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedType === tab.value
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <span className="font-bold text-slate-800">{filteredProducts.length}</span> sản phẩm
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm text-slate-500 mt-2">Đang tải danh sách kính...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {filteredProducts.map((product) => {
              const primaryVariant = product.variants?.[0] || {};
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={primaryVariant.imageUrl || 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.brandName && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
                        {product.brandName}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary-600 font-bold">
                        {product.categoryName || product.productType}
                      </span>
                      <h3 className="font-semibold text-slate-800 text-base mt-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      {primaryVariant.material && (
                        <p className="text-xs text-slate-500 mt-1">
                          Chất liệu: {primaryVariant.material}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Giá niêm yết</div>
                        <div className="text-lg font-bold text-slate-900">
                          {formatPrice(primaryVariant.price || 0)}
                        </div>
                      </div>
                      <button className="bg-slate-900 hover:bg-primary-600 text-white p-2.5 rounded-xl transition-colors shadow-sm">
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-xs text-slate-500">
        <p>© 2026 GlassStore Omnichannel Eyewear Retail Management System. OJT Project Group 4.</p>
      </footer>
    </div>
  );
}
