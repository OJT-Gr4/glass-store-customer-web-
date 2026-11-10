import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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
    if (authLoading || !currentUser) return;
    const controller = new AbortController();
    setLoading(true);
    setOrder(null);
    setError('');
    load(controller.signal)
      .then(({ saved, history }) => {
        if (!controller.signal.aborted && autoPayment.current) {
          autoPayment.current = false;
          navigate(location.pathname, { replace: true, state: null });
          if (canPay(saved, history)) startPayment(saved.id);
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
    <section className="transaction-screen">
      {/* Transaction Voucher / E-Receipt Card */}
      <div className={`transaction-voucher ${state.theme}`}>
        {/* Receipt Top Header */}
        <div className="voucher-header">
          <div className="voucher-brand">
            <span className="brand-name">OptiVision</span>
            <span className="voucher-title">
              {phase === 'PAID' ? 'BIÊN LAI GIAO DỊCH ĐIỆN TỬ (E-RECEIPT)' : 'LỆNH GIAO DỊCH THANH TOÁN (PAYMENT ORDER)'}
            </span>
          </div>
          <div className={`voucher-badge ${state.theme}`}>
            {state.badge}
          </div>
        </div>

        {/* Hero Transaction Amount Section */}
        <div className="voucher-hero">
          <div className={`hero-badge-icon ${state.theme}`}>
            {phase === 'PAID' ? <CheckCircle2 size={32} /> : <Clock3 size={32} />}
          </div>
          <div className="hero-label">
            {phase === 'PAID' ? 'SỐ TIỀN ĐÃ THANH TOÁN' : 'SỐ TIỀN CẦN THANH TOÁN'}
          </div>
          <div className={`hero-amount ${state.theme}`}>
            {money(order.finalAmount)}
          </div>
          <p className="hero-subtext">
            {phase === 'PAID' ? (
              <span className="flex items-center justify-center gap-1.5 text-emerald-700">
                <Sparkles size={14} /> Giao dịch đã được ghi nhận vào tài khoản thụ hưởng
              </span>
            ) : (
              <span>Cổng thanh toán: <strong>SePay VietQR (Napas 24/7)</strong></span>
            )}
          </p>
        </div>

        {/* Perforated Divider Line */}
        <div className="voucher-separator">
          <span className="separator-hole left" />
          <span className="separator-line" />
          <span className="separator-hole right" />
        </div>

        {/* Transaction Core Metadata Grid */}
        <div className="voucher-body">
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Mã giao dịch (Txn ID):</span>
              <span className="meta-value font-mono flex items-center gap-1 font-semibold text-slate-800">
                {txnId}
                <button
                  type="button"
                  title="Sao chép mã giao dịch"
                  className="copy-icon-btn"
                  onClick={() => copyText(txnId, 'txn')}
                >
                  {copiedField === 'txn' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Mã đơn hàng (Order Ref):</span>
              <span className="meta-value font-mono flex items-center gap-1 font-semibold text-slate-800">
                {order.orderCode}
                <button
                  type="button"
                  title="Sao chép mã đơn hàng"
                  className="copy-icon-btn"
                  onClick={() => copyText(order.orderCode, 'order')}
                >
                  {copiedField === 'order' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Phương thức thanh toán:</span>
              <span className="meta-value font-medium text-slate-800">Chuyển khoản SePay VietQR (24/7)</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Thời gian giao dịch:</span>
              <span className="meta-value text-slate-800">{formatDateTime(paidTime)}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Trạng thái xử lý:</span>
              <span className={`status-pill ${state.theme}`}>
                {ORDER_LABELS[order.status] || 'Đang chuẩn bị'}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Kênh bán hàng:</span>
              <span className="meta-value text-slate-800">Cửa hàng trực tuyến OptiVision</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="order-items-box">
            <div className="box-title">
              <span>Sản phẩm trong giao dịch</span>
              <span className="text-xs text-slate-500 font-normal">{(order.items || []).length} món</span>
            </div>
            <div className="items-list">
              {(order.items || []).map((item) => (
                <div key={item.id || item.skuId || item.sku} className="item-row">
                  <div className="item-details">
                    <span className="item-name">{item.productName}</span>
                    <span className="item-sku">{item.skuId || item.sku} · Số lượng: {item.quantity}</span>
                  </div>
                  <strong className="item-price">
                    {money(item.subtotal != null ? item.subtotal : (item.unitPrice || 0) * (item.quantity || 1))}
                  </strong>
                </div>
              ))}
            </div>

            <div className="totals-table">
              <div className="total-row">
                <span>Tiền hàng:</span>
                <span>{money(order.totalAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="total-row discount">
                  <span>Giảm giá / Voucher:</span>
                  <span>−{money(order.discountAmount)}</span>
                </div>
              )}
              {Number(order.taxAmount) > 0 && (
                <div className="total-row">
                  <span>Thuế VAT:</span>
                  <span>{money(order.taxAmount)}</span>
                </div>
              )}
              <div className="total-row grand">
                <span>Tổng tiền thanh toán:</span>
                <strong>{money(order.finalAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Shipping info */}
          <div className="shipping-box">
            <div className="shipping-row">
              <span className="shipping-label">Khách hàng:</span>
              <strong className="shipping-value">{order.customerName} ({order.customerPhone})</strong>
            </div>
            <div className="shipping-row">
              <span className="shipping-label">Địa chỉ nhận hàng:</span>
              <span className="shipping-value">{order.shippingAddress || order.branchName || 'Nhận tại cửa hàng OptiVision'}</span>
            </div>
          </div>

          {/* Alerts & Outcome Notifier */}
          {paymentOutcome === 'success' && phase === 'PENDING' && (
            <div className="txn-alert info">
              <div className="txn-alert-flex">
                <div>
                  <strong>Đã nhận tín hiệu trở về từ SePay!</strong>
                  <p className="txn-alert-sub">
                    Tín hiệu chuyển khoản đã hoàn tất trên SePay. Hệ thống đang tự động đồng bộ kết quả đối soát từ cổng thanh toán.
                  </p>
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
            <div className="txn-alert info">
              Bạn đã dừng giao dịch trên cổng thanh toán SePay. Đơn hàng vẫn được lưu an toàn, bạn có thể thanh toán lại bất kỳ lúc nào.
            </div>
          )}

          {paymentError && <div className="txn-alert error">{paymentError}</div>}
          {error && <div className="txn-alert error">{error}</div>}

          {/* Action Button Bar */}
          <div className="voucher-actions">
            {phase === 'PAID' ? (
              <>
                <button type="button" className="txn-btn primary" onClick={onOrders}>
                  <FileText size={15} /> Xem đơn hàng của bạn
                </button>
                <button type="button" className="txn-btn outline" onClick={() => window.print()}>
                  <Printer size={15} /> In biên lai
                </button>
                <button type="button" className="txn-btn secondary" onClick={onContinue}>
                  <ShoppingBag size={15} /> Tiếp tục mua sắm
                </button>
              </>
            ) : (
              <>
                {canPay(order, payments) && (
                  <button
                    type="button"
                    className="txn-btn primary"
                    disabled={paying || refreshing || Boolean(error)}
                    onClick={() => startPayment(order.id)}
                  >
                    {paying ? 'Đang mở SePay…' : 'Mở cổng thanh toán SePay ngay'}
                    <ExternalLink size={15} />
                  </button>
                )}
                <button
                  type="button"
                  className="txn-btn secondary"
                  onClick={refresh}
                  disabled={refreshing || paying}
                >
                  <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                  {refreshing ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái'}
                </button>
                <button type="button" className="txn-btn outline" onClick={onOrders}>
                  <FileText size={14} /> Tất cả đơn hàng
                </button>
              </>
            )}
          </div>

          {/* Security & Audit Footer */}
          <div className="voucher-footer">
            <span className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              Giao dịch đối soát tự động qua <strong>SePay Payment Gateway</strong> · Hệ thống bảo mật ISO 27001
            </span>
            <div className="footer-timestamp">
              {lastChecked && `Thời gian cập nhật gần nhất: ${lastChecked.toLocaleTimeString('vi-VN')}`}
              {phase === 'PENDING' && !pollingEnded && ' · Đang tự động lắng nghe giao dịch (mỗi 3s)'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
