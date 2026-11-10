import React, { useEffect, useRef, useState } from 'react';
import { checkoutApi } from '../api/checkoutApi';
import { checkoutPayload, money } from './purchaseUtils';
import { checkoutClaim } from './checkoutSession';
import './purchase.css';

export default function CheckoutModal({ cart, user, requestRef, onClose, onSuccess }) {
  const [contact, setContact] = useState({ name: user?.fullName || '', phone: user?.phoneNumber || '', address: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceChange, setPriceChange] = useState(null);
  const [acceptPriceChange, setAcceptPriceChange] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [configuration, setConfiguration] = useState(null);
  const [configurationError, setConfigurationError] = useState('');
  const [configurationAttempt, setConfigurationAttempt] = useState(0);
  const localRequest = useRef(null);
  const request = requestRef || localRequest;
  const locked = useRef(false);
  const dialog = useRef(null);
  const rx = cart.find(item => item.prescription)?.prescription;
  useEffect(() => {
    const controller = new AbortController();
    setConfiguration(null); setConfigurationError('');
    checkoutApi.configuration(controller.signal).then(setConfiguration).catch(err => {
      if (!controller.signal.aborted) setConfigurationError(err.message);
    });
    return () => controller.abort();
  }, [configurationAttempt]);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.getElementById('checkout-name')?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);

  useEffect(() => {
    const handleKey = event => {
      if (event.key === 'Escape' && !locked.current) onClose();
      if (event.key !== 'Tab') return;
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setSaving(true); setError('');
    try {
      if (!configuration?.configured) throw new Error('Thanh toán trực tuyến chưa khả dụng. Giỏ hàng của bạn vẫn được giữ.');
      const payload = checkoutPayload(cart, contact, user, paymentMethod);
      if (priceChange && acceptPriceChange) payload.acceptPriceChange = true;
      request.current = checkoutClaim(payload, request.current);
      const order = await checkoutApi.createOrder(payload, request.current.key);
      onSuccess(order);
    } catch (err) {
      setError(err.message);
      if (err.code === 'ORDER_PRICE_CHANGED') { setPriceChange(err.details); setAcceptPriceChange(false); }
    }
    finally { locked.current = false; setSaving(false); }
  }
  return <div className="purchase-overlay"><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="purchase-modal">
    <h2 id="checkout-title">Xác nhận đặt hàng</h2>
    <form onSubmit={submit}><fieldset disabled={saving}>
      <div className="purchase-fields">{[['name', 'Họ tên'], ['phone', 'Số điện thoại'], ['address', 'Địa chỉ nhận hàng']].map(([field, label]) => <label key={field}>{label}<input id={`checkout-${field}`} required autoComplete={{name:'name',phone:'tel',address:'street-address'}[field]} maxLength={field === 'address' ? 500 : field === 'name' ? 120 : 30} type={field === 'phone' ? 'tel' : 'text'} value={contact[field]} onChange={event => setContact({ ...contact, [field]: event.target.value })} /></label>)}</div>
      <div className="purchase-summary">{cart.map(item => <p key={item.sku}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></p>)}<p><span>Tạm tính</span><strong>{money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></p></div>
      {rx && <div className="purchase-rx-summary"><strong>Thông số khách cung cấp</strong><p>OD: SPH {rx.odSph} / CYL {rx.odCyl} / AXIS {rx.odAxis}°</p><p>OS: SPH {rx.osSph} / CYL {rx.osCyl} / AXIS {rx.osAxis}° · PD {rx.pd} mm</p><p>Nhân viên sẽ kiểm tra trước khi xác nhận gia công.</p></div>}
      <fieldset className="checkout-methods"><legend>Phương thức thanh toán</legend>
        <label className={`checkout-method ${paymentMethod === 'VIETQR' ? 'selected' : ''}`}>
          <input type="radio" name="paymentMethod" value="VIETQR" required disabled={!configuration?.configured} checked={paymentMethod === 'VIETQR'} onChange={event => setPaymentMethod(event.target.value)} />
          <span className="sepay-wordmark">SePay</span><span><strong>Chuyển khoản qua SePay</strong><small>Quét QR bằng ứng dụng ngân hàng tại cổng thanh toán.</small></span>
        </label>
        {!configuration && !configurationError && <p role="status" className="purchase-muted">Đang kiểm tra phương thức thanh toán…</p>}
        {configuration && !configuration.configured && <p role="alert" className="purchase-error">Thanh toán trực tuyến tạm chưa khả dụng. Giỏ hàng vẫn được giữ để bạn quay lại sau.</p>}
        {configurationError && <div role="alert" className="purchase-error">Không kiểm tra được phương thức thanh toán. <button type="button" onClick={() => setConfigurationAttempt(value => value + 1)}>Thử lại</button></div>}
      </fieldset>
      <p className="purchase-muted">Tổng tiền được xác nhận lại từ máy chủ khi tạo đơn. Sau đó bạn sẽ được chuyển sang SePay; đơn chỉ được ghi nhận đã thanh toán sau khi nhận xác nhận hợp lệ.</p>
      {priceChange && <div className="purchase-rx-summary"><strong>Tổng tiền cập nhật: {money(priceChange.newTotal)}</strong><label className="purchase-check"><input type="checkbox" required checked={acceptPriceChange} onChange={event => setAcceptPriceChange(event.target.checked)} />Tôi đồng ý với số tiền cập nhật trước khi đặt hàng.</label></div>}
      {error && <p role="alert" className="purchase-error">{error}</p>}
      <div className="purchase-actions"><button type="button" onClick={onClose}>Quay lại giỏ hàng</button><button type="submit" disabled={!configuration?.configured || !paymentMethod} className="purchase-primary">{saving ? 'Đang tạo đơn…' : 'Đặt hàng và thanh toán'}</button></div>
    </fieldset></form>
  </section></div>;
}
