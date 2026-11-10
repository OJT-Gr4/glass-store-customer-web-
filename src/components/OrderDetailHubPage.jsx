import React, { useCallback, useEffect, useRef, useState } from 'react';
import { customerOrdersApi } from '../api/customerOrdersApi.js';
import { money } from './purchaseUtils.js';
import { orderDate, orderStatusLabels, canRequestCancellation } from './customerOrderUtils.js';
import './purchase.css';

export default function OrderDetailHubPage({ setActiveTab, currentUser, openAuth, orderId }) {
  const customerId = currentUser?.id;
  const [state, setState] = useState({ owner: null, id: null, loading: true, order: null, error: '' });
  const [retry, setRetry] = useState(0);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Payment sandbox initiation state (S3-02)
  const [paymentData, setPaymentData] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Return / Exchange request state (GLAS-17 S3-17)
  const [returnReason, setReturnReason] = useState('Trầy xước bề mặt tròng kính');
  const [returnNote, setReturnNote] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');

  const generation = useRef(0);
  const locked = useRef(false);
  const refreshLock = useRef(false);

  const silentCheck = useCallback(async () => {
    if (!customerId || !orderId || refreshLock.current) return;
    refreshLock.current = true;
    try {
      const updated = await customerOrdersApi.get(orderId, customerId);
      if (updated) {
        setState(prev => (prev.id === orderId && prev.owner === customerId ? { ...prev, order: updated } : prev));
      }
    } catch {
      // Silent background check failure
    } finally {
      refreshLock.current = false;
    }
  }, [customerId, orderId]);

  useEffect(() => {
    const run = ++generation.current;
    setReason(''); setCancelError(''); setRequesting(false); locked.current = false;
    setPaymentData(null); setPaymentError('');
    if (!customerId || !orderId) return;
    setState({ owner: customerId, id: orderId, loading: true, order: null, error: '' });
    customerOrdersApi.get(orderId, customerId)
      .then(order => { if (generation.current === run) setState({ owner: customerId, id: orderId, loading: false, order, error: '' }); })
      .catch(error => { if (generation.current === run) setState({ owner: customerId, id: orderId, loading: false, order: null, error: error.message }); });
    return () => { generation.current++; };
  }, [customerId, orderId, retry]);

  if (!customerId) return <section className="purchase-page"><h1>Chi tiết đơn hàng</h1><p className="purchase-muted">Vui lòng đăng nhập để xem đơn hàng.</p><button onClick={openAuth}>Đăng nhập</button></section>;
  const current = state.owner === customerId && state.id === orderId ? state : { loading: true, order: null, error: '' };
  const order = current.order;

  const handleInitiatePayment = async () => {
    try {
      setInitiatingPayment(true);
      setPaymentError('');
      const data = await customerOrdersApi.initiatePayment(orderId, customerId, 'VIETQR');
      setPaymentData(data);
    } catch (err) {
      setPaymentError(err.message || 'Không thể khởi tạo thanh toán.');
    } finally {
      setInitiatingPayment(false);
    }
  };

  useEffect(() => {
    if (order?.status === 'PENDING_PAYMENT' && !paymentData && !initiatingPayment) {
      handleInitiatePayment();
    }
  }, [order?.status, order?.id]);

  // Silent real-time background polling every 3s without remounting or resetting QR
  useEffect(() => {
    if (!customerId || !orderId || order?.status !== 'PENDING_PAYMENT') return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        silentCheck();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [customerId, orderId, order?.status, silentCheck]);

  const cancel = async event => {
    event.preventDefault();
    if (locked.current) return;
    const run = generation.current;
    locked.current = true; setRequesting(true); setCancelError('');
    try {
      const updated = await customerOrdersApi.requestCancellation(orderId, customerId, reason);
      if (generation.current === run) setState({ owner: customerId, id: orderId, loading: false, order: updated, error: '' });
    } catch (error) { if (generation.current === run) setCancelError(error.message); }
    finally { if (generation.current === run) { locked.current = false; setRequesting(false); } }
  };

  const handleReturn = async event => {
    event.preventDefault();
    try {
      setSubmittingReturn(true);
      setReturnError('');
      const combined = `${returnReason}${returnNote ? `: ${returnNote}` : ''}`;
      await customerOrdersApi.requestReturn(orderId, customerId, combined);
      setReturnSuccess(true);
    } catch (err) {
      setReturnError(err.message || 'Lỗi khi gửi yêu cầu đổi/trả hàng');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <section className="purchase-page">
      <div className="purchase-toolbar">
        <button onClick={() => setActiveTab('orders')}>Đơn hàng của bạn</button>
        <button disabled={current.loading || requesting} onClick={() => setRetry(value => value + 1)}>Tải lại</button>
      </div>

      {!orderId ? (
        <p>Vui lòng chọn đơn từ danh sách.</p>
      ) : current.loading ? (
        <p role="status">Đang tải chi tiết…</p>
      ) : current.error ? (
        <p role="alert" className="purchase-error">{current.error}</p>
      ) : order && (
        <article className="purchase-card order-hub-card">
          {order.status === 'PENDING_PAYMENT' && (order.paymentMethod === 'VIETQR' || order.paymentMethod === 'VNPAY' || !order.paymentMethod || order.paymentMethod === 'CASH') ? (
            <div className="order-hub-grid">
              {/* Left Column: VietQR Sandbox & QR Code */}
              <div className="order-hub-payment-col">
                <div className="order-hub-payment-box">
                  <h3 className="payment-box-title">Cổng Thanh Toán Chuyển Khoản VietQR (Napas 24/7)</h3>
                  <p className="payment-box-subtitle">
                    Quét mã QR bằng App ngân hàng bất kỳ để thanh toán <strong>{money(order.finalAmount)}</strong>
                  </p>

                  {!paymentData ? (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                      <button
                        type="button"
                        onClick={handleInitiatePayment}
                        disabled={initiatingPayment}
                        className="txn-btn primary"
                      >
                        {initiatingPayment ? 'Đang khởi tạo cổng VietQR…' : 'Mở Mã Thanh Toán VietQR'}
                      </button>
                    </div>
                  ) : (
                    <div className="vietqr-presentation">
                      <img
                        src={paymentData.paymentUrl}
                        alt="VietQR Payment"
                        className="vietqr-image"
                      />
                      <div className="bank-account-details">
                        <div>Ngân hàng: <strong>MBBank (Ngân Hàng Quân Đội)</strong></div>
                        <div>Số tài khoản: <strong>0987654321</strong></div>
                        <div>Chủ tài khoản: <strong>OPTI VISION CLINICAL</strong></div>
                        <div>Số tiền: <strong>{money(order.finalAmount)}</strong></div>
                        <div>Nội dung: <strong>DH {order.orderCode}</strong></div>
                      </div>
                      <div className="payment-action-btns">
                        <button
                          type="button"
                          className="txn-btn secondary txn-btn-compact"
                          onClick={silentCheck}
                        >
                          Đã thanh toán? Nhấn để kiểm tra
                        </button>
                        <button
                          type="button"
                          className="txn-btn primary txn-btn-compact btn-simulate"
                          onClick={async () => {
                            try {
                              await fetch(`/api/payments/sandbox/simulate-callback?orderCode=${encodeURIComponent(order.orderCode)}`, { method: 'POST' });
                              await silentCheck();
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                        >
                          ⚡ Giả lập thanh toán VietQR thành công
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentError && <p className="purchase-error" style={{ margin: '8px 0 0', fontSize: '11.5px' }}>{paymentError}</p>}
                </div>
              </div>

              {/* Right Column: Order Details, Items, Shipping & Actions */}
              <div className="order-hub-details-col">
                <div className="order-hub-header">
                  <h2 className="order-hub-title">{order.orderCode}</h2>
                  <span className="status-pill pending">
                    {orderStatusLabels[order.status] || order.status}
                  </span>
                </div>

                <div className="order-meta-info">
                  <p className="purchase-muted">Ngày tạo: {orderDate(order.createdAt)} · Kênh: Cửa hàng trực tuyến</p>
                  <p><strong>Khách hàng:</strong> {order.customerName} ({order.customerPhone})</p>
                  {order.deliveryMethod && (
                    <p><strong>Hình thức nhận:</strong> {order.deliveryMethod === 'SHOWROOM' ? `Showroom (${order.storePickupLocation || 'Showroom OptiVision'})` : 'Giao hàng tận nơi'}</p>
                  )}
                  {order.shippingAddress && <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>}
                </div>

                <div className="purchase-summary compact-summary">
                  {(order.items || []).map(item => (
                    <p key={item.id || item.skuId}>
                      <span>{item.productName || item.skuId} × {item.quantity}</span>
                      <strong>{money(item.subtotal)}</strong>
                    </p>
                  ))}
                  <p className="summary-grand-total">
                    <strong>Tổng thanh toán</strong>
                    <strong className="grand-amount">{money(order.finalAmount)}</strong>
                  </p>
                </div>

                {order.prescription && (
                  <div className="purchase-rx-summary compact-rx">
                    <strong>Thông số kính đã lưu với đơn</strong>
                    <p>OD: SPH {order.prescription.odSph} / CYL {order.prescription.odCyl} / AXIS {order.prescription.odAxis}</p>
                    <p>OS: SPH {order.prescription.osSph} / CYL {order.prescription.osCyl} / AXIS {order.prescription.osAxis} · PD {order.prescription.pd} mm</p>
                  </div>
                )}

                {order.status === 'CANCEL_REQUESTED' ? (
                  <p role="status" className="purchase-muted">
                    Yêu cầu hủy đã được ghi nhận, đang chờ nhân viên xử lý.
                  </p>
                ) : canRequestCancellation(order) && (
                  <form onSubmit={cancel} className="cancel-compact-form">
                    <input
                      required
                      placeholder="Lý do yêu cầu hủy đơn..."
                      maxLength={500}
                      value={reason}
                      disabled={requesting}
                      onChange={event => setReason(event.target.value)}
                    />
                    <button disabled={requesting || !reason.trim()} type="submit">
                      {requesting ? 'Đang gửi…' : 'Gửi yêu cầu hủy'}
                    </button>
                  </form>
                )}
                {cancelError && <p role="alert" className="purchase-error">{cancelError}</p>}
              </div>
            </div>
          ) : (
            /* Non-pending order view */
            <>
              <h1>{order.orderCode}</h1>
              <p><strong>{orderStatusLabels[order.status] || order.status}</strong></p>
              <p className="purchase-muted">Ngày tạo: {orderDate(order.createdAt)}</p>
              <p>{order.customerName} · {order.customerPhone}</p>
              {order.deliveryMethod && (
                <p><strong>Hình thức nhận:</strong> {order.deliveryMethod === 'SHOWROOM' ? `Nhận tại showroom (${order.storePickupLocation || 'Showroom OptiVision'})` : 'Giao hàng tận nơi'}</p>
              )}
              {order.shippingAddress && <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>}
              {order.branchName && <p>Chi nhánh: {order.branchName}</p>}

              <div className="purchase-summary">
                {(order.items || []).map(item => (
                  <p key={item.id || item.skuId}>
                    <span>{item.productName || item.skuId} × {item.quantity}</span>
                    <strong>{money(item.subtotal)}</strong>
                  </p>
                ))}
                <p><strong>Tổng thanh toán</strong><strong>{money(order.finalAmount)}</strong></p>
              </div>

              <p>Phương thức: {order.paymentMethod || 'Chưa cập nhật'}</p>

              {order.prescription && (
                <div className="purchase-rx-summary">
                  <strong>Thông số kính đã lưu với đơn</strong>
                  <p>OD: SPH {order.prescription.odSph} / CYL {order.prescription.odCyl} / AXIS {order.prescription.odAxis}</p>
                  <p>OS: SPH {order.prescription.osSph} / CYL {order.prescription.osCyl} / AXIS {order.prescription.osAxis} · PD {order.prescription.pd} mm</p>
                </div>
              )}

              {order.status === 'CANCEL_REQUESTED' ? (
                <p role="status" className="purchase-muted">
                  Yêu cầu hủy đã được ghi nhận, đang chờ nhân viên xử lý. Đây chưa phải xác nhận hủy hoặc hoàn tiền.
                </p>
              ) : canRequestCancellation(order) && (
                <form onSubmit={cancel} className="purchase-fields customer-cancel">
                  <label className="purchase-field">
                    Lý do yêu cầu hủy
                    <input required maxLength={500} value={reason} disabled={requesting} onChange={event => setReason(event.target.value)} />
                  </label>
                  <button disabled={requesting || !reason.trim()} type="submit">
                    {requesting ? 'Đang gửi…' : 'Gửi yêu cầu hủy'}
                  </button>
                </form>
              )}

              {/* GLAS-17: Return & Exchange Request for completed orders */}
              {['COMPLETED', 'DELIVERED'].includes(String(order.status || '').toUpperCase()) && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Chính Sách Đổi Trả &amp; Hậu Mãi (S3-17)</h3>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#475569' }}>
                    Đơn hàng đã hoàn tất. Quý khách được quyền đổi trả hoặc chỉnh nắn miễn phí trong vòng 30 ngày nếu phát hiện lỗi quang học hoặc trầy xước.
                  </p>
                  {returnSuccess ? (
                    <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem' }}>
                      ✓ Đã tiếp nhận yêu cầu đổi / trả hàng thành công! Đội ngũ CSKH OptiVision sẽ liên hệ với bạn trong vòng 24 giờ.
                    </div>
                  ) : (
                    <form onSubmit={handleReturn} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                        Lý do đổi / trả hàng:
                        <select
                          value={returnReason}
                          onChange={e => setReturnReason(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
                        >
                          <option value="Trầy xước bề mặt tròng kính">Trầy xước bề mặt tròng kính</option>
                          <option value="Sai thông số độ cận/loạn so với toa đo">Sai thông số độ cận/loạn so với toa đo</option>
                          <option value="Gọng bị chật/lỏng hoặc lệch càng">Gọng bị chật/lỏng hoặc lệch càng</option>
                          <option value="Bong tróc lớp váng phủ chống chói">Bong tróc lớp váng phủ chống chói</option>
                          <option value="Khác">Lý do khác</option>
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                        Ghi chú thêm (tùy chọn):
                        <input
                          type="text"
                          placeholder="Mô tả chi tiết tình trạng kính..."
                          value={returnNote}
                          onChange={e => setReturnNote(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                      </label>
                      {returnError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>{returnError}</p>}
                      <button
                        type="submit"
                        disabled={submittingReturn}
                        style={{ alignSelf: 'flex-start', padding: '0.4rem 0.9rem', background: '#086288', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        {submittingReturn ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu đổi / trả'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {cancelError && <p role="alert" className="purchase-error">{cancelError} Trạng thái đang hiển thị được giữ nguyên; tải lại đơn để kiểm tra trước khi thử lại.</p>}
            </>
          )}
        </article>
      )}
    </section>
  );
}
