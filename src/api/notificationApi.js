import { authApi } from './authApi';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const token = authApi.getToken();
  if (!token) {
    const error = new Error('Vui lòng đăng nhập để xem thông báo giao dịch của bạn.');
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const envelope = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(envelope?.message || `Không tải được thông báo (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return envelope?.data;
}

export const notificationApi = {
  async getInbox({ unreadOnly = false, category = '' } = {}) {
    const params = new URLSearchParams();
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (category && category !== 'ALL') params.set('category', category);
    const qs = params.toString();
    const data = await request(`/api/notifications${qs ? `?${qs}` : ''}`);
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Dữ liệu thông báo trả về không hợp lệ.');
    }
    return data;
  },

  async getUnreadSummary() {
    const data = await request('/api/notifications/unread-count');
    if (data == null || typeof data.unreadCount !== 'number') {
      throw new Error('Không đọc được trạng thái thông báo chưa đọc.');
    }
    return data;
  },

  async markAsRead(id) {
    const data = await request(`/api/notifications/${id}/read`, { method: 'PATCH' });
    if (!data?.id) {
      throw new Error('Máy chủ chưa xác nhận đánh dấu đã đọc.');
    }
    return data;
  },

  async markAllAsRead() {
    const data = await request('/api/notifications/read-all', { method: 'PATCH' });
    if (!data) {
      throw new Error('Máy chủ chưa xác nhận đánh dấu tất cả đã đọc.');
    }
    return data;
  },
};
