import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpChallenge(null);
    setOtpCode('');
  };

  const handleSendOtp = async () => {
    if (!email.trim() && !phoneNumber.trim()) {
      setErrorMessage('Vui lòng nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP!');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const challenge = await authApi.sendOtp({
        identifier: email.trim() || phoneNumber.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        purpose: otpPurpose,
      });
      setOtpChallenge(challenge);
      setSuccessMessage(`Đã gửi mã OTP (hiệu lực ${challenge.expiresInSeconds || 300}s) tới SĐT ${challenge.maskedPhone}. (Môi trường test: Xem mã OTP trong log identity-service)`);
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

    if (authMode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên!');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ email!');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp!');
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
        await handleSendOtp();
        return;
      }
      if (!/^\d{6}$/.test(otpCode.trim())) {
        setErrorMessage('Vui lòng nhập đúng 6 chữ số mã OTP!');
        return;
      }
      setLoading(true);
      try {
        if (otpPurpose === 'PHONE_VERIFICATION') {
          await authApi.verifyPhoneOtp({
            challengeId: otpChallenge.challengeId,
            otpCode: otpCode.trim(),
          });
          setSuccessMessage('Xác thực số điện thoại thành công!');
        } else {
          if (password.length < 6) {
            setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự!');
            setLoading(false);
            return;
          }
          if (password !== confirmPassword) {
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
        }
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
      if (!email.trim() || !password) {
        setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111c2d]/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#dee8ff] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="px-6 pt-6 pb-4 border-b border-[#e7eeff] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#086288] flex items-center justify-center text-white shadow-sm">
              <Eye className="w-4 h-4 text-[#cae6ff]" />
            </div>
            <div>
              <span className="text-base text-[#004967] font-bold block leading-tight">OptiVision</span>
              <span className="text-[10px] text-[#19648f] tracking-wider uppercase block font-semibold">Tài Khoản Khách Hàng</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#40484e] hover:text-[#111c2d] hover:bg-[#e7eeff] flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Mode Switcher Pill - exactly like Internal Portal */}
          <div className="flex bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 mb-5">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#086288] text-white shadow-sm'
                  : 'text-[#40484e] hover:text-[#111c2d]'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#086288] text-white shadow-sm'
                  : 'text-[#40484e] hover:text-[#111c2d]'
              }`}
            >
              Đăng Ký
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('otp')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-[#086288] text-white shadow-sm'
                  : 'text-[#40484e] hover:text-[#111c2d]'
              }`}
            >
              Quên MK
            </button>
          </div>

          {/* Form Title & Subtitle */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#111c2d]">
              {authMode === 'login' ? 'Đăng nhập tài khoản' : authMode === 'register' ? 'Tạo tài khoản mới' : 'Khôi phục mật khẩu'}
            </h2>
            <p className="text-xs text-[#40484e] mt-0.5">
              {authMode === 'login' 
                ? 'Đăng nhập để xem đơn hàng, hồ sơ thị lực và ưu đãi.' 
                : authMode === 'register' 
                  ? 'Đăng ký nhanh chóng, kích hoạt ngay không cần OTP.'
                  : 'Nhập email hoặc SĐT để nhận mã xác thực đặt lại mật khẩu.'}
            </p>
          </div>

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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name (Register only) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full text-xs font-medium bg-white border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#086288] focus:border-[#086288] transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs font-medium bg-white border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#086288] focus:border-[#086288] transition"
                />
              </div>
            </div>

            {/* Phone (Optional for Register / OTP) */}
            {(authMode === 'register' || authMode === 'otp') && (
              <div>
                <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                  {authMode === 'otp' ? 'Số điện thoại nhận OTP' : 'Số điện thoại (tùy chọn)'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-[#dee8ff] rounded-xl pl-9 pr-3 py-2 text-[#111c2d] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#086288] focus:border-[#086288] transition"
                  />
                </div>
              </div>
            )}

            {/* OTP Panel */}
            {authMode === 'otp' && (
              <div className="space-y-3 p-3 bg-[#f0f3ff] rounded-xl border border-[#dee8ff]">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={otpPurpose}
                    onChange={(e) => { setOtpPurpose(e.target.value); setOtpChallenge(null); }}
                    className="text-xs font-semibold bg-white border border-[#dee8ff] rounded-lg px-2.5 py-1.5 text-[#111c2d] focus:outline-none"
                  >
                    <option value="PASSWORD_RESET">Đặt lại mật khẩu</option>
                    <option value="PHONE_VERIFICATION">Xác thực SĐT</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#086288] text-white hover:bg-[#004967] transition"
                  >
                    {otpChallenge ? 'Gửi lại OTP' : 'Nhận mã OTP'}
                  </button>
                </div>
                {otpChallenge && (
                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Mã OTP ({otpChallenge.maskedPhone}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Nhập 6 số OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-xs font-mono text-center tracking-widest bg-white border border-[#dee8ff] rounded-lg py-2 text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#086288]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Password Field */}
            {(authMode !== 'otp' || (otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
              <div>
                <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                  {authMode === 'otp' ? 'Mật khẩu mới' : 'Mật khẩu'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-xs font-medium bg-white border border-[#dee8ff] rounded-xl pl-9 pr-9 py-2 text-[#111c2d] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#086288] focus:border-[#086288] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#40484e] hover:text-[#111c2d] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {(authMode === 'register' || (authMode === 'otp' && otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
              <div>
                <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#40484e]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full text-xs font-medium bg-white border border-[#dee8ff] rounded-xl pl-9 pr-9 py-2 text-[#111c2d] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#086288] focus:border-[#086288] transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[#086288] hover:bg-[#004967] disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <span>Đang xử lý…</span>
              ) : (
                <>
                  <span>
                    {authMode === 'login' ? 'Đăng Nhập' : authMode === 'register' ? 'Đăng Ký Tài Khoản' : 'Xác Nhận Đổi Mật Khẩu'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-[#e7eeff] flex items-center justify-between text-[11px] text-[#40484e]">
            <span>Hệ thống OptiVision</span>
            <span className="font-semibold text-[#004967]">Bảo mật BCrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
