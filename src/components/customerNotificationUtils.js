export const DEFAULT_POLL_INTERVAL_SECONDS = 15;

export function normalizePollIntervalMs(pollIntervalSeconds) {
  const num = Number(pollIntervalSeconds);
  if (!Number.isFinite(num) || num <= 0) {
    return DEFAULT_POLL_INTERVAL_SECONDS * 1000;
  }
  const clampedSeconds = Math.max(5, Math.min(120, Math.round(num)));
  return clampedSeconds * 1000;
}

export function formatNotificationDate(value) {
  if (!value) return 'Vừa xong';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Vừa xong';
  return parsed.toLocaleString('vi-VN');
}

export function categoryBadgeInfo(category) {
  switch (String(category || '').toUpperCase()) {
    case 'LAB_READY':
      return { label: 'Kính sẵn sàng (Lab)', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'APPOINTMENT':
      return { label: 'Lịch đo khám mắt', className: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'ORDER':
      return { label: 'Đơn hàng', className: 'bg-[#e7eeff] text-[#004967] border-[#d8e3fb]' };
    default:
      return { label: 'Cập nhật giao dịch', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function formatChannelBadge(channelName, status, detail) {
  const clean = String(status || '').toUpperCase();
  if (clean === 'DELIVERED') {
    return {
      text: `${channelName}: Đã nhận`,
      className: 'bg-sky-50 text-sky-700 border-sky-200',
      detail: detail || 'Đã lưu hộp thư chủ sở hữu',
    };
  }
  if (clean === 'SENT') {
    return {
      text: `${channelName}: Đã gửi`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      detail: detail || 'Đã gửi qua cổng ngoài',
    };
  }
  if (clean === 'BLOCKED_PROVIDER_UNCONFIGURED') {
    return {
      text: `${channelName}: Blocked (Thiếu cổng ngoài)`,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      detail: detail || 'Chưa cấu hình cổng ngoài',
    };
  }
  if (clean === 'FAILED') {
    return {
      text: `${channelName}: Lỗi gửi ngoài`,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      detail: detail || 'Cổng ngoài từ chối / lỗi mạng',
    };
  }
  return null;
}

export function filterCustomerNotifications(items, filterKey) {
  if (!Array.isArray(items)) return [];
  if (!filterKey || filterKey === 'ALL') return items;
  if (filterKey === 'UNREAD') return items.filter((item) => !item.read);
  return items.filter((item) => String(item.category || '').toUpperCase() === filterKey);
}

export function resolveCustomerActionTab(item) {
  const tab = item?.actionTab;
  if (['orders', 'order-hub', 'booking', 'records', 'warranty'].includes(tab)) {
    return tab === 'order-hub' ? 'orders' : tab;
  }
  const cat = String(item?.category || '').toUpperCase();
  if (cat === 'APPOINTMENT') return 'booking';
  if (cat === 'LAB_READY' || cat === 'ORDER') return 'orders';
  return 'home';
}

export function applyCustomerMarkRead(items, unreadCount, updatedItem) {
  const prevTarget = items.find((item) => item.id === updatedItem.id);
  const nextUnread = prevTarget && !prevTarget.read ? Math.max(0, unreadCount - 1) : unreadCount;
  const nextItems = items.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem, read: true } : item));
  return { items: nextItems, unreadCount: nextUnread };
}
