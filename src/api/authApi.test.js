import test from 'node:test';
import assert from 'node:assert/strict';
import { authApi } from './authApi.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const profile = { id: 10, fullName: 'Customer', roles: ['ROLE_CUSTOMER'], token: 'header.payload.signature' };

test('login stores only a confirmed customer session and preserves the entered password', async () => {
  memory.clear();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/login');
    assert.equal(JSON.parse(options.body).password, ' password ');
    return response({ code: 200, data: profile });
  };
  assert.equal((await authApi.login({ email: 'customer@example.test', password: ' password ' })).id, 10);
  assert.equal(authApi.getToken(), profile.token);
});

test('malformed success, wrong role and failed login cannot retain the previous session', async () => {
  for (const data of [null, { token: 'fake' }, { ...profile, roles: ['ROLE_ADMIN'] }]) {
    memory.set('optivision_customer_token', profile.token);
    globalThis.fetch = async () => response({ code: 200, data });
    await assert.rejects(authApi.login({ email: 'x', password: 'x' }));
    assert.equal(authApi.getToken(), null);
  }
  globalThis.fetch = async () => response({ message: 'Wrong credentials' }, 401);
  await assert.rejects(authApi.login({}), /Wrong credentials/);
});

test('session restoration verifies the bearer token and clears unauthorized cached identity', async () => {
  memory.set('optivision_customer_token', profile.token);
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, `Bearer ${profile.token}`);
    return response({ code: 200, data: profile });
  };
  assert.equal((await authApi.getMe()).name, 'Customer');
  globalThis.fetch = async () => response({ message: 'Token expired' }, 401);
  await assert.rejects(authApi.getMe(), /Token expired/);
  assert.equal(authApi.getCurrentUser(), null);
});

test('registration requires a persisted ID and reports duplicate email without a false success', async () => {
  globalThis.fetch = async () => response({ code: 200, data: null }, 201);
  await assert.rejects(authApi.register({}), /chưa xác nhận/);
  globalThis.fetch = async () => response({ message: 'Duplicate email' }, 409);
  await assert.rejects(authApi.register({}), /Duplicate email/);
});

test('OTP send, phone verify and password reset require server-confirmed challenge and clear session on reset', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/otp/send');
    const body = JSON.parse(options.body);
    assert.equal(body.purpose, 'PASSWORD_RESET');
    return response({ code: 200, data: { challengeId: 'chg-1', maskedPhone: '******6789', expiresInSeconds: 300 } });
  };
  const chg = await authApi.sendOtp({ identifier: 'customer@example.test', purpose: 'PASSWORD_RESET' });
  assert.equal(chg.challengeId, 'chg-1');
  assert.equal(chg.maskedPhone, '******6789');

  memory.set('optivision_customer_token', profile.token);
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/v1/auth/password/reset');
    return response({ code: 200, data: { verified: true, purpose: 'PASSWORD_RESET' } });
  };
  const res = await authApi.resetPassword({ challengeId: 'chg-1', otpCode: '123456', newPassword: 'NewPassword123!' });
  assert.equal(res.verified, true);
  assert.equal(authApi.getToken(), null);
});
