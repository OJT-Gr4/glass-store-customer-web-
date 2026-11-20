export function voucherAvailability(voucher, now = Date.now()) {
  if (!voucher || voucher.active !== true) return false;
  const from = voucher.validFrom || voucher.startsAt;
  const until = voucher.validTo || voucher.expiresAt;
  if ((from && (!Number.isFinite(Date.parse(from)) || Date.parse(from) > now)) ||
      (until && (!Number.isFinite(Date.parse(until)) || Date.parse(until) < now))) return false;
  if (voucher.usageLimit != null && Number(voucher.usedCount || 0) >= Number(voucher.usageLimit)) return false;
  return !voucher.channel || ['ALL', 'ONLINE'].includes(voucher.channel);
}

export function voucherDisplay(voucher) {
  const type = voucher.discountType || voucher.type;
  const amount = Number(voucher.discountValue ?? voucher.amount ?? 0);
  const minimum = Number(voucher.minOrderAmount ?? voucher.minimumAmount ?? 0);
  const until = voucher.validTo || voucher.expiresAt;
  return {
    id: voucher.id, code: voucher.code, title: voucher.name || voucher.code,
    badge: ({ NONE: 'Không yêu cầu hạng', SILVER: 'Hạng Bạc', GOLD: 'Hạng Vàng', DIAMOND: 'Hạng Kim Cương' })[voucher.requiredTier || 'NONE'] + ' · 1 lượt', category: 'all',
    desc: `Giảm ${type === 'PERCENT' ? `${amount}%` : `${Math.min(amount,5000000).toLocaleString('vi-VN')} đ`}${minimum ? ` cho đơn từ ${minimum.toLocaleString('vi-VN')} đ` : ''}. Tối đa ${Math.min(Number(voucher.maxDiscountAmount ?? voucher.maximumDiscount ?? 5000000),5000000).toLocaleString('vi-VN')} đ. Điều kiện được xác nhận khi thanh toán.`,
    expiry: until ? `HSD: ${new Date(until).toLocaleDateString('vi-VN')}` : 'Còn hiệu lực',
  };
}

// The API has already scoped these vouchers to the authenticated customer's grants/tier.
export function checkoutVoucherOptions(vouchers, total, now = Date.now()) {
  return vouchers.filter(v => voucherAvailability(v, now)).map(voucher => {
    const minimum = Number(voucher.minOrderAmount ?? voucher.minimumAmount ?? 0);
    const amount = Number(voucher.discountValue ?? voucher.amount ?? 0);
    const percent = (voucher.discountType || voucher.type) === 'PERCENT';
    const cap = voucher.maxDiscountAmount ?? voucher.maximumDiscount;
    let discount = percent ? total * amount / 100 : amount;
    if (percent && cap != null) discount = Math.min(discount, Number(cap));
    discount = Math.max(0, Math.min(total, discount, 5000000));
    const eligible = total >= minimum;
    const format = value => Number(value).toLocaleString('vi-VN') + ' ₫';
    return {
      ...voucher, eligible, estimatedDiscount: discount,
      label: `${voucher.code} · ${eligible ? `Giảm ${format(discount)}` : `Đơn từ ${format(minimum)}`}`,
    };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.estimatedDiscount - a.estimatedDiscount);
}
