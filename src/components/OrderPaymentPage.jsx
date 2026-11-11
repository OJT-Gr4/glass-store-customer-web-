import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Headphones,
  PackageCheck,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkoutApi } from '../api/checkoutApi';
import { money } from './purchaseUtils';
import { canPay, ORDER_LABELS, paymentState, submitCheckoutForm } from './paymentUtils';
import './purchase.css';

const STATES = {
  PAID: {
    title: 'Giao dịch thành công',
    subtitle: 'Khoản thanh toán đã được ngân hàng và SePay xác thực thành công.',
    badge: 'ĐÃ THANH TOÁN (SETTLED)',
    Icon: CheckCircle2,
    theme: 'paid',
  },
  PENDING: {
    title: 'Lệnh thanh toán đang chờ xử lý',
    subtitle: 'Vui lòng hoàn tất thanh toán qua SePay hoặc chuyển khoản ngân hàng.',
    badge: 'CHỜ THANH TOÁN (PENDING)',
    Icon: Clock3,
    theme: 'pending',
  },
  CANCELLED: {
    title: 'Giao dịch đã hủy',
    subtitle: 'Đơn hàng này không còn hiệu lực thanh toán.',
    badge: 'ĐÃ HỦY (CANCELLED)',
    Icon: XCircle,
    theme: 'cancelled',
  },
  REFUND_PENDING: {
    title: 'Đang chờ hoàn tiền',
    subtitle: 'Yêu cầu hoàn trả khoản thanh toán đang được xử lý.',
    badge: 'CHỜ HOÀN TIỀN (REFUNDING)',
    Icon: Clock3,
    theme: 'pending',
  },
  REFUNDED: {
    title: 'Đã hoàn tiền thành công',
    subtitle: 'Giao dịch hoàn tiền đã được ghi nhận về tài khoản.',
    badge: 'ĐÃ HOÀN TIỀN (REFUNDED)',
    Icon: CheckCircle2,
    theme: 'paid',
  },
  UNCONFIRMED: {
    title: 'Cần kiểm tra giao dịch',
    subtitle: 'Thông tin thanh toán đang chờ đối soát từ nhân viên quản trị.',
    badge: 'ĐANG ĐỐI SOÁT (AUDITING)',
    Icon: Clock3,
    theme: 'pending',
  },
};

function formatDateTime(val) {
  if (!val) return 'Vừa ghi nhận';
  try {
    const d = new Date(val);
    return isNaN(d.getTime())
      ? String(val)
      : d.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  } catch {
    return String(val);
  }
}

