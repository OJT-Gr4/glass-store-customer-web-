import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductCatalogPage from './components/ProductCatalogPage';
import ProductDetailPage from './components/ProductDetailPage';
import OptometryBookingPage from './components/OptometryBookingPage';
import VisionRecordPage from './components/VisionRecordPage';
import WarrantyCenterPage from './components/WarrantyCenterPage';
import OrdersPage from './components/OrdersPage';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'products' | 'product-detail' | 'booking' | 'records' | 'warranty' | 'orders'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    name: 'Trần Hoàng Nam',
    tier: 'VIP Silver',
    code: '#VIP-59240',
    points: 450
  });

  // Cart state
  const [cart, setCart] = useState([
    {
      id: 1,
      sku: 'OPTI-TITAN-08',
      name: 'Aurea Minimalist Pure Titanium',
      price: 2450000,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  const handleAddToCart = (product) => {
    const existingIndex = cart.findIndex((item) => item.sku === product.sku);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id || Date.now(),
          sku: product.sku || `SKU-${Date.now()}`,
          name: product.name,
          price: product.price || 0,
          quantity: 1,
          image: product.image || 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500',
        },
      ]);
    }
    setIsCartOpen(true);
  };

  const handleViewDetail = (product) => {
    setSelectedProductDetail(product);
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateCartQty = (sku, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.sku === sku) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (sku) => {
    setCart(cart.filter((item) => item.sku !== sku));
  };

  const handleCheckout = () => {
    alert('Đơn hàng kính mắt của bạn đã được tiếp nhận thành công! Chuyên viên OptiVision sẽ liên hệ xác nhận thông số mài lắp qua SĐT.');
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-[#074768] selection:text-white">
      {/* 1. Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        openAuthModal={() => setIsAuthOpen(true)}
        openCart={() => setIsCartOpen(true)}
      />

      {/* 2. Main Content Screens */}
      <main className="flex-1 w-full">
        {/* Screen 1: Trang Chủ */}
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={setActiveTab}
            openBooking={() => setActiveTab('booking')}
            openAuth={() => setIsAuthOpen(true)}
            onAddToCart={handleAddToCart}
            onViewDetail={handleViewDetail}
          />
        )}

        {/* Screen 2: Danh Mục Sản Phẩm */}
        {activeTab === 'products' && (
          <ProductCatalogPage
            setActiveTab={setActiveTab}
            onAddToCart={handleAddToCart}
            onViewDetail={handleViewDetail}
          />
        )}

        {/* Screen 3: Chi Tiết Sản Phẩm & Cấu Hình Lắp Tròng Y Khoa (Ảnh 4 & 5 mới) */}
        {activeTab === 'product-detail' && (
          <ProductDetailPage
            product={selectedProductDetail}
            onAddToCart={handleAddToCart}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 4: Đặt Lịch Đo Mắt (Ảnh 4 trước) */}
        {activeTab === 'booking' && (
          <OptometryBookingPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 5: Hồ Sơ Thị Lực Điện Tử & Toa Kính Lâm Sàng (Ảnh 1 mới) */}
        {activeTab === 'records' && (
          <VisionRecordPage
            setActiveTab={setActiveTab}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Screen 6: Trung Tâm Bảo Hành & Hậu Mãi Khúc Xạ (Ảnh 2 & 3) */}
        {activeTab === 'warranty' && (
          <WarrantyCenterPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 7: Quản Lý Đơn Hàng & Tiến Trình Gia Công */}
        {activeTab === 'orders' && (
          <OrdersPage
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* 3. Footer Chuẩn Nhãn Khoa */}
      <Footer />

      {/* 4. Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQty={updateCartQty}
        removeFromCart={removeFromCart}
        checkout={handleCheckout}
      />

      {/* 5. Modal Đăng Nhập / Đăng Ký (Ảnh 1 trước) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
