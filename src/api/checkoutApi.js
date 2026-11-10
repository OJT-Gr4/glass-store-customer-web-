const baseUrl = import.meta.env?.VITE_API_BASE_URL || '';

async function request(path, { signal, headers, ...options } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 20000);
  try {
    const token = localStorage.getItem('optivision_customer_token');
    const response = await fetch(`${baseUrl}/api/${path}`, {
      ...options, signal: controller.signal,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(result?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
      error.code = result?.errorCode;
      error.status = response.status;
      error.details = result?.data ?? result?.details;
      throw error;
    }
    if (result == null) throw new Error('Máy chủ chưa trả về dữ liệu hợp lệ.');
    return result.data ?? result;
  } catch (error) {
    if (error.name === 'AbortError' && !signal?.aborted) {
      throw new Error('Kết nối quá thời gian chờ. Giữ nguyên thông tin và thử lại.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export const checkoutApi = {
  async createOrder(payload, idempotencyKey) {
    const order = await request('orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
    if (!order?.id || !order?.orderCode) throw new Error('Chưa nhận được thông tin đơn hàng đã lưu. Vui lòng thử lại.');
    return order;
  },
  async listOrders(signal) {
    const orders = await request('orders', { signal });
    if (!Array.isArray(orders)) throw new Error('Danh sách đơn hàng không hợp lệ.');
    return orders;
  },
  async getOrder(orderCode, signal) {
    const order = await request(`orders/code/${encodeURIComponent(orderCode)}`, { signal });
    if (!order?.id || order.orderCode !== orderCode) throw new Error('Thông tin đơn hàng không khớp.');
    return order;
  },
  async paymentHistory(orderId, signal) {
    const payments = await request(`payments/order/${orderId}`, { signal });
    if (!Array.isArray(payments)) throw new Error('Chưa đọc được trạng thái thanh toán.');
    return payments;
  },
  configuration: signal => request('payments/sepay/configuration', { signal }),
  initiate: (orderId, signal, provider) => request(`payments/order/${orderId}/initiate${provider ? `?provider=${encodeURIComponent(provider)}` : ''}`, { method: 'POST', signal }),
  syncPayment: (orderId, signal) => request(`payments/order/${orderId}/sync`, { method: 'POST', signal }),
};
