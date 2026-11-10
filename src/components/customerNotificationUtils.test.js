import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePollIntervalMs,
  formatChannelBadge,
  filterCustomerNotifications,
  resolveCustomerActionTab,
  applyCustomerMarkRead,
} from './customerNotificationUtils.js';

test('normalizePollIntervalMs clamps between 5s and 120s with 15s default', () => {
  assert.equal(normalizePollIntervalMs(null), 15000);
  assert.equal(normalizePollIntervalMs(2), 5000);
  assert.equal(normalizePollIntervalMs(25), 25000);
  assert.equal(normalizePollIntervalMs(200), 120000);
});

test('formatChannelBadge never marks unconfigured SMS as SENT', () => {
  const inApp = formatChannelBadge('In-App', 'DELIVERED', 'Saved');
  const smsBlocked = formatChannelBadge('SMS', 'BLOCKED_PROVIDER_UNCONFIGURED', 'Missing URL');
  const smsSkipped = formatChannelBadge('SMS', 'SKIPPED', 'Off');
  assert.equal(inApp.text, 'In-App: Đã nhận');
  assert.match(smsBlocked.text, /Blocked/);
  assert.equal(smsSkipped, null);
});

test('filterCustomerNotifications filters by UNREAD and category accurately', () => {
  const list = [
    { id: 1, category: 'LAB_READY', read: false },
    { id: 2, category: 'APPOINTMENT', read: true },
    { id: 3, category: 'ORDER', read: false },
  ];
  assert.equal(filterCustomerNotifications(list, 'ALL').length, 3);
  assert.equal(filterCustomerNotifications(list, 'UNREAD').length, 2);
  assert.equal(filterCustomerNotifications(list, 'LAB_READY').length, 1);
  assert.equal(filterCustomerNotifications(list, 'APPOINTMENT')[0].id, 2);
});

test('resolveCustomerActionTab maps category and actionTab safely', () => {
  assert.equal(resolveCustomerActionTab({ actionTab: 'booking', category: 'APPOINTMENT' }), 'booking');
  assert.equal(resolveCustomerActionTab({ category: 'LAB_READY' }), 'orders');
  assert.equal(resolveCustomerActionTab({ actionTab: 'order-hub', category: 'ORDER' }), 'orders');
});

test('applyCustomerMarkRead decrements unreadCount and keeps item marked read', () => {
  const items = [
    { id: 1, read: false, title: 'Kính sẵn sàng' },
    { id: 2, read: false, title: 'Đơn hàng' },
  ];
  const updated = applyCustomerMarkRead(items, 2, { id: 1, read: true, readAt: '2026-11-10T10:15:00' });
  assert.equal(updated.unreadCount, 1);
  assert.equal(updated.items[0].read, true);
  assert.equal(updated.items[1].read, false);
});
