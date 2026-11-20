import React from 'react';

export default function Footer({ setActiveTab }) {
  return <footer className="store-footer">
    <div className="store-footer-main">
      <div><div className="store-footer-logo">glass<span>store</span><i>.</i></div><p>Một góc nhìn rõ ràng hơn.<br />Một phong cách rất riêng.</p></div>
      <div><h2>KHÁM PHÁ</h2><button onClick={() => setActiveTab('products')}>Sản phẩm</button><button onClick={() => setActiveTab('booking')}>Đặt lịch đo mắt</button><button onClick={() => setActiveTab('stores')}>Cửa hàng</button></div>
      <div><h2>HỖ TRỢ</h2><button onClick={() => setActiveTab('orders')}>Đơn hàng</button><button onClick={() => setActiveTab('warranty')}>Bảo hành</button><button onClick={() => setActiveTab('policy')}>Chính sách</button></div>
      <div><h2>GLASSSTORE</h2><p>Đồng hành cùng bạn trên hành trình chăm sóc thị lực và tìm kiếm phong cách riêng.</p></div>
    </div>
    <div className="store-footer-bottom"><span>© {new Date().getFullYear()} GLASSSTORE</span><span>MADE FOR THE WAY YOU SEE.</span></div>
  </footer>;
}
