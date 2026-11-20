import React, { useState } from 'react';
import { Bell, ShoppingBag, UserRound, Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount, unreadCount = 0, openAuthModal, openCart, openProfileModal, currentUser, onLogout }) {
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const links = [
    ['home', 'Trang chủ'], ['products', 'Sản phẩm'], ['booking', 'Đo mắt'],
    ['stores', 'Cửa hàng'], ['records', 'Hồ sơ thị lực'], ['orders', 'Đơn hàng'],
    ['warranty', 'Bảo hành'], ['vouchers', 'Ưu đãi'], ['policy', 'Chính sách'],
  ];
  const go = id => { setActiveTab(id); setMenu(false); setAccount(false); };
  return <header className="store-header">
    <div className="store-announcement">CHĂM SÓC ÁNH NHÌN, ĐỊNH HÌNH PHONG CÁCH <span>—</span> GLASSSTORE</div>
    <div className="store-nav">
      <button className="store-mobile-toggle" aria-label={menu ? 'Đóng menu' : 'Mở menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      <button className="store-logo" onClick={() => go('home')} aria-label="GlassStore - Trang chủ">glass<span>store</span><i>.</i></button>
      <nav className={menu ? 'store-nav-links is-open' : 'store-nav-links'} aria-label="Điều hướng chính">
        {links.map(([id, label]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => go(id)}>{label}</button>)}
      </nav>
      <div className="store-nav-actions">
        <button aria-label="Thông báo" data-testid="customer-notification-bell" onClick={() => go('notifications')}><Bell size={19} />{currentUser && unreadCount > 0 && <span className="store-count" data-testid="customer-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
        <button aria-label="Giỏ hàng" onClick={openCart}><ShoppingBag size={19} />{cartCount > 0 && <span className="store-count">{cartCount}</span>}</button>
        <div className="store-account">
          <button aria-label={currentUser ? 'Tài khoản' : 'Đăng nhập'} aria-expanded={currentUser ? account : undefined} onClick={() => currentUser ? setAccount(!account) : openAuthModal()}><UserRound size={19} /><span className="store-account-label">{currentUser ? (currentUser.name || currentUser.fullName || 'Tài khoản') : 'Đăng nhập'}</span>{currentUser && <ChevronDown size={14} />}</button>
          {currentUser && account && <div className="store-account-menu"><button onClick={() => { setAccount(false); openProfileModal(); }}>Thông tin cá nhân</button><button onClick={() => go('orders')}>Đơn hàng của bạn</button><button onClick={() => go('records')}>Hồ sơ thị lực</button><button onClick={() => { setAccount(false); onLogout(); }}>Đăng xuất</button></div>}
        </div>
      </div>
    </div>
  </header>;
}
