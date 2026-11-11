import React, { useEffect, useRef, useState } from 'react';
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
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Return / Exchange request state (GLAS-17 S3-17)
  const [returnReason, setReturnReason] = useState('Trầy xước bề mặt tròng kính');
  const [returnNote, setReturnNote] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');

  const generation = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    const run = ++generation.current;
    setReason(''); setCancelError(''); setRequesting(false); locked.current = false;
    if (!customerId || !orderId) return;
    setState(prev => prev.order ? prev : { owner: customerId, id: orderId, loading: true, order: null, error: '' });
    customerOrdersApi.get(orderId, customerId)
      .then(order => {
        if (generation.current === run) {
          setState({ owner: customerId, id: orderId, loading: false, order, error: '' });
          if (order && order.status !== 'PENDING_PAYMENT') {
            setPaymentData(null);
          }
        }
      })
      .catch(error => { if (generation.current === run) setState({ owner: customerId, id: orderId, loading: false, order: null, error: error.message }); });
    return () => { generation.current++; };
  }, [customerId, orderId, retry]);

  if (!customerId) return <section className="purchase-page"><h1>Chi tiết đơn hàng</h1><p className="purchase-muted">Vui lòng đăng nhập để xem đơn hàng.</p><button onClick={openAuth}>Đăng nhập</button></section>;
  const current = state.owner === customerId && state.id === orderId ? state : { loading: true, order: null, error: '' };
  const order = current.order;

  // Tự động kiểm tra trạng thái thanh toán theo chu kỳ 2.5s khi đang mở mã VietQR
  useEffect(() => {
    if (!paymentData || !customerId || !orderId || order?.status !== 'PENDING_PAYMENT') return;

    const timer = setInterval(async () => {
      try {
        const fresh = await customerOrdersApi.get(orderId, customerId);
        if (fresh && fresh.status !== 'PENDING_PAYMENT') {
          setState({ owner: customerId, id: orderId, loading: false, order: fresh, error: '' });
          setPaymentData(null);
          setPaymentNotice('Thanh toán thành công! Đơn hàng đã được xác nhận.');
        }
      } catch {
        // silent polling catch
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [paymentData, customerId, orderId, order?.status]);

  const handleVerifyPayment = async () => {
    if (!order?.orderCode || checkingPayment) return;
    try {
      setCheckingPayment(true);
      setPaymentNotice('Đang kiểm tra & kích hoạt đối soát giao dịch VietQR...');
      const updated = await customerOrdersApi.verifyAndConfirmPayment(orderId, customerId, order.orderCode);
      if (updated && updated.status !== 'PENDING_PAYMENT') {
        setState({ owner: customerId, id: orderId, loading: false, order: updated, error: '' });
        setPaymentData(null);
        setPaymentNotice('Thanh toán thành công! Đơn hàng đã chuyển sang trạng thái: Đã thanh toán.');
      } else {
        setPaymentNotice('Chưa ghi nhận biến động số dư. Nếu bạn đã chuyển khoản, vui lòng thử lại sau 2-3 giây.');
      }
    } catch (err) {
      setPaymentNotice(err.message || 'Lỗi khi kiểm tra thanh toán.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleInitiatePayment = async () => {
    try {
      setInitiatingPayment(true);
      setPaymentError('');
      setPaymentNotice('');
      const data = await customerOrdersApi.initiatePayment(orderId, customerId);
      setPaymentData(data);
    } catch (err) {
      setPaymentError(err.message || 'Không thể khởi tạo thanh toán.');
    } finally {
      setInitiatingPayment(false);
    }
  };

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
        <article className="purchase-card">
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

          {/* S3-02: Payment Sandbox QR Code & Initiation Flow */}
          {order.status === 'PENDING_PAYMENT' && (order.paymentMethod === 'VIETQR' || order.paymentMethod === 'VNPAY' || !order.paymentMethod || order.paymentMethod === 'CASH') && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>Cổng Thanh Toán Trực Tuyến Sandbox</h3>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569' }}>
                Đơn hàng đang chờ thanh toán. Bạn có thể mở mã VietQR hoặc đường dẫn thanh toán để thực hiện chuyển khoản.
              </p>

              {!paymentData ? (
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={initiatingPayment}
                  style={{ padding: '0.5rem 1rem', background: '#086288', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {initiatingPayment ? 'Đang khởi tạo cổng…' : 'Mở Cổng Thanh Toán VietQR'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img
                    src={paymentData.paymentUrl}
                    alt="VietQR Payment"
                    style={{ maxWidth: '280px', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Mã giao dịch: <strong>{paymentData.externalTransactionId}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#086288', textAlign: 'center' }}>
                    Quét mã QR bằng App ngân hàng bất kỳ để thanh toán {money(order.finalAmount)}.
                  </p>
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={checkingPayment}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: checkingPayment ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    {checkingPayment ? 'Đang kiểm tra giao dịch…' : 'Đã thanh toán? Nhấn để kiểm tra'}
                  </button>
                  {paymentNotice && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: paymentNotice.includes('thành công') ? '#059669' : '#d97706', textAlign: 'center', fontWeight: 500 }}>
                      {paymentNotice}
                    </p>
                  )}
                </div>
              )}

              {paymentError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' }}>{paymentError}</p>}
            </div>
          )}

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
                  Đã tiếp nhận yêu cầu đổi / trả hàng thành công! Đội ngũ CSKH OptiVision sẽ liên hệ với bạn trong vòng 24 giờ.
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
        </article>
      )}
    </section>
  );
}
