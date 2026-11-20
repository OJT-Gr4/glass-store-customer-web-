import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Eye, ShieldCheck } from 'lucide-react';
import { productApi } from '../api/productApi';
import { DEFAULT_PRODUCT_IMAGE } from './imageUploadUtils';

const price = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function HomePage({ setActiveTab, openBooking, onViewDetail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    productApi.getAllProducts({ status: 'ACTIVE' })
      .then(data => { if (active && Array.isArray(data)) setProducts(data.slice(0, 4)); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="store-home">
      <section className="store-hero">
        <div className="store-hero-copy">
          <p className="store-eyebrow"><span /> GLASSSTORE / EYEWEAR &amp; EYECARE</p>
          <h1>Nhìn rõ hơn.<br /><em>Sống thật riêng.</em></h1>
          <p className="store-hero-description">Một chiếc kính vừa vặn không chỉ giúp bạn nhìn rõ, mà còn là cách bạn thể hiện chính mình.</p>
          <div className="store-hero-actions">
            <button className="store-button store-button-dark" onClick={() => setActiveTab('products')}>Khám phá bộ sưu tập <ArrowRight size={17} /></button>
            <button className="store-text-link" onClick={openBooking}>Đặt lịch đo mắt <ArrowUpRight size={16} /></button>
          </div>
          <div className="store-hero-note"><span>01 / 03</span><span>ĐƯỢC CHỌN CHO BẠN</span></div>
        </div>
        <div className="store-hero-image">
          <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1600&q=85" alt="Kính mắt thời trang" />
          <div className="store-image-caption"><span>THE EVERYDAY EDIT</span><span>Phong cách trong từng ánh nhìn</span></div>
        </div>
      </section>

      <div className="store-benefits">
        <div><Eye size={20} /><span>Tư vấn phù hợp với bạn</span></div>
        <div><CalendarDays size={20} /><span>Đặt lịch đo mắt dễ dàng</span></div>
        <div><ShieldCheck size={20} /><span>Chăm sóc sau mua</span></div>
      </div>

      <section className="store-section">
        <div className="store-section-heading">
          <div><p className="store-eyebrow">THE COLLECTION</p><h2>Một góc nhìn mới</h2><p>Khám phá những thiết kế dành cho mọi khoảnh khắc.</p></div>
          <button className="store-text-link" onClick={() => setActiveTab('products')}>Xem tất cả sản phẩm <ArrowRight size={17} /></button>
        </div>
        {loading ? <p className="store-empty">Đang tải sản phẩm...</p> : products.length ? (
          <div className="store-product-grid">
            {products.map(product => {
              const variant = product.variants?.[0];
              const amount = Number(variant?.price ?? product.price ?? 0);
              return <button className="store-product" key={product.id} onClick={() => onViewDetail(product)}>
                <div className="store-product-image"><img src={variant?.imageUrl || product.imageUrl || product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} loading="lazy" /><span><ArrowUpRight size={19} /></span></div>
                <div className="store-product-meta"><span>{product.brandName || product.brand || 'GLASSSTORE'}</span><span>KHÁM PHÁ</span></div>
                <h3>{product.name}</h3><p>{amount > 0 ? price(amount) : 'Xem chi tiết'}</p>
              </button>;
            })}
          </div>
        ) : <div className="store-empty">Bộ sưu tập đang được cập nhật. <button onClick={() => setActiveTab('products')}>Xem danh mục sản phẩm <ArrowRight size={16} /></button></div>}
      </section>

      <section className="store-story">
        <div className="store-story-image"><img src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80" alt="Chọn kính phù hợp với phong cách của bạn" loading="lazy" /></div>
        <div className="store-story-copy"><p className="store-eyebrow">A BETTER WAY TO SEE</p><h2>Chăm chút cho<br /><em>từng ánh nhìn.</em></h2><p>Từ việc kiểm tra thị lực đến lựa chọn gọng kính, GlassStore đồng hành cùng bạn tìm ra sự thoải mái và phong cách phù hợp mỗi ngày.</p><button className="store-button store-button-light" onClick={openBooking}>Đặt lịch đo mắt <ArrowRight size={17} /></button></div>
      </section>

      <section className="store-visit">
        <div><p className="store-eyebrow">GẶP NHAU TẠI GLASSSTORE</p><h2>Đến thử, để thấy khác biệt.</h2><p>Khám phá bộ sưu tập và tìm chiếc kính phù hợp với bạn tại cửa hàng.</p></div>
        <button className="store-button store-button-outline" onClick={() => setActiveTab('stores')}>Tìm cửa hàng <ArrowUpRight size={17} /></button>
      </section>
    </div>
  );
}
