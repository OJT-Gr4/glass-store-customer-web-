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
import OrderDetailHubPage from './components/OrderDetailHubPage';
import OrderPaymentPage from './components/OrderPaymentPage';
import ReviewFeedbackPage from './components/ReviewFeedbackPage';
import StoreLocationsPage from './components/StoreLocationsPage';
import NotificationCenterPage from './components/NotificationCenterPage';
import VoucherLoyaltyPage from './components/VoucherLoyaltyPage';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import { clearCheckoutClaim } from './components/checkoutSession';
import { addSelection } from './components/purchaseUtils';
import { authApi } from './api/authApi';
import { useCustomerCart } from './components/useCustomerCart.js';
import { orderRoute } from './components/customerOrderUtils.js';
import { claimGuestCart } from './components/customerCartStore.js';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderCodeFromPath = /^\/orders\/([A-Za-z0-9_-]{1,120})\/?$/.exec(location.pathname)?.[1];

  const initialRoute = useRef(orderRoute(window.location.hash)).current;
  const [tab, setTab] = useState(initialRoute?.tab || 'home');
  const [selectedOrderId, setSelectedOrderId] = useState(initialRoute?.id || null);

  const activeTab = orderCodeFromPath ? 'order-payment' : location.pathname === '/orders' ? 'orders' : tab;

  const setActiveTab = nextTab => {
    if (nextTab === 'orders') {
      setTab('orders');
      navigate('/orders');
      window.location.hash = 'orders';
    } else if (nextTab === 'order-hub') {
      setTab('order-hub');
    } else {
      setTab(nextTab);
      navigate('/');
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
    window.scrollTo({ top: 0 });
  };

  const openOrder = (id, code, provider = 'VIETQR') => {
    setSelectedOrderId(id);
    if (provider === 'SEPAY' && code) {
      navigate(`/orders/${encodeURIComponent(code)}`);
    } else {
      setTab('order-hub');
      window.location.hash = `orders/${id}`;
      navigate('/');
    }
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const handleHash = () => {
      const route = orderRoute(window.location.hash);
      if (route) {
        setTab(route.tab);
        setSelectedOrderId(route.id);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const run = ++authGeneration.current;
    authApi.getMe()
      .then(user => { if (active && authGeneration.current === run) setCurrentUser(user); })
      .catch(() => { if (active && authGeneration.current === run) setCurrentUser(null); })
      .finally(() => { if (active && authGeneration.current === run) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutRequest = useRef(null);
  const activeCustomerId = useRef(null);
  activeCustomerId.current = currentUser?.id;
  const [cart, setCart, cartError] = useCustomerCart(currentUser?.id);
  const [cartNotice, setCartNotice] = useState('');

  useEffect(() => {
    checkoutRequest.current = null;
    setCheckoutOpen(false);
    setIsCartOpen(false);
  }, [currentUser?.id]);

  const handleLogout = () => {
    authGeneration.current++;
    activeCustomerId.current = null;
    authApi.logout();
    setCurrentUser(null);
    clearCheckoutClaim();
    setCheckoutOpen(false);
    checkoutRequest.current = null;
  };

  const handleAddToCart = selection => {
    if (!selection.items && !selection.productType) {
      handleViewDetail(selection);
      return;
    }
    try {
      setCart(previous => addSelection(previous, selection));
      setCartNotice('');
      setIsCartOpen(true);
    } catch (error) {
      setCartNotice(error.message);
    }
  };

  const handleViewDetail = product => {
    setSelectedProductDetail(product);
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateCartQty = (sku, delta) => {
    setCart(previous =>
      previous
        .map(item => {
          if (item.sku === sku) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = sku => {
    setCart(previous => previous.filter(item => item.sku !== sku));
  };

  const handleCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }
    setIsCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] font-sans flex flex-col justify-between selection:bg-[#e7eeff] selection:text-[#004967]">
      {/* 1. Header Navigation Bar */}
      <Navbar
        activeTab={activeTab === 'order-payment' ? 'orders' : activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        openAuthModal={() => setIsAuthOpen(true)}
        openCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Screens */}
      <main className="flex-1 w-full">
        {(cartError || cartNotice) && (
          <p role="alert" className="purchase-page purchase-error">
            {cartNotice || cartError}
          </p>
        )}

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
            currentUser={currentUser}
          />
        )}

        {/* Screen 7: Gửi Yêu Cầu Bảo Hành & Đổi Trả Kính 4 Bước */}
        {activeTab === 'claim-warranty' && (
          <ClaimWarrantyPage
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            openAuth={() => setIsAuthOpen(true)}
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
            currentUser={currentUser}
            authLoading={authLoading}
            openAuth={() => setIsAuthOpen(true)}
            onOpenOrder={openOrder}
          />
        )}

        {/* Screen 10A: Cổng Thanh Toán & Biên Lai SePay */}
        {activeTab === 'order-payment' && orderCodeFromPath && (
          <OrderPaymentPage
            key={orderCodeFromPath}
            orderCode={orderCodeFromPath}
            currentUser={currentUser}
            authLoading={authLoading}
            openAuth={() => setIsAuthOpen(true)}
            onOrders={() => setActiveTab('orders')}
            onContinue={() => setActiveTab('products')}
          />
        )}

        {/* Screen 10B: Chi Tiết Đơn Hàng, Đổi Trả & Sandbox VietQR QR */}
        {activeTab === 'order-hub' && (
          <OrderDetailHubPage
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            openAuth={() => setIsAuthOpen(true)}
            orderId={selectedOrderId}
          />
        )}

        {/* Screen 11: Đánh Giá Trải Nghiệm Mắt Kính & Dịch Vụ Khúc Xạ */}
        {activeTab === 'review' && (
          <ReviewFeedbackPage
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            orderId={selectedOrderId}
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
            currentUser={currentUser}
          />
        )}

        {/* Screen 14: Kho Voucher & Trung Tâm Điểm Thưởng OptiVIP */}
        {activeTab === 'vouchers' && (
          <VoucherLoyaltyPage
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {checkoutOpen && currentUser && (
        <CheckoutModal
          key={currentUser.id}
          cart={cart}
          user={currentUser}
          requestRef={checkoutRequest}
          onClose={() => {
            setCheckoutOpen(false);
            setIsCartOpen(true);
          }}
          onSuccess={order => {
            if (Number(order.customerId) !== Number(currentUser.id)) {
              throw new Error('Không xác minh được chủ đơn hàng. Giỏ hàng được giữ nguyên.');
            }
            clearCheckoutClaim();
            setCart([]);
            if (activeCustomerId.current !== currentUser.id) return;
            checkoutRequest.current = null;
            setCheckoutOpen(false);
            if (order.paymentProvider === 'SEPAY' || order.paymentMethod === 'SEPAY' || !order.id) {
              navigate(`/orders/${encodeURIComponent(order.orderCode)}`);
            } else {
              openOrder(order.id, order.orderCode, 'VIETQR');
            }
            window.scrollTo({ top: 0 });
          }}
        />
      )}

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
        onLoginSuccess={user => {
          authGeneration.current++;
          activeCustomerId.current = user.id;
          if (!currentUser?.id) setCartNotice(claimGuestCart(user.id, addSelection));
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
