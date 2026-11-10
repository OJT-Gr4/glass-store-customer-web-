import React, { useState } from 'react';
import { Eye, Bell, ShoppingBag, User, LogOut, ChevronDown, Phone, MapPin } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount, openAuthModal, openCart, currentUser, onLogout }) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'products', label: 'Sản Phẩm' },
    { id: 'booking', label: 'Đặt Lịch Đo Mắt' },
    { id: 'records', label: 'Hồ Sơ Thị Lực' },
    { id: 'orders', label: 'Đơn Hàng' },
    { id: 'warranty', label: 'Bảo Hành' },
  ];

  const moreNavItems = [
    { id: 'stores', label: 'Hệ Thống Cửa Hàng' },
    { id: 'vouchers', label: 'Kho Voucher & VIP' },
    { id: 'policy', label: 'Chính Sách Hậu Mãi' },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMoreMenuOpen(false);
  };

  const isMoreActive = moreNavItems.some(item => item.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e7eeff] shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      {/* Micro top header - Minimal, light, clean like internal portal */}
      <div className="bg-[#f0f3ff] border-b border-[#e7eeff] text-[#40484e] text-[11px] py-1 px-4 hidden md:block">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-[#004967]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#086288]"></span>
              Hệ thống phòng khám & khúc xạ y khoa OptiVision
            </span>
            <span className="text-slate-300">•</span>
            <span>Đo mắt 12 bước chuẩn quốc tế · Cắt kính lấy ngay trong 20 phút</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#004967] font-semibold">
              <Phone className="w-3 h-3 text-[#086288]" /> Hotline: 1900 6868
            </span>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => setActiveTab('stores')}
              className="hover:text-[#004967] transition cursor-pointer"
            >
              16+ Chi nhánh toàn quốc
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Exact match to Internal Portal */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[#086288] text-white flex items-center justify-center shadow-sm group-hover:bg-[#004967] transition">
            <Eye className="w-5 h-5 text-[#cae6ff]" />
          </div>
          <div>
            <span className="text-lg text-[#004967] font-bold block leading-tight">OptiVision</span>
            <span className="text-[10px] text-[#19648f] tracking-widest uppercase block font-bold">
              Clinical &amp; Eyewear
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation - Minimalist Pill Style */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#086288] text-white font-bold shadow-sm'
                    : 'text-[#40484e] hover:bg-[#dee8ff] hover:text-[#111c2d]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* "Thêm" Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isMoreActive
                  ? 'bg-[#086288] text-white font-bold shadow-sm'
                  : 'text-[#40484e] hover:bg-[#dee8ff] hover:text-[#111c2d]'
              }`}
            >
              <span>Dịch Vụ Khác</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreMenuOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-[#dee8ff] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setMoreMenuOpen(false)}
              >
                {moreNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      activeTab === item.id
                        ? 'text-[#004967] bg-[#e7eeff] font-bold'
                        : 'text-[#40484e] hover:bg-[#f0f3ff] hover:text-[#111c2d]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {activeTab === item.id && <span className="w-1.5 h-1.5 rounded-full bg-[#086288]"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications button */}
          <button 
            onClick={() => setActiveTab('notifications')}
            aria-label="Thông báo"
            className={`relative p-2 rounded-xl transition cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-[#e7eeff] text-[#004967]' 
                : 'text-[#40484e] hover:text-[#111c2d] hover:bg-[#f0f3ff]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#086288] rounded-full ring-2 ring-white"></span>
          </button>

          {/* Cart button */}
          <button
            onClick={openCart}
            aria-label="Giỏ hàng"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#086288]" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="bg-[#086288] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account or Login CTA */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-[#dee8ff]">
              <div 
                onClick={() => setActiveTab('orders')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#f0f3ff] transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#004967] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-3.5 h-3.5 text-[#cae6ff]" />
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-bold text-[#111c2d] max-w-[120px] truncate">
                    {currentUser.name || currentUser.fullName || 'Khách Hàng'}
                  </div>
                  <div className="text-[10px] text-[#086288] font-medium">Thành viên</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#cae6ff]" />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
