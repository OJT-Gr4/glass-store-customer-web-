const baseUrl = import.meta.env?.VITE_API_BASE_URL || '';

function requireId(id) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error('Mã đơn hoặc tài khoản không hợp lệ.');
  return Number(id);
}

async function request(path, options = {}) {
  const token = localStorage.getItem('optivision_customer_token');
  if (!token) throw new Error('Vui lòng đăng nhập để xem đơn hàng.');
  const response = await fetch(`${baseUrl}/api/orders${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const envelope = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(envelope?.message || 'Không thể tải đơn hàng. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }
  return envelope?.data;
}

function ownedOrder(order, customerId) {
  if (!order?.id || !order.orderCode || Number(order.customerId) !== requireId(customerId))
    throw new Error('Không xác minh được đơn hàng thuộc tài khoản hiện tại.');
  return order;
}

export const customerOrdersApi = {
  async list(customerId) {
    const rows = await request(`/customer/${requireId(customerId)}`);
    if (!Array.isArray(rows)) throw new Error('Danh sách đơn hàng không hợp lệ.');
    return rows.map(row => ownedOrder(row, customerId));
  },
  async get(id, customerId) {
    requireId(customerId);
    const order = ownedOrder(await request(`/${requireId(id)}`), customerId);
    if (Number(order.id) !== Number(id)) throw new Error('Máy chủ trả về sai mã đơn hàng.');
    return order;
  },
  async requestCancellation(id, customerId, reason) {
    requireId(customerId);
    if (!reason?.trim()) throw new Error('Vui lòng nhập lý do yêu cầu hủy.');
    const order = ownedOrder(await request(`/${requireId(id)}/cancel-request`, {
      method: 'POST', body: JSON.stringify({ reason: reason.trim() }),
    }), customerId);
    if (Number(order.id) !== Number(id) || order.status !== 'CANCEL_REQUESTED')
      throw new Error('Chưa xác nhận được yêu cầu hủy. Hãy tải lại đơn để kiểm tra.');
    return order;
  },
};
