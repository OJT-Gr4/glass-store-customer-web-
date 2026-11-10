import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Tag, ArrowRight, Settings, Phone, Wrench, Sparkles, Truck, Package 
} from 'lucide-react';
import { customerOrdersApi } from '../api/customerOrdersApi';
import { eyecareApi } from '../api/eyecareApi';
import { warrantyApi } from '../api/warrantyApi';
import { orderDate, orderStatusLabels } from './customerOrderUtils';
import { appointmentDate, appointmentStatus } from './eyecareUtils';

export default function NotificationCenterPage({ setActiveTab, currentUser }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate real notifications from real database tables: Orders, Appointments, Warranties
  useEffect(() => {
    let active = true;
    setLoading(true);

    const promises = [];

    // 1. Orders
    if (currentUser?.id) {
      promises.push(
        customerOrdersApi.list(currentUser.id)
          .then((orders) => {
            if (!Array.isArray(orders)) return [];
            return orders.map((o) => ({
              id: `ORD-${o.id}`,
              type: 'LAB',
              title: `Đơn hàng #${o.orderCode} · ${orderStatusLabels[o.status] || o.status}`,
              desc: `Sản phẩm: ${o.items?.map(i => `${i.productName || i.skuId} (x${i.quantity})`).join(', ') || 'Kính mắt'}. Tổng tiền: ${Number(o.finalAmount).toLocaleString('vi-VN')} đ`,
              time: orderDate(o.createdAt),
              rawDate: new Date(o.createdAt || Date.now()).getTime(),
              isNew: o.status === 'SHIPPING' || o.status === 'PROCESSING' || o.status === 'PENDING',
              actionTab: 'orders'
            }));
          })
          .catch(() => [])
      );

      // 2. Appointments
      promises.push(
        eyecareApi.getAppointments()
          .then((appts) => {
            if (!Array.isArray(appts)) return [];
            return appts.map((a) => ({
              id: `APT-${a.id}`,
              type: 'REMIND',
              title: `Lịch hẹn đo mắt #${a.ticketCode || a.id} · ${appointmentStatus[a.status] || a.status}`,
              desc: `Thời gian hẹn: ${appointmentDate(a.scheduledTime)}. Chi nhánh: ${a.locationCode || 'Chưa chọn'}${a.roomName ? ` · Phòng: ${a.roomName}` : ''}`,
              time: appointmentDate(a.scheduledTime),
              rawDate: new Date(a.scheduledTime || Date.now()).getTime(),
              isNew: a.status === 'WAITING' || a.status === 'CONFIRMED',
              actionTab: 'booking'
            }));
          })
          .catch(() => [])
      );

      // 3. Warranties
      promises.push(
        warrantyApi.getAllWarranties()
          .then((warrs) => {
            if (!Array.isArray(warrs)) return [];
            return warrs.map((w) => ({
              id: `WAR-${w.id || w.warrantyCode}`,
              type: 'WARRANTY',
              title: `Phiếu bảo hành #${w.warrantyCode} · ${w.statusLabel || w.status || 'Hiệu lực'}`,
              desc: `Sản phẩm: ${w.productName}. Chính sách: ${w.policyRef || 'Bảo hành chính hãng 12 tháng'}`,
              time: w.timeLabel || 'Đang hiệu lực',
              rawDate: Date.now() - 3600000,
              isNew: false,
              actionTab: 'warranty'
            }));
          })
          .catch(() => [])
      );
    }

    Promise.all(promises)
      .then((results) => {
        if (!active) return;
        const all = results.flat().sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
        setNotifications(all);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [currentUser?.id]);

  const filtered = notifications.filter((n) => {
    if (selectedFilter === 'ALL') return true;
    return n.type === selectedFilter;
  });

  const unreadCount = notifications.filter(n => n.isNew).length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee8ff]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7eeff] text-[#004967] text-[11px] font-semibold mb-1">
            <Bell className="w-3 h-3 text-[#086288]" />
            Dữ liệu đồng bộ trực tiếp từ CSDL đơn hàng &amp; phòng khám
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111c2d] tracking-tight">
            Trung Tâm Thông Báo &amp; Tiến Độ Hệ Thống
          </h1>
          <p className="text-xs text-[#40484e] mt-0.5">
            Cập nhật tự động tiến độ gia công mài lắp kính tại xưởng Lab, lịch khám khúc xạ và phiếu bảo hành.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="bg-[#e7eeff] text-[#004967] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#dee8ff] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#086288] animate-pulse"></span>
              {unreadCount} cập nhật mới
            </span>
          )}
        </div>
      </div>

      {/* 2. Filter switcher pill */}
      <div className="flex bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]/60 text-xs w-fit">
        {[
          { id: 'ALL', label: `Tất cả (${notifications.length})` },
          { id: 'LAB', label: 'Đơn hàng & Lab' },
          { id: 'REMIND', label: 'Lịch đo khám mắt' },
          { id: 'WARRANTY', label: 'Bảo hành' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              selectedFilter === tab.id
                ? 'bg-[#086288] text-white font-bold shadow-xs'
                : 'text-[#40484e] hover:text-[#111c2d]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#40484e]">
          Đang tổng hợp thông báo từ cơ sở dữ liệu…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#40484e] bg-white rounded-xl border border-[#dee8ff] p-8 space-y-2">
          <Bell className="w-8 h-8 text-[#40484e] mx-auto opacity-40" />
          <p className="font-semibold text-[#111c2d]">Chưa có thông báo nào</p>
          <p>
            {currentUser 
              ? 'Các cập nhật đơn hàng và lịch đo mắt của bạn sẽ hiển thị tại đây.'
              : 'Đăng nhập tài khoản để theo dõi thông báo cá nhân hóa.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 bg-white shadow-xs ${
                item.isNew ? 'border-[#086288]' : 'border-[#dee8ff]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e7eeff] text-[#086288] flex items-center justify-center shrink-0 mt-0.5">
                  {item.type === 'LAB' ? (
                    <Package className="w-4 h-4" />
                  ) : item.type === 'REMIND' ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#111c2d]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#40484e] mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                  <span className="text-[10px] text-[#40484e] flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#086288]" />
                    {item.time}
                  </span>
                </div>
              </div>

              {item.actionTab && (
                <button
                  onClick={() => setActiveTab(item.actionTab)}
                  className="px-3 py-1.5 rounded-lg bg-[#e7eeff] hover:bg-[#dee8ff] text-[#004967] text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Xem chi tiết
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
