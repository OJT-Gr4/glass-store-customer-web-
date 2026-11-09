import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, RotateCw, AlertCircle, ShoppingBag, Eye, Check } from 'lucide-react';
import { productApi } from '../api/productApi';
import { catalogVariants, money } from './purchaseUtils';
import './purchase.css';

export default function ProductCatalogPage({ onAddToCart, onViewDetail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    productApi.getAllProducts({ status: 'ACTIVE' })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Dữ liệu sản phẩm không hợp lệ.');
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setError('Không tải được danh mục sản phẩm từ máy chủ. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retry]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi-VN');
    return products.filter(p => p.status === 'ACTIVE' && (type === 'ALL' || p.productType === type)
      && (!keyword || [p.name, p.brandName, ...(p.variants || []).map(v => v.sku)].some(value => String(value || '').toLocaleLowerCase('vi-VN').includes(keyword))));
  }, [products, query, type]);

  const categoryOptions = [
    ['ALL', 'Tất cả sản phẩm'],
    ['FRAME', 'Gọng kính'],
    ['LENS', 'Tròng kính kỹ thuật số'],
    ['SUNGLASSES', 'Kính mát'],
    ['ACCESSORY', 'Phụ kiện quang học']
  ];

  return (
    <main className="purchase-page space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Danh Mục Sản Phẩm
          </h1>
          <p className="purchase-muted mt-1">
            Gọng kính chính hãng, tròng kính chuẩn y khoa và phụ kiện chuyên dụng OptiVision.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
          Hiển thị: <strong className="text-[#086288]">{filtered.length}</strong> sản phẩm
        </div>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="purchase-toolbar bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            aria-label="Tìm sản phẩm"
            placeholder="Tìm theo tên kính, thương hiệu (Ray-Ban, Bolon...) hoặc SKU..."
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="pl-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#086288] hidden sm:block shrink-0" />
          <select
            aria-label="Loại sản phẩm"
            value={type}
            onChange={event => setType(event.target.value)}
            className="text-xs sm:text-sm"
          >
            {categoryOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div role="status" className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#086288] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Đang tải danh mục sản phẩm…</p>
        </div>
      ) : error ? (
        <div role="alert" className="purchase-error bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setRetry(value => value + 1)}
            className="text-xs font-bold bg-white text-red-700 border border-red-300 hover:bg-red-100/50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
          >
            <RotateCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy sản phẩm phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vui lòng thử tìm với từ khóa khác hoặc chuyển bộ lọc sang "Tất cả sản phẩm".
          </p>
          <button
            onClick={() => { setQuery(''); setType('ALL'); }}
            className="mt-2 text-xs font-bold text-[#086288] bg-[#f0f9ff] px-4 py-2 rounded-xl border border-[#97D7FF]"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="purchase-grid">
          {filtered.map(p => {
            const variants = catalogVariants([p]);
            const variant = variants.find(v => v.stock > 0) || variants[0];
            if (!variant) return null;
            const isOutOfStock = variant.stock <= 0;

            return (
              <article 
                className="purchase-product group hover:border-[#086288] transition-all duration-200" 
                key={p.id}
              >
                {/* Product Image Area */}
                <div className="relative h-48 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                  {variant.imageUrl ? (
                    <img 
                      src={variant.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/80 gap-1">
                      <Eye className="w-8 h-8 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400">OptiVision</span>
                    </div>
                  )}

                  {/* Brand Tag (Admin Warm Cream Tag) */}
                  <span className="absolute top-3 left-3 bg-[#FFEFC4] text-[#086288] text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#f5dfa2] shadow-xs">
                    {p.brandName || 'OptiVision'}
                  </span>

                  {isOutOfStock && (
                    <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      Hết hàng
                    </span>
                  )}
                </div>

                {/* Info & Action */}
                <div className="purchase-product-info p-4 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4D8DBA] block">
                      {p.productType === 'FRAME' ? 'Gọng Kính' : p.productType === 'LENS' ? 'Tròng Kính' : p.productType === 'SUNGLASSES' ? 'Kính Mát' : 'Phụ Kiện'}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 min-h-[40px] group-hover:text-[#086288] transition">
                      {p.name}
                    </h2>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Giá từ:</span>
                      <strong className="text-base font-extrabold text-[#086288]">
                        {money(Math.min(...variants.map(v => v.price)))}
                      </strong>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <button 
                        onClick={() => onViewDetail(p)}
                        className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#f0f9ff] text-[#086288] hover:border-[#97D7FF] transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem &amp; chọn kính
                      </button>

                      {!['FRAME', 'LENS'].includes(p.productType) && (
                        <button 
                          disabled={isOutOfStock} 
                          className="purchase-primary w-full text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5" 
                          onClick={() => { 
                            try { 
                              onAddToCart(variant); 
                            } catch (err) { 
                              setError(err.message); 
                            } 
                          }}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Thêm vào giỏ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
