export const orderStatusLabels = {
  PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị', IN_LAB: 'Đang gia công', QC_PASSED: 'Đã đạt kiểm định',
  READY_FOR_PICKUP: 'Sẵn sàng nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất', CANCEL_REQUESTED: 'Đã yêu cầu hủy', CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Chờ hoàn tiền', REFUNDED: 'Đã hoàn tiền',
  LAB_DISPATCH_FAILED: 'Chờ xử lý chuyển Lab', PENDING_CONFIRMATION: 'Chờ xác nhận', CANCEL_PENDING: 'Đang xử lý hủy',
};

export const canRequestCancellation = order => order?.channel === 'ONLINE'
  && ['PENDING_PAYMENT', 'PAID', 'LAB_DISPATCH_FAILED', 'PENDING_CONFIRMATION', 'CONFIRMED'].includes(order.status);

export const orderDate = value => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString('vi-VN') : 'Chưa cập nhật';
};

export function orderRoute(hash) {
  const match = /^#orders(?:\/(\d+))?$/.exec(hash || '');
  if (!match) return null;
  const id = match[1] ? Number(match[1]) : null;
  if (id != null && (!Number.isSafeInteger(id) || id <= 0)) return null;
  return { tab: id ? 'order-hub' : 'orders', id };
}
