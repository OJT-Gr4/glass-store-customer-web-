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
  const generation = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    const run = ++generation.current;
    setReason(''); setCancelError(''); setRequesting(false); locked.current = false;
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
  return <section className="purchase-page"><div className="purchase-toolbar"><button onClick={() => setActiveTab('orders')}>Đơn hàng của bạn</button><button disabled={current.loading || requesting} onClick={() => setRetry(value => value + 1)}>Tải lại</button></div>
    {!orderId ? <p>Vui lòng chọn đơn từ danh sách.</p> : current.loading ? <p role="status">Đang tải chi tiết…</p> : current.error ? <p role="alert" className="purchase-error">{current.error}</p> : order && <article className="purchase-card">
      <h1>{order.orderCode}</h1><p><strong>{orderStatusLabels[order.status] || order.status}</strong></p><p className="purchase-muted">Ngày tạo: {orderDate(order.createdAt)}</p>
      <p>{order.customerName} · {order.customerPhone}</p>{order.shippingAddress && <p>{order.shippingAddress}</p>}{order.branchName && <p>Chi nhánh: {order.branchName}</p>}
      <div className="purchase-summary">{(order.items || []).map(item => <p key={item.id || item.skuId}><span>{item.productName || item.skuId} × {item.quantity}</span><strong>{money(item.subtotal)}</strong></p>)}<p><strong>Tổng thanh toán</strong><strong>{money(order.finalAmount)}</strong></p></div>
      <p>Phương thức: {order.paymentMethod || 'Chưa cập nhật'}</p>
      {order.prescription && <div className="purchase-rx-summary"><strong>Thông số kính đã lưu với đơn</strong><p>OD: SPH {order.prescription.odSph} / CYL {order.prescription.odCyl} / AXIS {order.prescription.odAxis}</p><p>OS: SPH {order.prescription.osSph} / CYL {order.prescription.osCyl} / AXIS {order.prescription.osAxis} · PD {order.prescription.pd} mm</p></div>}
      {order.status === 'CANCEL_REQUESTED' ? <p role="status" className="purchase-muted">Yêu cầu hủy đã được ghi nhận, đang chờ nhân viên xử lý. Đây chưa phải xác nhận hủy hoặc hoàn tiền.</p> : canRequestCancellation(order) && <form onSubmit={cancel} className="purchase-fields customer-cancel"><label className="purchase-field">Lý do yêu cầu hủy<input required maxLength={500} value={reason} disabled={requesting} onChange={event => setReason(event.target.value)} /></label><button disabled={requesting || !reason.trim()} type="submit">{requesting ? 'Đang gửi…' : 'Gửi yêu cầu hủy'}</button></form>}
      {cancelError && <p role="alert" className="purchase-error">{cancelError} Trạng thái đang hiển thị được giữ nguyên; tải lại đơn để kiểm tra trước khi thử lại.</p>}
    </article>}
  </section>;
}
