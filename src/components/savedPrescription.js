export const prescriptionMeasurementFields = ['odSph', 'odCyl', 'odAxis', 'odAdd', 'osSph', 'osCyl', 'osAxis', 'osAdd', 'pd'];

export function savedPrescriptionForm(record, customerId) {
  if (!customerId || !record?.id || String(record.customerId) !== String(customerId)) {
    throw new Error('Không xác minh được toa kính thuộc tài khoản của bạn. Vui lòng tải lại hồ sơ.');
  }
  const values = {};
  for (const key of prescriptionMeasurementFields) {
    const value = record[key];
    if (value == null || String(value).trim() === '' || !Number.isFinite(Number(value))) {
      throw new Error('Toa kính thiếu thông số. Vui lòng liên hệ cửa hàng kiểm tra trước khi sử dụng.');
    }
    values[key] = String(value);
  }
  return { ...values, confirmed: false };
}
