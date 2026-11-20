import React, { useEffect, useRef, useState } from 'react';
import './auth-modal.css';
import { authApi } from '../api/authApi';
import { Eye, EyeOff, Lock, ArrowRight, X, Mail, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otpChallenge, setOtpChallenge] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState('PASSWORD_RESET');
  const [fieldErrors, setFieldErrors] = useState({});

  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const keydown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
      if (!nodes.length) return;
      if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); }
    };
    dialogRef.current?.querySelector('button')?.focus();
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previousFocus?.focus?.(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
    setOtpChallenge(null);
    setOtpCode('');
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setFieldErrors({ email: 'Vui lòng nhập địa chỉ email đã đăng ký để nhận mã OTP!' });
      setErrorMessage('Vui lòng nhập địa chỉ email đã đăng ký để nhận mã OTP!');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: 'Địa chỉ email không đúng định dạng (ví dụ: customer@example.com)!' });
      setErrorMessage('Địa chỉ email không đúng định dạng (ví dụ: customer@example.com)!');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const challenge = await authApi.sendOtp({
        identifier: email.trim(),
        email: email.trim(),
        purpose: 'PASSWORD_RESET',
      });
      setOtpChallenge(challenge);
      const targetDest = challenge.maskedEmail || email.trim();
      setSuccessMessage(`Đã gửi mã xác thực OTP (hiệu lực ${challenge.expiresInSeconds || 300}s) tới email ${targetDest}. Vui lòng kiểm tra hộp thư đến (Inbox / Spam) để lấy mã!`);
    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    if (authMode === 'register') {
      const errors = {};
      if (!fullName.trim()) {
        errors.fullName = 'Vui lòng nhập họ và tên!';
      }
      if (!email.trim()) {
        errors.email = 'Vui lòng nhập địa chỉ email!';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Địa chỉ email không đúng định dạng (ví dụ: customer@example.com)!';
      }
      if (phoneNumber.trim()) {
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber.trim().replace(/\s+/g, ''))) {
          errors.phoneNumber = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)!';
        }
      }
      if (!password) {
        errors.password = 'Vui lòng nhập mật khẩu!';
      } else if (password.length < 6) {
        errors.password = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!';
      }
      if (!confirmPassword) {
        errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu!';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMessage(Object.values(errors)[0]);
        return;
      }

      setLoading(true);
      try {
        await authApi.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
          phoneNumber: phoneNumber.trim() || null
        });

        setSuccessMessage('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        setErrorMessage(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!');
      } finally {
        setLoading(false);
      }
    } else if (authMode === 'otp') {
      if (!otpChallenge?.challengeId) {
        if (!email.trim()) {
          setFieldErrors({ email: 'Vui lòng nhập địa chỉ email để nhận mã OTP!' });
          setErrorMessage('Vui lòng nhập địa chỉ email để nhận mã OTP!');
          return;
        }
        await handleSendOtp();
        return;
      }
      if (!/^\d{6}$/.test(otpCode.trim())) {
        setFieldErrors({ otpCode: 'Vui lòng nhập đúng 6 chữ số mã OTP!' });
        setErrorMessage('Vui lòng nhập đúng 6 chữ số mã OTP!');
        return;
      }
      setLoading(true);
      try {
        if (!password) {
          setFieldErrors({ password: 'Vui lòng nhập mật khẩu mới!' });
          setErrorMessage('Vui lòng nhập mật khẩu mới!');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setFieldErrors({ password: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
          setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự!');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp!' });
          setErrorMessage('Mật khẩu xác nhận không khớp!');
          setLoading(false);
          return;
        }
        await authApi.resetPassword({
          challengeId: otpChallenge.challengeId,
          otpCode: otpCode.trim(),
          newPassword: password,
        });
        setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
        setOtpChallenge(null);
        setOtpCode('');
        setPassword('');
        setConfirmPassword('');
        setAuthMode('login');
      } catch (err) {
        setErrorMessage(err.message || 'Xác thực OTP thất bại. Vui lòng kiểm tra lại!');
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      const errors = {};
      if (!email.trim()) {
        errors.email = 'Vui lòng nhập địa chỉ email!';
      }
      if (!password) {
        errors.password = 'Vui lòng nhập mật khẩu đăng nhập!';
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMessage(Object.values(errors)[0]);
        return;
      }

      setLoading(true);
      try {
        const data = await authApi.login({
          email: email.trim(),
          username: email.trim(),
          password: password
        });

        const userProfile = {
          ...data,
          name: data.fullName || 'Khách Hàng',
          email: data.email,
          phone: data.phoneNumber || '',
          roles: data.roles
        };

        if (onLoginSuccess) {
          onLoginSuccess(userProfile);
        }
        onClose();
      } catch (err) {
        setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202924]/50 backdrop-blur-sm overflow-y-auto">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-heading" className="auth-dialog relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e4e4db] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="px-6 pt-6 pb-4 border-b border-[#eceee7] flex items-center justify-between">
          <span className="auth-wordmark">glassstore<span>.</span></span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#40484e] hover:text-[#202924] hover:bg-[#eceee7] flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Mode Switcher Pill - exactly like Internal Portal */}
          <div className="flex bg-[#f1f2ec] p-1 rounded-xl border border-[#e4e4db]/60 mb-5">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#30483b] text-white shadow-sm'
                  : 'text-[#40484e] hover:text-[#202924]'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#30483b] text-white shadow-sm'
                  : 'text-[#40484e] hover:text-[#202924]'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Form Title & Subtitle */}
          <div className="mb-4">
            <h2 id="auth-heading" className="text-lg font-bold text-[#202924]">
              {authMode === 'login' ? 'Đăng nhập tài khoản' : authMode === 'register' ? 'Tạo tài khoản mới' : 'Khôi phục mật khẩu'}
            </h2>
            <p className="text-xs text-[#40484e] mt-0.5">
              {authMode === 'login' 
                ? 'Đăng nhập để xem đơn hàng, hồ sơ thị lực và ưu đãi.' 
                : authMode === 'register' 
                  ? 'Đăng ký nhanh chóng, kích hoạt ngay không cần OTP.'
                  : 'Nhập địa chỉ email tài khoản để nhận mã xác thực OTP qua Gmail.'}
            </p>
          </div>

          {authMode === 'otp' && <button type="button" className="auth-back" onClick={() => handleModeChange('login')}>← Quay lại đăng nhập</button>}

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <form noValidate onSubmit={handleSubmit} className="auth-form space-y-3.5">
            {/* Full Name (Register only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="auth-fullName" className="block text-xs font-semibold text-[#202924] mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input id="auth-fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full text-xs font-medium bg-white border rounded-xl pl-9 pr-3 py-2 text-[#202924] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.fullName
                        ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                        : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b] focus:border-[#30483b]'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.fullName}
                  </span>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#202924] mb-1">
                {authMode === 'otp' ? 'Địa chỉ Email nhận OTP' : 'Địa chỉ Email'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                <input id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full text-xs font-medium bg-white border rounded-xl pl-9 pr-3 py-2 text-[#202924] placeholder-slate-400 focus:outline-none transition ${
                    fieldErrors.email
                      ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                      : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b] focus:border-[#30483b]'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Phone (Register only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="auth-phoneNumber" className="block text-xs font-semibold text-[#202924] mb-1">
                  Số điện thoại (tùy chọn)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input id="auth-phoneNumber"
                    type="tel"
                    placeholder="0912345678"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                    }}
                    className={`w-full text-xs font-medium bg-white border rounded-xl pl-9 pr-3 py-2 text-[#202924] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.phoneNumber
                        ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                        : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b] focus:border-[#30483b]'
                    }`}
                  />
                </div>
                {fieldErrors.phoneNumber && (
                  <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.phoneNumber}
                  </span>
                )}
              </div>
            )}

            {/* OTP Panel */}
            {authMode === 'otp' && (
              <div className="space-y-3 p-3 bg-[#f1f2ec] rounded-xl border border-[#e4e4db]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#30483b]">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>Xác thực qua Email (Gmail)</span>
                  </div>
                  {otpChallenge && <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#30483b] text-white hover:bg-[#253c33] transition cursor-pointer disabled:opacity-50"
                  >
                    Gửi lại mã OTP
                  </button>}
                </div>
                {otpChallenge && (
                  <div>
                    <label htmlFor="auth-otpCode" className="block text-xs font-semibold text-[#202924] mb-1">
                      Mã OTP ({otpChallenge.maskedEmail || email.trim()}) <span className="text-red-500">*</span>
                    </label>
                    <input id="auth-otpCode"
                      type="text"
                      maxLength={6}
                      placeholder="Nhập 6 số OTP từ Email"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        if (fieldErrors.otpCode) setFieldErrors(prev => ({ ...prev, otpCode: '' }));
                      }}
                      className={`w-full text-xs font-mono text-center tracking-widest bg-white border rounded-lg py-2 text-[#202924] focus:outline-none transition ${
                        fieldErrors.otpCode
                          ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                          : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b]'
                      }`}
                    />
                    {fieldErrors.otpCode && (
                      <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.otpCode}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Password Field */}
            {(authMode !== 'otp' || (otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-[#202924] mb-1">
                  {authMode === 'otp' ? 'Mật khẩu mới' : 'Mật khẩu'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`w-full text-xs font-medium bg-white border rounded-xl pl-9 pr-9 py-2 text-[#202924] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.password
                        ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                        : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b] focus:border-[#30483b]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3 top-2.5 text-[#40484e] hover:text-[#202924] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            )}

            {/* Confirm Password */}
            {(authMode === 'register' || (authMode === 'otp' && otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
              <div>
                <label htmlFor="auth-confirmPassword" className="block text-xs font-semibold text-[#202924] mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input id="auth-confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`w-full text-xs font-medium bg-white border rounded-xl pl-9 pr-9 py-2 text-[#202924] placeholder-slate-400 focus:outline-none transition ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500 bg-red-50/15 focus:ring-2 focus:ring-red-400 focus:border-red-500'
                        : 'border-[#e4e4db] focus:ring-2 focus:ring-[#30483b] focus:border-[#30483b]'
                    }`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="text-red-500 text-[11px] font-normal flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>
            )}

            {authMode === 'login' && <div className="auth-forgot"><button type="button" onClick={() => handleModeChange('otp')}>Quên mật khẩu?</button></div>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[#30483b] hover:bg-[#253c33] disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <span>Đang xử lý…</span>
              ) : (
                <>
                  <span>
                    {authMode === 'login'
                      ? 'Đăng Nhập'
                      : authMode === 'register'
                        ? 'Đăng Ký Tài Khoản'
                        : otpChallenge
                          ? 'Xác Nhận Đổi Mật Khẩu'
                          : 'Nhận Mã Xác Thực OTP'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">Chăm sóc ánh nhìn, đồng hành cùng bạn.</div>
        </div>
      </div>
    </div>
  );
}
