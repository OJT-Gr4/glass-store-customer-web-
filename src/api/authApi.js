const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'optivision_customer_token';
const USER_KEY = 'optivision_customer_user';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/${path}`, options);
  const envelope = await response.json().catch(() => null);
  if (!response.ok || !envelope || (envelope.code != null && envelope.code >= 400)) {
    const error = new Error(envelope?.message || 'Không thể xác thực với máy chủ. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }
  return envelope.data;
}

function customerProfile(data) {
  if (!data?.id || !Array.isArray(data.roles) || !data.roles.some(role => role === 'ROLE_CUSTOMER' || role === 'CUSTOMER'))
    throw new Error('Tài khoản không có quyền truy cập cổng khách hàng.');
  return { ...data, name: data.fullName || data.username, phone: data.phoneNumber || '' };
}

export const authApi = {
  async login(credentials) {
    authApi.logout();
    const payload = typeof credentials === 'object' && credentials !== null ? {
      ...credentials,
      username: credentials.username || credentials.email,
      email: credentials.email || credentials.username,
    } : credentials;
    const data = await request('login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!data?.token || data.token.split('.').length !== 3)
      throw new Error('Máy chủ không trả về phiên đăng nhập hợp lệ.');
    const profile = customerProfile(data);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return profile;
  },

  async register(customerData) {
    const data = await request('register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerData),
    });
    if (!data?.id) throw new Error('Máy chủ chưa xác nhận tạo tài khoản.');
    return data;
  },

  async sendOtp(payload) {
    const data = await request('otp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!data?.challengeId) throw new Error('Máy chủ chưa khởi tạo được phiên xác thực OTP.');
    return data;
  },

  async verifyPhoneOtp(payload) {
    const data = await request('otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!data?.verified) throw new Error('Xác thực OTP chưa thành công.');
    return data;
  },

  async resetPassword(payload) {
    const data = await request('password/reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!data?.verified) throw new Error('Đặt lại mật khẩu chưa thành công.');
    authApi.logout();
    return data;
  },

  async getMe() {
    const token = authApi.getToken();
    if (!token || token.split('.').length !== 3) { authApi.logout(); return null; }
    try {
      const profile = customerProfile(await request('me', { headers: { Authorization: `Bearer ${token}` } }));
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (error) {
      if (error.status === 401 || error.status === 403 || !error.status) authApi.logout();
      throw error;
    }
  },

  logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
  getCurrentUser() {
    if (!authApi.getToken()) return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
  getToken() { return localStorage.getItem(TOKEN_KEY); },
};
