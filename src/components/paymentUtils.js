export const ORDER_LABELS = {
  PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', PENDING_CONFIRMATION: 'Chờ xác nhận đơn',
  CONFIRMED: 'Đã xác nhận đơn', PREPARING: 'Đang chuẩn bị', SHIPPING: 'Đang giao hàng',
  READY_FOR_PICKUP: 'Sẵn sàng nhận tại quầy', COMPLETED: 'Đã hoàn tất', CANCEL_REQUESTED: 'Đã yêu cầu hủy',
  CANCEL_PENDING: 'Đang xử lý hủy', CANCELLED: 'Đã hủy', REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền', LAB_DISPATCH_FAILED: 'Đang xử lý lệnh gia công',
};

export function paymentState(order, payments) {
  if (payments.some(p => p.status === 'REFUNDED') || order.status === 'REFUNDED') return 'REFUNDED';
  if (payments.some(p => p.status === 'REFUND_PENDING') || order.status === 'REFUND_PENDING') return 'REFUND_PENDING';
  if (['CANCELLED', 'CANCEL_PENDING', 'CANCEL_REQUESTED'].includes(order.status)) return 'CANCELLED';
  if (payments.some(p => p.status === 'SUCCESS')) return 'PAID';
  if (order.status !== 'PENDING_PAYMENT') return 'UNCONFIRMED';
  return 'PENDING';
}

export function canPay(order, payments) {
  return order.channel === 'ONLINE' && order.status === 'PENDING_PAYMENT'
    && order.paymentMethod === 'VIETQR' && paymentState(order, payments) === 'PENDING';
}

export const ALLOWED_CHECKOUT_URLS = [
  'https://pay-sandbox.sepay.vn/v1/checkout/init',
  'https://pay.sepay.vn/v1/checkout/init',
];

// Restrict form submission to authorized SePay checkout endpoints, never a return URL parameter.
export function validateCheckoutForm(checkout) {
  if (checkout?.provider !== 'SEPAY' || checkout.httpMethod !== 'POST'
      || !ALLOWED_CHECKOUT_URLS.includes(checkout?.paymentUrl)
      || !checkout.formFields || Array.isArray(checkout.formFields)) {
    throw new Error('Chưa nhận được hướng dẫn thanh toán SePay hợp lệ.');
  }
  const fields = Object.entries(checkout.formFields);
  if (!fields.length || fields.some(([, value]) => typeof value !== 'string')
      || !checkout.formFields.signature || checkout.formFields.payment_method !== 'BANK_TRANSFER') {
    throw new Error('Thông tin thanh toán SePay chưa đầy đủ.');
  }
  return fields;
}

export function submitCheckoutForm(checkout, documentRef = document) {
  const fields = validateCheckoutForm(checkout);
  const form = documentRef.createElement('form');
  form.method = 'POST'; form.action = checkout.paymentUrl; form.hidden = true;
  // Preserve the server's signing order; do not sort or encode the fields again.
  for (const [name, value] of fields) {
    const input = documentRef.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value;
    form.appendChild(input);
  }
  documentRef.body.appendChild(form);
  try { form.submit(); } finally { form.remove(); }
}
