import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import {
  applyCustomerMarkRead,
  categoryBadgeInfo,
  filterCustomerNotifications,
  formatChannelBadge,
  formatNotificationDate,
  normalizePollIntervalMs,
  resolveCustomerActionTab,
} from './customerNotificationUtils';

export default function NotificationCenterPage({
  setActiveTab,
  currentUser,
  openAuth,
  pollIntervalSeconds: initialPollSeconds = 15,
  onUnreadChange,
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pollSeconds, setPollSeconds] = useState(initialPollSeconds || 15);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const activeUserRef = useRef(currentUser?.id || null);
  activeUserRef.current = currentUser?.id || null;

  const loadInbox = useCallback(async (silent = false) => {
    const uid = activeUserRef.current;
    if (!uid) {
      setNotifications([]);
      setUnreadCount(0);
      setErrorMessage('');
      return;
    }
    if (!silent) setLoading(true);
    setErrorMessage('');
    try {
      const inbox = await notificationApi.getInbox();
      if (activeUserRef.current !== uid) return;
      const items = inbox.items || [];
      const nextUnread = Number(inbox.unreadCount) || 0;
      const nextPoll = Number(inbox.pollIntervalSeconds) || 15;
      setNotifications(items);
      setUnreadCount(nextUnread);
      setPollSeconds(nextPoll);
      onUnreadChange?.(nextUnread, nextPoll);
    } catch (error) {
      if (activeUserRef.current === uid) {
        setErrorMessage(error.message || 'Không thể tải hộp thư thông báo từ máy chủ.');
      }
    } finally {
      if (!silent && activeUserRef.current === uid) {
        setLoading(false);
      }
    }
  }, [onUnreadChange]);

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    setErrorMessage('');
    if (!currentUser?.id) return undefined;

    loadInbox(false);
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        loadInbox(true);
      }
    }, normalizePollIntervalMs(pollSeconds));

    return () => clearInterval(intervalId);
  }, [currentUser?.id, pollSeconds, loadInbox]);

  const handleMarkAsRead = async (item) => {
    if (!item?.id || item.read) return;
    setBusyId(item.id);
    setErrorMessage('');
    try {
      const updated = await notificationApi.markAsRead(item.id);
      const next = applyCustomerMarkRead(notifications, unreadCount, updated);
      setNotifications(next.items);
      setUnreadCount(next.unreadCount);
      onUnreadChange?.(next.unreadCount, pollSeconds);
    } catch (error) {
      setErrorMessage(error.message || 'Không thể đánh dấu đã đọc.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setErrorMessage('');
    try {
      const res = await notificationApi.markAllAsRead();
      const nowIso = new Date().toISOString();
      const nextUnread = Number(res.unreadCount ?? 0);
      setNotifications((prev) => prev.map((row) => ({ ...row, read: true, readAt: row.readAt || nowIso })));
      setUnreadCount(nextUnread);
      onUnreadChange?.(nextUnread, pollSeconds);
    } catch (error) {
      setErrorMessage(error.message || 'Không thể đánh dấu tất cả là đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenTarget = async (item) => {
    if (!item.read) {
      await handleMarkAsRead(item);
    }
    setActiveTab(resolveCustomerActionTab(item));
  };

  const filtered = filterCustomerNotifications(notifications, selectedFilter);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <Bell className="w-3 h-3 text-[#086288]" />
            Hộp thư chủ sở hữu · Đồng bộ Polling {pollSeconds}s
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Trung Tâm Thông Báo Giao Dịch
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Theo dõi trạng thái kính sẵn sàng từ Xưởng Lab, đơn hàng và lịch hẹn đo mắt lưu trực tiếp theo tài khoản của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser && unreadCount > 0 && (
            <span
              data-testid="notification-center-unread-pill"
              className="bg-[#e7eeff] text-[#004967] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#dee8ff] flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              {unreadCount} chưa đọc
            </span>
          )}
          {currentUser && (
            <>
              <button
                type="button"
                onClick={() => loadInbox(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dee8ff] bg-white hover:bg-[#f0f3ff] text-[#004967] text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                disabled={markingAll || unreadCount === 0}
                onClick={handleMarkAllRead}
                data-testid="customer-mark-all-read"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{markingAll ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Filter Bar */}
      {currentUser && (
        <div className="flex flex-wrap bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 text-xs w-fit gap-1">
          {[
            { id: 'ALL', label: `Tất cả (${notifications.length})` },
            { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
            { id: 'LAB_READY', label: 'Kính sẵn sàng (Lab)' },
            { id: 'ORDER', label: 'Đơn hàng' },
            { id: 'APPOINTMENT', label: 'Lịch đo khám mắt' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#086288] text-white font-bold shadow-xs'
                  : 'text-[#40484e] hover:text-[#111c2d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Notifications Body */}
      {!currentUser ? (
        <div className="py-16 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff] p-8 space-y-3">
          <Bell className="w-8 h-8 text-[#086288] mx-auto opacity-70" />
          <p className="font-bold text-sm text-[#111c2d]">Đăng nhập để xem thông báo giao dịch cá nhân</p>
          <p>Thông báo được bảo vệ nghiêm ngặt theo chủ sở hữu tài khoản.</p>
          {openAuth && (
            <button
              type="button"
              onClick={openAuth}
              className="px-4 py-2 rounded-xl bg-[#086288] hover:bg-[#004967] text-white text-xs font-bold cursor-pointer"
            >
              Đăng Nhập Ngay
            </button>
          )}
        </div>
      ) : loading && notifications.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#40484e]">
          Đang tải thông báo đã lưu từ máy chủ…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff] p-8 space-y-2">
          <Bell className="w-8 h-8 text-[#40484e] mx-auto opacity-40" />
          <p className="font-semibold text-[#111c2d]">
            {selectedFilter === 'UNREAD' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo giao dịch nào'}
          </p>
          <p>Thông báo kính sẵn sàng, đơn hàng và lịch đo mắt mới sẽ tự động hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cat = categoryBadgeInfo(item.category);
            const inAppBadge = formatChannelBadge('In-App', item.inAppStatus, 'Đã lưu hộp thư');
            const smsBadge = formatChannelBadge('SMS', item.smsStatus, item.smsDetail);
            const emailBadge = formatChannelBadge('Email', item.emailStatus, item.emailDetail);

            return (
              <div
                key={item.id}
                data-testid={`customer-notif-card-${item.id}`}
                data-read={String(Boolean(item.read))}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xs ${
                  item.read ? 'bg-white border-[#dee8ff]' : 'bg-[#f4f9ff] border-[#086288]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.read ? 'bg-[#f0f3ff] text-[#40484e]' : 'bg-[#086288] text-white'
                    }`}
                  >
                    {item.category === 'LAB_READY' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : item.category === 'APPOINTMENT' ? (
                      <Calendar className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.className}`}>
                        {cat.label}
                      </span>
                      {item.referenceCode && (
                        <span className="text-[10px] font-mono font-bold text-[#004967] bg-[#e7eeff] px-2 py-0.5 rounded">
                          {item.referenceCode}
                        </span>
                      )}
                      {!item.read ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Chưa đọc
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#40484e] bg-slate-100 px-2 py-0.5 rounded-full">
                          Đã đọc {item.readAt ? `· ${formatNotificationDate(item.readAt)}` : ''}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-[#111c2d]">{item.title}</h3>
                    <p className="text-xs text-[#40484e] leading-relaxed">{item.message}</p>

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {inAppBadge && (
                        <span
                          title={inAppBadge.detail}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${inAppBadge.className}`}
                        >
                          {inAppBadge.text}
                        </span>
                      )}
                      {smsBadge && (
                        <span
                          title={smsBadge.detail}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${smsBadge.className}`}
                        >
                          {smsBadge.text}
                        </span>
                      )}
                      {emailBadge && (
                        <span
                          title={emailBadge.detail}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${emailBadge.className}`}
                        >
                          {emailBadge.text}
                        </span>
                      )}
                      <span className="text-[10px] text-[#40484e] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#086288]" />
                        {formatNotificationDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.read && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleMarkAsRead(item)}
                      data-testid={`mark-read-btn-${item.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#086288] text-[#086288] hover:bg-[#e7eeff] text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{busyId === item.id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenTarget(item)}
                    className="px-3 py-1.5 rounded-lg bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