export default function OrderPaymentPage({ orderCode, currentUser, authLoading, openAuth, onOrders, onContinue }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paying, setPaying] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [pollingEnded, setPollingEnded] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const paymentLock = useRef(false);
  const paymentRequest = useRef(null);
  const refreshLock = useRef(false);
  const autoPayment = useRef(location.state?.initiatePayment === true);

  const searchParams = new URLSearchParams(location.search);
  const paymentOutcome = searchParams.get('payment');

  const copyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const load = useCallback(async (signal) => {
    let saved = await checkoutApi.getOrder(orderCode, signal);
    const history = await checkoutApi.paymentHistory(saved.id, signal);
    // When order is pending, paymentHistory triggers proactive server-to-server SePay PG API sync.
    // If SePay has captured the payment, history now returns SUCCESS; reload saved order to get updated PAID status.
    if (saved.status === 'PENDING_PAYMENT' && history.some((p) => p.status === 'SUCCESS')) {
      saved = await checkoutApi.getOrder(orderCode, signal);
    }
    if (!signal?.aborted) {
      setOrder(saved);
      setPayments(history);
      setLastChecked(new Date());
      setError('');
    }
    return { saved, history };
  }, [orderCode]);

  const handleSyncPayment = useCallback(async () => {
    if (!order?.id) return;
    setRefreshing(true);
    setError('');
    try {
      await checkoutApi.syncPayment(order.id);
      await load();
    } catch (err) {
      setError('Lỗi khi đồng bộ đối soát: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  }, [order?.id, load]);

  const refresh = useCallback(async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      refreshLock.current = false;
      setRefreshing(false);
    }
  }, [load]);

  const startPayment = useCallback(async (orderId) => {
    if (paymentLock.current) return;
    paymentLock.current = true;
    setPaying(true);
    setPaymentError('');
    const controller = new AbortController();
    paymentRequest.current = controller;
    try {
      const checkout = await checkoutApi.initiate(orderId, controller.signal, 'SEPAY');
      if (!controller.signal.aborted) submitCheckoutForm(checkout);
    } catch (err) {
      if (controller.signal.aborted) return;
      setPaymentError(
        err.code === 'PAYMENT_PROVIDER_NOT_CONFIGURED'
          ? 'Thanh toán trực tuyến tạm chưa khả dụng. Đơn đã được lưu; bạn có thể thử lại trên đơn này sau.'
          : `${err.message} Đơn đã được lưu, không cần tạo đơn mới.`
      );
    } finally {
      paymentLock.current = false;
      if (!controller.signal.aborted) setPaying(false);
    }
  }, []);

  useEffect(() => () => paymentRequest.current?.abort(), []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setOrder(null);
    setError('');
    load(controller.signal)
      .then(({ saved, history }) => {
        if (!controller.signal.aborted && autoPayment.current) {
          autoPayment.current = false;
          navigate(location.pathname, { replace: true, state: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authLoading, currentUser?.id, load, navigate, location.pathname, startPayment]);

  const phase = order ? paymentState(order, payments) : null;
  const isVietQr = Boolean(order && (order.notes?.includes('PAYMENT_PROVIDER:VIETQR') || (!order.notes?.includes('PAYMENT_PROVIDER:SEPAY') && order.paymentMethod === 'VIETQR')));

  useEffect(() => {
    if (order && isVietQr) {
      window.location.hash = `orders/${order.id}`;
      window.location.href = `/#orders/${order.id}`;
    }
  }, [order, isVietQr]);

  const handleSimulatePayment = useCallback(async () => {
    if (!order?.orderCode) return;
    setSimulating(true);
    setError('');
    try {
      const endpoint = isVietQr
        ? `/api/payments/sandbox/simulate-callback?orderCode=${encodeURIComponent(order.orderCode)}`
        : `/api/payments/sepay/simulate-ipn?orderCode=${encodeURIComponent(order.orderCode)}`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Không thể giả lập thanh toán.');
      }
      await load();
    } catch (err) {
      setError('Lỗi giả lập thanh toán: ' + err.message);
    } finally {
      setSimulating(false);
    }
  }, [order?.orderCode, isVietQr, load]);

  // Real-time polling while PENDING (every 3 seconds)
  useEffect(() => {
    if (!currentUser || phase !== 'PENDING' || order?.status !== 'PENDING_PAYMENT') return;
    const controller = new AbortController();
    const started = Date.now();
    setPollingEnded(false);
    const timer = setInterval(async () => {
      if (Date.now() - started >= 180000) {
        clearInterval(timer);
        setPollingEnded(true);
        return;
      }
      if (document.visibilityState !== 'visible' || refreshLock.current) return;
      refreshLock.current = true;
      try {
        await load(controller.signal);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        refreshLock.current = false;
      }
    }, 3000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [currentUser?.id, phase, order?.status, load]);

  if (authLoading || loading) {
    return (
      <section className="transaction-screen">
        <div className="transaction-loading-box">
          <RefreshCw size={28} className="spin text-sky-700" />
          <p>Đang tải thông tin giao dịch...</p>
        </div>
      </section>
    );
  }

  if (!currentUser) {
    return (
      <section className="transaction-screen">
        <div className="transaction-card">
          <div className="transaction-card-header">
            <h2>Xác thực tài khoản khách hàng</h2>
          </div>
          <p className="p-6 text-center text-slate-600">
            Vui lòng đăng nhập bằng tài khoản đặt hàng để xem biên lai giao dịch.
          </p>
          <div className="p-6 pt-0 text-center">
            <button className="txn-btn primary" onClick={openAuth}>Đăng nhập ngay</button>
          </div>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="transaction-screen">
        <div className="transaction-card">
          <div className="transaction-card-header text-center">
            <XCircle size={36} className="text-rose-600 mx-auto mb-2" />
            <h2>Không tìm thấy giao dịch</h2>
            <p className="text-slate-500 text-sm mt-1">{error || 'Mã đơn hàng không tồn tại hoặc đã hết hạn.'}</p>
          </div>
          <div className="p-6 text-center flex justify-center gap-3">
            <button className="txn-btn secondary" onClick={refresh} disabled={refreshing}>Thử lại</button>
            <button className="txn-btn primary" onClick={onOrders}>Danh sách đơn hàng</button>
          </div>
        </div>
      </section>
    );
  }

  const state = STATES[phase] || STATES.PENDING;
  const successPayment = payments.find((p) => p.status === 'SUCCESS');
  const txnId = successPayment?.externalTransactionId || successPayment?.providerOrderId || ('TXN-ORD-' + order.orderCode.replace(/^ORD-/, ''));
  const paidTime = successPayment?.paidAt || successPayment?.confirmedAt || successPayment?.updatedAt || order.updatedAt;

  return (
    <div className="payment-dashboard-container">
      {/* Top Header & Breadcrumbs */}
      <div className="dashboard-top-header">
        <div className="breadcrumbs">
          <span className="crumb-link" onClick={onContinue}>Trang chủ</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-link" onClick={onOrders}>Đơn hàng của bạn</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Thanh toán #{order.orderCode}</span>
        </div>

        <div className="dashboard-title-row">
          <div>
            <h1 className="dashboard-main-title">
              {phase === 'PAID' ? 'Biên Lai Giao Dịch Điện Tử' : 'Cổng Thanh Toán Trực Tuyến'}
            </h1>
            <p className="dashboard-subtitle">
              {phase === 'PAID'
                ? 'Giao dịch thanh toán đã hoàn tất thành công. Đơn hàng đang được chuẩn bị để gia công.'
                : 'Cảm ơn bạn đã đặt hàng! Vui lòng hoàn tất thanh toán để OptiVision tiến hành xử lý đơn hàng.'}
            </p>
          </div>
          <div className="dashboard-status-box">
            <span className={`status-pill-lg ${state.theme}`}>
              {state.badge}
            </span>
            <span className="dashboard-order-code">Mã đơn: <strong>{order.orderCode}</strong></span>
          </div>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="order-stepper-bar">
          <div className="step-item completed">
            <div className="step-circle"><Check size={14} /></div>
            <div className="step-info">
              <span className="step-name">1. Đặt hàng</span>
              <span className="step-sub">Thành công</span>
            </div>
          </div>
          <div className="step-line active" />
          <div className={`step-item ${phase === 'PAID' ? 'completed' : 'current'}`}>
            <div className="step-circle">
              {phase === 'PAID' ? <Check size={14} /> : <CreditCard size={14} />}
            </div>
            <div className="step-info">
              <span className="step-name">2. Thanh toán</span>
              <span className="step-sub">{phase === 'PAID' ? 'Đã xác nhận' : 'Chờ thanh toán'}</span>
            </div>
          </div>
          <div className={`step-line ${phase === 'PAID' ? 'active' : ''}`} />
          <div className="step-item upcoming">
            <div className="step-circle"><PackageCheck size={14} /></div>
            <div className="step-info">
              <span className="step-name">3. Gia công tròng</span>
              <span className="step-sub">Chuẩn bị kính</span>
            </div>
          </div>
          <div className="step-line" />
          <div className="step-item upcoming">
            <div className="step-circle"><Truck size={14} /></div>
            <div className="step-info">
              <span className="step-name">4. Nhận hàng</span>
              <span className="step-sub">Giao tận nơi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column: Payment & Gateway CTA */}
        <div className="dashboard-col dashboard-col-left">
          {/* Amount & Status Card */}
          <div className="dashboard-card payment-amount-card">
            <div className="amount-header-flex">
              <div className="amount-icon-box">
                {phase === 'PAID' ? (
                  <CheckCircle2 size={26} className="text-emerald-600" />
                ) : (
                  <Clock3 size={26} className="text-amber-600" />
                )}
              </div>
              <div className="amount-text-block">
                <span className="amount-label">
                  {phase === 'PAID' ? 'SỐ TIỀN ĐÃ THANH TOÁN' : 'SỐ TIỀN CẦN THANH TOÁN'}
                </span>
                <span className="amount-val">{money(order.finalAmount)}</span>
              </div>
            </div>
            <div className="gateway-indicator">
              <span>Phương thức: <strong>{isVietQr ? 'Chuyển khoản VietQR (Napas 24/7)' : 'Cổng Thanh Toán SePay (Napas 24/7)'}</strong></span>
            </div>
          </div>

          {/* SePay Payment Action Card */}
          {phase === 'PENDING' && (
            <div className="dashboard-card sepay-portal-card">
              <div className="sepay-portal-header">
                <div className="portal-badge-icon"><ExternalLink size={16} /></div>
                <div>
                  <h3 className="portal-title">Cổng Thanh Toán Trực Tuyến SePay Sandbox</h3>
                  <p className="portal-desc">Hỗ trợ quét mã QR qua ứng dụng của hơn 40 ngân hàng Napas 24/7.</p>
                </div>
              </div>

              {/* 3 Step Instruction */}
              <div className="sepay-steps-box">
                <div className="sepay-step-item">
                  <span className="step-num">1</span>
                  <span>Nhấn nút <strong>"Mở cổng thanh toán SePay ngay ↗"</strong> bên dưới.</span>
                </div>
                <div className="sepay-step-item">
                  <span className="step-num">2</span>
                  <span>Quét mã QR SePay bằng App ngân hàng bất kỳ để thanh toán.</span>
                </div>
                <div className="sepay-step-item">
                  <span className="step-num">3</span>
                  <span>Hệ thống tự động đồng bộ kết quả trong 3 giây (không cần gửi biên lai).</span>
                </div>
              </div>

              <div className="sepay-action-buttons">
                <button
                  type="button"
                  className="txn-btn primary btn-open-sepay"
                  disabled={paying || refreshing || Boolean(error)}
                  onClick={() => startPayment(order.id)}
                >
                  {paying ? 'Đang kết nối SePay…' : 'Mở cổng thanh toán SePay ngay ↗'}
                  <ExternalLink size={15} />
                </button>
                <button
                  type="button"
                  className="txn-btn secondary btn-simulate-sepay"
                  onClick={handleSimulatePayment}
                  disabled={simulating || refreshing}
                >
                  <Sparkles size={14} className={simulating ? 'spin' : ''} />
                  {simulating ? 'Đang xử lý đối soát…' : '⚡ Giả lập thanh toán SePay thành công (Test nhanh)'}
                </button>
              </div>
            </div>
          )}

          {/* Alerts */}
          {paymentOutcome === 'success' && phase === 'PENDING' && (
            <div className="dashboard-card txn-alert info">
              <div className="txn-alert-flex">
                <div>
                  <strong>Đã nhận tín hiệu trở về từ SePay!</strong>
                  <p className="txn-alert-sub">Đang tự động đối soát giao dịch với ngân hàng...</p>
                </div>
                <button
                  type="button"
                  className="txn-btn primary txn-btn-compact"
                  onClick={handleSyncPayment}
                  disabled={refreshing}
                >
                  <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
                  {refreshing ? 'Đang đối soát…' : 'Đối soát ngay'}
                </button>
              </div>
            </div>
          )}

          {paymentOutcome === 'cancel' && phase === 'PENDING' && (
            <div className="dashboard-card txn-alert info">
              Bạn đã dừng giao dịch trên SePay. Đơn hàng vẫn được lưu an toàn, bạn có thể thanh toán lại bất kỳ lúc nào.
            </div>
          )}

          {paymentError && <div className="dashboard-card txn-alert error">{paymentError}</div>}
          {error && <div className="dashboard-card txn-alert error">{error}</div>}

          {/* Action Buttons Bar */}
          <div className="dashboard-actions-bar">
            {phase === 'PAID' ? (
              <>
                <button type="button" className="txn-btn primary" onClick={onOrders}>
                  <FileText size={14} /> Xem đơn hàng của bạn
                </button>
                <button type="button" className="txn-btn outline" onClick={() => window.print()}>
                  <Printer size={14} /> In biên lai
                </button>
                <button type="button" className="txn-btn secondary" onClick={onContinue}>
                  <ShoppingBag size={14} /> Tiếp tục mua sắm
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="txn-btn primary"
                  onClick={refresh}
                  disabled={refreshing || paying}
                >
                  <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                  {refreshing ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái'}
                </button>
                <button type="button" className="txn-btn outline" onClick={onOrders}>
                  <FileText size={13} /> Xem danh sách đơn hàng
                </button>
                <button type="button" className="txn-btn secondary" onClick={onContinue}>
                  <ShoppingBag size={13} /> Tiếp tục mua sắm
                </button>
              </>
            )}
          </div>

          {/* Security & Support Guarantee Box */}
          <div className="dashboard-support-card">
            <div className="support-item">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Đối soát tự động qua <strong>{isVietQr ? 'VietQR QuickLink' : 'SePay Gateway'}</strong> · Chuẩn bảo mật ISO 27001</span>
            </div>
            <div className="support-item">
              <Headphones size={16} className="text-sky-600" />
              <span>Cần trợ giúp thanh toán? Hotline <strong>1900 6868</strong> (8:00 - 21:00 miễn phí)</span>
            </div>
            <div className="support-item-sub">
              {lastChecked && `Cập nhật gần nhất: ${lastChecked.toLocaleTimeString('vi-VN')}`}
              {phase === 'PENDING' && !pollingEnded && ' · Hệ thống đang tự động lắng nghe giao dịch (mỗi 3s)'}
            </div>
          </div>
        </div>

        {/* Right Column: Order Details, Items & Customer Information */}
        <div className="dashboard-col dashboard-col-right">
          {/* Metadata Card */}
          <div className="dashboard-card order-meta-card">
            <h3 className="card-section-title">Thông Tin Giao Dịch &amp; Khách Hàng</h3>
            <div className="meta-grid-2">
              <div className="meta-item">
                <span className="meta-label">Mã giao dịch (Txn ID):</span>
                <span className="meta-value font-mono flex items-center gap-1 font-semibold text-slate-800">
                  {txnId}
                  <button type="button" title="Sao chép" className="copy-icon-btn" onClick={() => copyText(txnId, 'txn')}>
                    {copiedField === 'txn' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Mã đơn hàng (Order Ref):</span>
                <span className="meta-value font-mono flex items-center gap-1 font-semibold text-slate-800">
                  {order.orderCode}
                  <button type="button" title="Sao chép" className="copy-icon-btn" onClick={() => copyText(order.orderCode, 'order')}>
                    {copiedField === 'order' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Phương thức:</span>
                <span className="meta-value font-medium text-slate-800">
                  {isVietQr ? 'Chuyển khoản VietQR QuickLink' : 'Cổng Thanh Toán SePay (24/7)'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Thời gian giao dịch:</span>
                <span className="meta-value text-slate-800">{formatDateTime(paidTime)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Khách hàng:</span>
                <span className="meta-value font-medium text-slate-800">{order.customerName} ({order.customerPhone})</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Địa chỉ nhận hàng:</span>
                <span className="meta-value text-slate-800">{order.shippingAddress || order.branchName || 'Nhận tại cửa hàng OptiVision'}</span>
              </div>
            </div>
          </div>

          {/* Items breakdown & Totals Card */}
          <div className="dashboard-card order-items-card">
            <div className="items-card-header">
              <h3 className="card-section-title">Sản Phẩm Trong Đơn Hàng</h3>
              <span className="badge-count">{(order.items || []).length} món</span>
            </div>

            <div className="dashboard-items-list">
              {(order.items || []).map((item) => (
                <div key={item.id || item.skuId || item.sku} className="dashboard-item-row">
                  <div className="dashboard-item-info">
                    <span className="dashboard-item-name">{item.productName}</span>
                    <span className="dashboard-item-sub">SKU: {item.skuId || item.sku} · SL: {item.quantity}</span>
                  </div>
                  <strong className="dashboard-item-price">
                    {money(item.subtotal != null ? item.subtotal : (item.unitPrice || 0) * (item.quantity || 1))}
                  </strong>
                </div>
              ))}
            </div>

            <div className="dashboard-totals-table">
              <div className="total-line">
                <span>Tiền hàng:</span>
                <span>{money(order.totalAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="total-line discount">
                  <span>Giảm giá / Voucher:</span>
                  <span>−{money(order.discountAmount)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Phí vận chuyển:</span>
                <span className="text-emerald-700 font-medium">Miễn phí toàn quốc</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="total-line">
                  <span>Thuế VAT:</span>
                  <span>{money(order.taxAmount)}</span>
                </div>
              )}
              <div className="total-line grand-total-line">
                <span>Tổng tiền thanh toán:</span>
                <strong className="grand-price">{money(order.finalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
