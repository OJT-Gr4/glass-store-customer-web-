import React, { useEffect, useState } from 'react';
import { customerOrdersApi } from '../api/customerOrdersApi.js';
import { money } from './purchaseUtils.js';
import { orderDate, orderStatusLabels } from './customerOrderUtils.js';
import './purchase.css';

const pageSize = 8;

export default function OrdersPage({ setActiveTab, currentUser, openAuth, onOpenOrder }) {
  const [state, setState] = useState({ owner: null, loading: true, rows: [], error: '' });
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const customerId = currentUser?.id;

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    setState({ owner: customerId, loading: true, rows: [], error: '' });
    customerOrdersApi.list(customerId)
      .then(rows => { if (active) setState({ owner: customerId, loading: false, rows, error: '' }); })
      .catch(error => { if (active) setState({ owner: customerId, loading: false, rows: [], error: error.message }); });
    return () => { active = false; };
  }, [customerId, retry]);

  useEffect(() => { setPage(1); setStatus('ALL'); }, [customerId]);

  if (!customerId) return (
    <section className="purchase-page">
      <h1>Đơn hàng của bạn</h1>
      <p className="purchase-muted">Đăng nhập để xem đơn của tài khoản.</p>
      <button onClick={openAuth}>Đăng nhập</button>
    </section>
  );

  const current = state.owner === customerId ? state : { loading: true, rows: [], error: '' };
  const rows = status === 'ALL' ? current.rows : current.rows.filter(row => row.status === status);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const selectedPage = Math.min(page, pages);

  return (
    <section className="purchase-page">
      <div className="purchase-toolbar">
        <h1>Đơn hàng của bạn</h1>
        <button onClick={() => setRetry(value => value + 1)} disabled={current.loading}>Làm mới</button>
        <button onClick={() => setActiveTab('products')}>Mua sắm thêm</button>
      </div>

      <label className="purchase-field">
        Trạng thái
        <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
          <option value="ALL">Tất cả</option>
          {[...new Set(current.rows.map(row => row.status))].map(value => (
            <option key={value} value={value}>{orderStatusLabels[value] || value}</option>
          ))}
        </select>
      </label>

      {current.loading ? (
        <p role="status">Đang tải đơn hàng…</p>
      ) : current.error ? (
        <div role="alert" className="purchase-error">
          {current.error}
          <button onClick={() => setRetry(value => value + 1)}>Thử lại</button>
        </div>
      ) : !rows.length ? (
        <p className="purchase-muted">Chưa có đơn hàng phù hợp.</p>
      ) : (
        <>
          <div className="customer-orders">
            {rows.slice((selectedPage - 1) * pageSize, selectedPage * pageSize).map(order => (
              <article className="purchase-card" key={order.id}>
                <div className="purchase-toolbar">
                  <strong>{order.orderCode}</strong>
                  <span>{orderStatusLabels[order.status] || order.status}</span>
                </div>
                <p className="purchase-muted">
                  {orderDate(order.createdAt)}{order.branchName ? ` · ${order.branchName}` : ''}
                </p>
                <p>
                  {(order.items || []).map(item => `${item.productName || item.skuId} × ${item.quantity}`).join(', ') || 'Xem chi tiết sản phẩm'}
                </p>
                <div className="purchase-actions">
                  <strong>{money(order.finalAmount)}</strong>
                  <button onClick={() => onOpenOrder(order.id, order.orderCode)}>
                    Xem chi tiết / Thanh toán
                  </button>
                </div>
              </article>
            ))}
          </div>
          <nav className="purchase-actions" aria-label="Trang đơn hàng">
            <button disabled={selectedPage <= 1} onClick={() => setPage(selectedPage - 1)}>Trước</button>
            <span>Trang {selectedPage}/{pages}</span>
            <button disabled={selectedPage >= pages} onClick={() => setPage(selectedPage + 1)}>Sau</button>
          </nav>
        </>
      )}
    </section>
  );
}
