import React, { useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, ShoppingBag } from 'lucide-react';
import { checkoutApi } from '../api/checkoutApi';
import { money } from './purchaseUtils';
import { ORDER_LABELS } from './paymentUtils';
import './purchase.css';

export default function OrdersPage({ setActiveTab, currentUser, authLoading, openAuth, onOpenOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState('ALL');
  useEffect(() => {
    if (authLoading || !currentUser) return;
    const controller = new AbortController();
    setOrders([]); setLoading(true); setError('');
    checkoutApi.listOrders(controller.signal).then(setOrders)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authLoading, currentUser?.id, attempt]);
  const filtered = useMemo(() => orders.filter(order => filter === 'ALL' || order.status === filter), [orders, filter]);

  if (authLoading) return <section className="purchase-page" role="status">Đang kiểm tra phiên đăng nhập…</section>;
  if (!currentUser) return <section className="purchase-page"><div className="purchase-card"><h1>Đơn hàng của bạn</h1><p className="purchase-muted">Đăng nhập để xem các đơn hàng đã đặt.</p><button className="purchase-primary" onClick={openAuth}>Đăng nhập</button></div></section>;

  return <section className="purchase-page customer-orders">
    <div className="payment-page-heading"><div><p className="purchase-muted">Trang chủ / Đơn hàng</p><h1>Đơn hàng của bạn</h1><p className="purchase-muted">Theo dõi đơn đã lưu và tiếp tục thanh toán trên cùng mã đơn.</p></div><button className="purchase-primary" onClick={() => setActiveTab('products')}><ShoppingBag size={16} />Mua sắm thêm</button></div>
    <div className="orders-toolbar"><label>Lọc đơn hàng <select value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">Tất cả ({orders.length})</option>{Object.entries(ORDER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button onClick={() => setAttempt(value => value + 1)} disabled={loading}><RefreshCw size={16} />Tải lại</button></div>
    {loading ? <p role="status">Đang tải đơn hàng…</p> : error ? <p role="alert" className="purchase-error">{error}</p> : !filtered.length ? <div className="purchase-card orders-empty"><Package size={36} /><h2>{orders.length ? 'Không có đơn theo bộ lọc này' : 'Bạn chưa có đơn hàng nào'}</h2><p className="purchase-muted">Các đơn đặt thành công sẽ xuất hiện ở đây.</p></div> : <div className="orders-list">{filtered.map(order => <article className="purchase-card customer-order" key={order.id}>
      <header><div><strong>{order.orderCode}</strong><p className="purchase-muted">{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''} · {order.channel === 'POS' ? 'Mua tại cửa hàng' : 'Mua trực tuyến'}</p></div><span className="payment-badge">{ORDER_LABELS[order.status] || 'Đang xử lý'}</span></header>
      <div className="order-products">{(order.items || []).map(item => <div key={item.id || item.skuId}><span>{item.productName}<small>{item.skuId} · Số lượng {item.quantity}</small></span><strong>{money(item.subtotal)}</strong></div>)}</div>
      <footer><span>Tổng thanh toán <strong>{money(order.finalAmount)}</strong></span><button className="purchase-primary" onClick={() => onOpenOrder(order.orderCode)}>Xem đơn / Thanh toán</button></footer>
    </article>)}</div>}
  </section>;
}
