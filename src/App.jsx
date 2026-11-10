import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductCatalogPage from './components/ProductCatalogPage';
import ProductDetailPage from './components/ProductDetailPage';
import OptometryBookingPage from './components/OptometryBookingPage';
import VisionRecordPage from './components/VisionRecordPage';
import WarrantyCenterPage from './components/WarrantyCenterPage';
import ClaimWarrantyPage from './components/ClaimWarrantyPage';
import PolicyPage from './components/PolicyPage';
import OrdersPage from './components/OrdersPage';
import ReviewFeedbackPage from './components/ReviewFeedbackPage';
import StoreLocationsPage from './components/StoreLocationsPage';
import NotificationCenterPage from './components/NotificationCenterPage';
import VoucherLoyaltyPage from './components/VoucherLoyaltyPage';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderPaymentPage from './components/OrderPaymentPage';
import { clearCheckoutClaim, readCart, saveCart } from './components/checkoutSession';
import { addSelection } from './components/purchaseUtils';
import { authApi } from './api/authApi';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderCode = /^\/orders\/([A-Za-z0-9_-]{1,120})\/?$/.exec(location.pathname)?.[1];
  const [tab, setTab] = useState('home');
  const activeTab = orderCode ? 'order-hub' : location.pathname === '/orders' ? 'orders' : tab;
  const setActiveTab = nextTab => {
    const target = nextTab === 'order-hub' ? 'orders' : nextTab;
    setTab(target);
    navigate(target === 'orders' ? '/orders' : '/');
    window.scrollTo({ top: 0 });
  };
  const openOrder = code => {
    navigate(`/orders/${encodeURIComponent(code)}`);
    window.scrollTo({ top: 0 });
  };
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    let active = true;
    authApi.getMe().then(user => { if (active) setCurrentUser(user); })
      .catch(() => { if (active) setCurrentUser(null); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutRequest = useRef(null);

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setCart([]); checkoutRequest.current = null; clearCheckoutClaim(); setCheckoutOpen(false);
  };

  const [cart, setCart] = useState(readCart);
  useEffect(() => { saveCart(cart); }, [cart]);
  const handleAddToCart = selection => {
    if (!selection.items && !selection.productType) { handleViewDetail(selection); return; }
    setCart(addSelection(cart, selection));
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
    if (!currentUser) { setIsCartOpen(false); setIsAuthOpen(true); return; }
    setIsCartOpen(false);
    setCheckoutOpen(true);
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
        currentUser={currentUser}
        onLogout={handleLogout}
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

        {/* Screen 3: Chi Tiết Sản Phẩm & Cấu Hình Lắp Tròng Y Khoa */}
        {activeTab === 'product-detail' && (
          <ProductDetailPage
            product={selectedProductDetail}
            onAddToCart={handleAddToCart}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 4: Đặt Lịch Đo Mắt */}
        {activeTab === 'booking' && (
          <OptometryBookingPage
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            openAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Screen 5: Hồ Sơ Thị Lực Điện Tử & Toa Kính Lâm Sàng */}
        {activeTab === 'records' && (
          <VisionRecordPage
            setActiveTab={setActiveTab}
            onAddToCart={handleAddToCart}
            currentUser={currentUser}
            openAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* Screen 6: Trung Tâm Bảo Hành & Tra Cứu Hậu Mãi */}
        {activeTab === 'warranty' && (
          <WarrantyCenterPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 7: Gửi Yêu Cầu Bảo Hành & Đổi Trả Kính 4 Bước */}
        {activeTab === 'claim-warranty' && (
          <ClaimWarrantyPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 8: Chính Sách Bảo Hành & Quyền Lợi Hậu Mãi Toàn Diện */}
        {activeTab === 'policy' && (
          <PolicyPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 9: Danh Sách Đơn Hàng Của Khách Hàng */}
        {activeTab === 'orders' && (
          <OrdersPage
            setActiveTab={setActiveTab}
            currentUser={currentUser} authLoading={authLoading}
            openAuth={() => setIsAuthOpen(true)} onOpenOrder={openOrder}
          />
        )}

        {/* Stored order and payment status, including SePay return navigation. */}
        {activeTab === 'order-hub' && orderCode && (
            <OrderPaymentPage key={orderCode} orderCode={orderCode}
            currentUser={currentUser} authLoading={authLoading} openAuth={() => setIsAuthOpen(true)}
            onOrders={() => setActiveTab('orders')} onContinue={() => setActiveTab('products')} />
        )}

        {/* Screen 11: Đánh Giá Trải Nghiệm Mắt Kính & Dịch Vụ Khúc Xạ */}
        {activeTab === 'review' && (
          <ReviewFeedbackPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 12: Hệ Thống Cửa Hàng & Phòng Đo Khúc Xạ Chuẩn Y Khoa */}
        {activeTab === 'stores' && (
          <StoreLocationsPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 13: Trung Tâm Thông Báo & Cập Nhật Hệ Thống */}
        {activeTab === 'notifications' && (
          <NotificationCenterPage
            setActiveTab={setActiveTab}
          />
        )}

        {/* Screen 14: Kho Voucher & Trung Tâm Điểm Thưởng OptiVIP */}
        {activeTab === 'vouchers' && (
          <VoucherLoyaltyPage
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {checkoutOpen && <CheckoutModal cart={cart} user={currentUser} requestRef={checkoutRequest} onClose={() => { setCheckoutOpen(false); setIsCartOpen(true); }} onSuccess={order => {
        checkoutRequest.current = null; clearCheckoutClaim();
        setCheckoutOpen(false); setCart([]);
        navigate(`/orders/${encodeURIComponent(order.orderCode)}`, { state: { initiatePayment: true } });
        window.scrollTo({top:0});
      }} />}
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

      {/* 5. Modal Đăng Nhập / Đăng Ký */}
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
