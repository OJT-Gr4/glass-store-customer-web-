import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Sparkles, AlertCircle, ShieldCheck, Check, Info } from 'lucide-react';
import { productApi } from '../api/productApi';
import { catalogVariants, money, validatePrescription } from './purchaseUtils';
import './purchase.css';
import { DEFAULT_PRODUCT_IMAGE } from './imageUploadUtils';

const emptyRx = { odSph: '', odCyl: '0', odAxis: '0', odAdd: '0', osSph: '', osCyl: '0', osAxis: '0', osAdd: '0', pd: '', confirmed: false };

export default function ProductDetailPage({ product, onAddToCart, setActiveTab }) {
  const [record, setRecord] = useState(null);
  const [lenses, setLenses] = useState([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [lensSku, setLensSku] = useState('');
  const [mode, setMode] = useState('WITH_LENS');
  const [rx, setRx] = useState(emptyRx);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationError, setRecommendationError] = useState('');

  const id = product?.productId || product?.id;

  useEffect(() => {
    let active = true;
    if (!id) { 
      setLoading(false); 
      setError('Vui lòng chọn sản phẩm từ danh mục.'); 
      return; 
    }
    Promise.all([productApi.getProductById(id), productApi.getAllProducts({ productType: 'LENS', status: 'ACTIVE' })])
      .then(([p, list]) => {
        if (!active) return;
        const available = catalogVariants([p]);
        setRecord(p); 
        setLenses(catalogVariants(list));
        setSelectedSku((available.find(v => v.stock > 0) || available[0])?.sku || '');
      })
      .catch(() => { 
        if (active) setError('Không tải được chi tiết sản phẩm. Vui lòng quay lại danh mục và thử lại.'); 
      })
      .finally(() => { 
        if (active) setLoading(false); 
      });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true; 
    setRecommendation(null); 
    setRecommendationError('');
    if (rx.odSph === '' || rx.osSph === '') return;
    const timer = setTimeout(() => {
      productApi.getLensRecommendations(Number(rx.odSph), Number(rx.osSph))
        .then(data => { if (active) setRecommendation(data); })
        .catch(() => { if (active) setRecommendationError('Chưa tải được gợi ý. Bạn vẫn có thể chọn tròng từ danh mục.'); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [rx.odSph, rx.osSph]);

  const variants = useMemo(() => record ? catalogVariants([record]) : [], [record]);
  const selected = variants.find(v => v.sku === selectedSku);
  const lens = lenses.find(v => v.sku === lensSku);
  const withRx = record?.productType === 'LENS' || (record?.productType === 'FRAME' && mode === 'WITH_LENS');
  const withExtraLens = record?.productType === 'FRAME' && withRx;
  const sortedLenses = [...lenses].sort((a, b) => Number(recommendation?.variants?.some(v => v.sku === b.sku)) - Number(recommendation?.variants?.some(v => v.sku === a.sku)));

  const changeRx = (field, value) => setRx(previous => ({ ...previous, [field]: value, confirmed: false }));

  function add(event) {
    event.preventDefault(); 
    setError('');
    try {
      if (!selected || selected.stock <= 0) throw new Error('Biến thể đã hết hàng. Vui lòng chọn mẫu khác.');
      if (withExtraLens && (!lens || lens.stock <= 0)) throw new Error('Vui lòng chọn tròng kính còn hàng.');
      const prescription = withRx ? validatePrescription(rx) : null;
      onAddToCart({ items: [selected, ...(withExtraLens ? [lens] : [])], prescription });
    } catch (err) { 
      setError(err.message); 
    }
  }

  const totalPrice = (selected?.price || 0) + (withExtraLens ? lens?.price || 0 : 0);

  return (
    <main className="purchase-page space-y-6">
      {/* Back Button */}
      <div>
        <button 
          onClick={() => setActiveTab('products')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#086288] hover:text-[#064e6d] bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#086288]" />
          <span>Quay lại danh mục</span>
        </button>
      </div>

      {loading ? (
        <div role="status" className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#086288] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Đang tải thông tin sản phẩm…</p>
        </div>
      ) : !record ? (
        <div role="alert" className="purchase-error bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : (
        <div className="purchase-detail-grid">
          {/* Left Column: Product Visuals & Description */}
          <div className="purchase-card space-y-5">
            <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 p-4 flex items-center justify-center min-h-[300px]">
              <img 
                className="purchase-detail-image w-full max-h-[380px] object-contain rounded-xl" 
                src={selected?.imageUrl || DEFAULT_PRODUCT_IMAGE} 
                alt={record.name} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />

              <span className="absolute top-4 left-4 bg-[#f0f7ff]/95 backdrop-blur-xs text-[#004967] text-[11px] font-bold px-3 py-1 rounded-full border border-[#c7e0f7] shadow-xs">
                {record.brandName || 'OptiVision'}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mô tả sản phẩm</h3>
              <p className="purchase-muted text-xs sm:text-sm leading-relaxed text-slate-600">
                {record.description || 'Sản phẩm được gia công chính xác theo tiêu chuẩn khúc xạ y khoa quốc tế.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-[#086288] shrink-0" />
                  <span>100% Chính hãng</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Sparkles className="w-4 h-4 text-[#086288] shrink-0" />
                  <span>Bảo hành 180 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization & Prescription Form */}
          <form className="purchase-card space-y-6" onSubmit={add}>
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D8DBA]">
                {record.brandName || 'OptiVision Brand'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {record.name}
              </h1>
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#086288]">
                  {money(totalPrice)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Đã bao gồm VAT</span>
              </div>
            </div>

            {/* Variant & Frame Mode Options */}
            <div className="space-y-4">
              <label className="purchase-field mb-0">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">Chọn Biến Thể</span>
                <select
                  aria-label="Biến thể kính"
                  value={selectedSku}
                  onChange={event => setSelectedSku(event.target.value)}
                  className="mt-1 w-full max-w-full min-w-0 truncate"
                >
                  {variants.map(v => (
                    <option key={v.sku} value={v.sku} disabled={v.stock <= 0}>
                      {v.name} · {money(v.price)}{v.stock <= 0 ? ' (Hết hàng)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              {record.productType === 'FRAME' && (
                <label className="purchase-field mb-0">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">Cấu Hình Kính</span>
                  <select
                    aria-label="Cấu hình kính"
                    value={mode}
                    onChange={event => setMode(event.target.value)}
                    className="mt-1 w-full max-w-full min-w-0 truncate"
                  >
                    <option value="WITH_LENS">Lắp tròng kỹ thuật số theo toa (Khuyên dùng)</option>
                    <option value="FRAME_ONLY">Chỉ mua gọng kính</option>
                  </select>
                </label>
              )}
            </div>

            {/* Prescription (OD / OS) Configuration */}
            {withRx && (
              <div className="space-y-5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#086288]"></span>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                      Thông Số Thị Lực Khúc Xạ (Rx)
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#086288] bg-[#f0f9ff] px-2.5 py-0.5 rounded-full font-bold border border-[#97D7FF]/40">
                    OD: Mắt Phải · OS: Mắt Trái
                  </span>
                </div>

                {/* OD / OS Table with Medical Card Colors */}
                <div className="purchase-rx">
                  <table>
                    <thead>
                      <tr>
                        <th className="w-28">Mắt</th>
                        <th>Độ cầu (SPH)</th>
                        <th>Độ loạn (CYL)</th>
                        <th>Trục loạn (AXIS °)</th>
                        <th>Độ lão (ADD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[['od', 'Mắt Phải (OD)'], ['os', 'Mắt Trái (OS)']].map(([eye, label]) => (
                        <tr key={eye}>
                          <th className="font-bold text-xs">{label}</th>
                          {['Sph', 'Cyl', 'Axis', 'Add'].map(field => (
                            <td key={field}>
                              <input 
                                aria-label={`${eye.toUpperCase()} ${field.toUpperCase()}`} 
                                required 
                                type="number" 
                                step={field === 'Axis' ? '1' : '0.25'} 
                                min={field === 'Axis' || field === 'Add' ? '0' : '-99.75'} 
                                max={field === 'Axis' ? '180' : '99.75'} 
                                value={rx[eye + field]} 
                                onChange={event => changeRx(eye + field, event.target.value)} 
                                className="text-center font-bold"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pupil Distance (PD) */}
                <label className="purchase-field">
                  <span className="font-bold text-slate-800 text-xs">
                    Khoảng cách đồng tử PD (mm) <span className="text-red-500">*</span>
                  </span>
                  <input 
                    required 
                    aria-label="PD" 
                    type="number" 
                    min="0.1" 
                    max="100" 
                    step="0.1" 
                    value={rx.pd} 
                    onChange={event => changeRx('pd', event.target.value)} 
                    placeholder="Ví dụ: 62.5"
                    className="mt-1 font-bold"
                  />
                  <span className="text-[11px] text-slate-400 font-normal">
                    Khoảng cách thông thường từ 58mm đến 68mm.
                  </span>
                </label>

                {/* Extra Lens Selector */}
                {withExtraLens && (
                  <label className="purchase-field">
                    <span className="font-bold text-slate-800 text-xs">
                      Chọn Loại Tròng Kính Kỹ Thuật Số <span className="text-red-500">*</span>
                    </span>
                    <select 
                      required 
                      aria-label="Chọn tròng kính" 
                      value={lensSku} 
                      onChange={event => setLensSku(event.target.value)}
                      className="mt-1 w-full max-w-full min-w-0 truncate"
                    >
                      <option value="">-- Vui lòng chọn loại tròng --</option>
                      {sortedLenses.map(v => (
                        <option key={v.sku} value={v.sku} disabled={v.stock <= 0}>
                          {recommendation?.variants?.some(item => item.sku === v.sku) ? '⭐ Gợi ý · ' : ''}
                          {v.name} · {money(v.price)}{v.stock <= 0 ? ' (Hết hàng)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Lens Recommendation Callout */}
                {recommendation && (
                  <div className="p-3.5 bg-[#f0f9ff] border border-[#97D7FF] rounded-xl flex items-start gap-2.5 text-xs text-[#0369a1]">
                    <Sparkles className="w-4 h-4 text-[#086288] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Gợi ý lâm sàng:</strong> Chiết suất phù hợp {recommendation.indexes?.join(' / ')}. Bác sĩ khúc xạ OptiVision sẽ kiểm tra lại toa trước khi lệnh mài tự động được thực hiện.
                    </p>
                  </div>
                )}

                {recommendationError && (
                  <p className="purchase-muted text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    {recommendationError}
                  </p>
                )}

                {/* Confirmation Checkbox */}
                <label className="purchase-check p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
                  <input 
                    type="checkbox" 
                    required 
                    checked={rx.confirmed} 
                    onChange={event => setRx({ ...rx, confirmed: event.target.checked })} 
                    className="accent-[#086288] w-4 h-4"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Tôi xác nhận thông số thị lực đã nhập hoàn toàn chính xác với toa kính mình đang sử dụng.
                  </span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div role="alert" className="purchase-error bg-red-50 border border-red-200 p-3.5 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="purchase-actions pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tổng đơn kính</span>
                <strong className="text-xl font-black text-[#086288]">{money(totalPrice)}</strong>
              </div>

              <button 
                className="purchase-primary px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition active:scale-95" 
                type="submit" 
                disabled={!selected || selected.stock <= 0}
              >
                {!selected || selected.stock <= 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
