import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Check, AlertCircle, Loader2, Award, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { authApi } from '../api/authApi';
import { compressImageToDataUrl, DEFAULT_AVATAR_URL, isValidImageInput } from './imageUploadUtils';

export default function CustomerProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Nam');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || currentUser.name || '');
      setPhone(currentUser.phoneNumber || currentUser.phone || '');
      setEmail(currentUser.email || '');
      setAddress(currentUser.address || '');
      setGender(currentUser.gender || 'Nam');
      setAvatarUrl(currentUser.avatarUrl || DEFAULT_AVATAR_URL);
      setError('');
      setSuccess('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressImageToDataUrl(file, 256, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      setError(err.message || 'Không thể xử lý ảnh đại diện đã chọn.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!phone.trim() || !/^0\d{8,10}$/.test(phone.trim())) {
      setError('Vui lòng nhập số điện thoại hợp lệ (9–11 chữ số, bắt đầu bằng số 0).');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Địa chỉ email không đúng định dạng.');
      return;
    }
    if (avatarUrl.trim() && !isValidImageInput(avatarUrl)) {
      setError('Link ảnh đại diện phải là http(s)://... hoặc ảnh tải lên hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        gender: gender || 'Nam',
        avatarUrl: avatarUrl.trim() || DEFAULT_AVATAR_URL
      };

      const updated = await authApi.updateProfile(currentUser.id, payload);
      setSuccess('Cập nhật thông tin tài khoản thành công!');
      if (onProfileUpdated) onProfileUpdated(updated);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Không thể lưu thông tin. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const previewAvatar = avatarUrl?.trim() || DEFAULT_AVATAR_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e7eeff] text-[#086288] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Hồ Sơ Tài Khoản</h2>
              <p className="text-xs text-slate-500">Quản lý ảnh đại diện, thông tin cá nhân &amp; địa chỉ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Tier Card */}
        <div className="p-4 bg-gradient-to-r from-[#004967] to-[#086288] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={previewAvatar}
              alt={fullName || 'Avatar'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#8bcef9] bg-white shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#cae6ff] tracking-wider block">Hạng Thành Viên</span>
              <div className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5 truncate">
                <Award className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="truncate">{currentUser.membershipTier || 'Thành Viên'}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-[#cae6ff] block">Mã khách hàng</span>
            <span className="font-mono text-xs font-bold">CUS-{String(currentUser.id).padStart(5, '0')}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar URL + File Upload */}
          <div className="p-3 rounded-xl bg-[#f8fbff] border border-[#dceafa] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#086288]" />
                <span>Ảnh đại diện (Link ảnh hoặc tải từ máy)</span>
              </label>
              <button
                type="button"
                onClick={() => setAvatarUrl(DEFAULT_AVATAR_URL)}
                className="text-[11px] font-semibold text-[#086288] hover:text-[#004967] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Mặc định
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={avatarUrl.startsWith('data:image/') ? '' : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={avatarUrl.startsWith('data:image/') ? 'Đã tải ảnh từ thiết bị (hoặc dán link URL mới)' : 'https://...'}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#086288]"
              />
              <label className="px-3 py-2 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-[#086288] focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-[#086288] focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#086288] focus:bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-[#086288] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Địa chỉ giao hàng mặc định
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, TP..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 outline-none focus:border-[#086288] focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
