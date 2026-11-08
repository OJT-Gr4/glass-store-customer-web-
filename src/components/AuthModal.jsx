import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, ArrowRight, X, Mail, User, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
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
      setSuccessMessage(`Đã gửi mã OTP (hiệu lực ${challenge.expiresInSeconds || 300}s) tới SĐT ${challenge.maskedPhone}.`);
    } catch (err) {
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra cấu hình cổng SMS hoặc thông tin tài khoản.');
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
        const res = await authApi.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
          phoneNumber: phoneNumber.trim() || null
        });

        setSuccessMessage('Đăng ký tài khoản thành công! Tài khoản của bạn đã được kích hoạt (ACTIVE). Bạn có thể đăng nhập ngay.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column: Clinical & Brand Showcase */}
          <div className="lg:col-span-5 bg-[#063c59] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background decorative circles */}
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border border-sky-400/20 pointer-events-none" />
            <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full border border-sky-400/10 pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Pill tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0d547a] text-sky-200 border border-sky-400/30">
                <Eye className="w-3.5 h-3.5 text-sky-300" />
                <span>OPTIVISION RETAIL & EYECARE</span>
              </div>

              {/* Title & subtitle */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
                  Hệ Thống Mắt Kính <br />
                  <span className="text-[#38bdf8]">Đa Kênh Chuẩn Y Khoa</span>
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Lưu trữ đơn kính khúc xạ số, theo dõi tiến độ gia công xưởng Lab và đồng bộ quyền lợi thành viên trực tuyến.
                </p>
              </div>

              {/* Electronic Prescription Card */}
              <div className="bg-[#08486b] rounded-2xl p-4 border border-sky-400/25 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-sky-400/20 text-xs font-bold text-sky-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Hồ Sơ Thị Lực Số (OD / OS)
                  </span>
                  <span className="text-[10px] text-sky-300">ISO 29148</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-[#063c59] p-2 rounded-lg">
                    <div className="text-[10px] text-sky-300">OD (Phải)</div>
                    <div className="font-bold text-white mt-0.5">-2.25 D</div>
                  </div>
                  <div className="bg-[#063c59] p-2 rounded-lg">
                    <div className="text-[10px] text-sky-300">OS (Trái)</div>
                    <div className="font-bold text-white mt-0.5">-1.75 D</div>
                  </div>
                  <div className="bg-[#063c59] p-2 rounded-lg">
                    <div className="text-[10px] text-sky-300">Loạn (CYL)</div>
                    <div className="font-bold text-white mt-0.5">-0.50</div>
                  </div>
                  <div className="bg-[#063c59] p-2 rounded-lg">
                    <div className="text-[10px] text-sky-300">PD (Đồng tử)</div>
                    <div className="font-bold text-white mt-0.5">63 mm</div>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-sky-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Xác thực mật khẩu an toàn chuẩn mã hóa BCrypt</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-sky-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kích hoạt tài khoản ngay tức thì (ACTIVE) không cần OTP</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-sky-100">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tự động bảo vệ chống Brute Force sau 5 lần nhập sai</span>
                </div>
              </div>
            </div>

            {/* Bottom brand note */}
            <div className="relative z-10 pt-6 text-[11px] text-sky-300/80 border-t border-sky-400/20">
              Bảo mật đa lớp theo tiêu chuẩn Y Tế & Bán Lẻ Hiện Đại
            </div>
          </div>

          {/* Right Column: Clean Authentication Form (No OTP) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Tab selector */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex gap-6">
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className={`text-sm font-extrabold pb-3 -mb-3 transition border-b-2 ${
                      authMode === 'login'
                        ? 'text-[#063c59] border-[#063c59]'
                        : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className={`text-sm font-extrabold pb-3 -mb-3 transition border-b-2 ${
                      authMode === 'register'
                        ? 'text-[#063c59] border-[#063c59]'
                        : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    Đăng Ký Tài Khoản
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('otp')}
                    className={`text-sm font-extrabold pb-3 -mb-3 transition border-b-2 ${
                      authMode === 'otp'
                        ? 'text-[#063c59] border-[#063c59]'
                        : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    OTP & Quên Mật Khẩu
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="mt-6 mb-5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {authMode === 'login' ? 'Chào mừng quý khách trở lại' : 'Tạo tài khoản khách hàng mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {authMode === 'login'
                    ? 'Đăng nhập bằng email và mật khẩu để quản lý đơn kính và ưu đãi thành viên.'
                    : 'Đăng ký nhanh chóng bằng email và mật khẩu, kích hoạt ngay lập tức.'}
                </p>
              </div>

              {/* Alert Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name (Register only) */}
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên khách hàng <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#063c59] focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#063c59] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Phone Number (Optional for Register / OTP) */}
                {(authMode === 'register' || authMode === 'otp') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {authMode === 'otp' ? 'Số điện thoại nhận OTP' : 'Số điện thoại (tùy chọn)'}
                    </label>
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#063c59] focus:bg-white transition"
                    />
                  </div>
                )}

                {authMode === 'otp' && (
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={otpPurpose}
                        onChange={(e) => { setOtpPurpose(e.target.value); setOtpChallenge(null); }}
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
                      >
                        <option value="PASSWORD_RESET">Đặt lại mật khẩu qua OTP</option>
                        <option value="PHONE_VERIFICATION">Xác thực số điện thoại</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-[#063c59] text-white hover:bg-[#08486b]"
                      >
                        {otpChallenge ? 'Gửi lại OTP' : 'Nhận mã OTP'}
                      </button>
                    </div>
                    {otpChallenge && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mã OTP 6 chữ số (gửi tới {otpChallenge.maskedPhone}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Nhập 6 chữ số OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full text-xs font-mono tracking-widest bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Password Field */}
                {(authMode !== 'otp' || (otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {authMode === 'otp' ? 'Mật khẩu mới' : 'Mật khẩu'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-slate-800 focus:outline-none focus:border-[#063c59] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                )}

                {/* Confirm Password (Register or Password Reset) */}
                {(authMode === 'register' || (authMode === 'otp' && otpChallenge && otpPurpose === 'PASSWORD_RESET')) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#063c59] focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#063c59] hover:bg-[#08486b] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-[#063c59]/20 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  {loading ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Đăng Nhập Khách Hàng' : 'Đăng Ký Tài Khoản'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom info */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-6">
              <span>Hệ thống bảo mật OptiVision Store</span>
              <span className="font-medium text-[#063c59]">Không yêu cầu mã OTP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
