import React from 'react';
import { Eye, Phone, ShieldCheck, MapPin, Clock, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#f0f3ff]/60 text-[#40484e] border-t border-[#e7eeff] mt-auto">
      {/* 4 Main Columns */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs leading-relaxed">
        {/* Col 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#086288] text-white flex items-center justify-center shadow-xs">
              <Eye className="w-4 h-4 text-[#cae6ff]" />
            </div>
            <div>
              <span className="text-base text-[#004967] font-bold block leading-tight">OptiVision</span>
              <span className="text-[9px] text-[#19648f] tracking-wider uppercase block font-bold">Clinical &amp; Eyewear</span>
            </div>
          </div>
          <p className="text-[#40484e]">
            Hệ sinh thái khúc xạ &amp; phân phối kính mắt cao cấp kết hợp quy chuẩn lâm sàng và công nghệ quang học chính xác.
          </p>
          <div className="pt-1">
            <div className="flex items-center gap-2 text-[#111c2d] font-bold text-xs">
              <Phone className="w-4 h-4 text-[#086288]" />
              <span>Hotline CSKH: 1900 6868</span>
            </div>
            <p className="text-[11px] text-[#40484e] mt-0.5">Thời gian hỗ trợ: 08:30 - 21:30 (Cả Thứ 7 &amp; CN)</p>
          </div>
        </div>

        {/* Col 2: Policy & Support */}
        <div>
          <h4 className="font-bold text-[#111c2d] text-xs mb-3">Chính Sách &amp; Hỗ Trợ</h4>
          <ul className="space-y-2 text-[#40484e]">
            <li className="hover:text-[#086288] cursor-pointer transition">Chính sách bảo hành tròng &amp; gọng kính</li>
            <li className="hover:text-[#086288] cursor-pointer transition">Bảo hiểm độ khúc xạ 180 ngày</li>
            <li className="hover:text-[#086288] cursor-pointer transition">Đổi mới trong 7 ngày nếu không êm mắt</li>
            <li className="hover:text-[#086288] cursor-pointer transition">Chính sách vệ sinh, căn chỉnh trọn đời</li>
            <li className="hover:text-[#086288] cursor-pointer transition">Hướng dẫn đo khoảng cách đồng tử (PD)</li>
          </ul>
        </div>

        {/* Col 3: Showroom Network */}
        <div>
          <h4 className="font-bold text-[#111c2d] text-xs mb-3">Hệ Thống Chi Nhánh</h4>
          <div className="space-y-2 text-[#40484e]">
            <div>
              <p className="font-semibold text-[#111c2d]">Flagship Quận 1:</p>
              <p>88 Lê Thánh Tôn, Bến Nghé, TP.HCM</p>
            </div>
            <div>
              <p className="font-semibold text-[#111c2d]">Chi nhánh Hoàn Kiếm:</p>
              <p>24 Tràng Tiền, Hoàn Kiếm, Hà Nội</p>
            </div>
            <div>
              <p className="font-semibold text-[#111c2d]">Chi nhánh Hải Châu:</p>
              <p>102 Nguyễn Văn Linh, Đà Nẵng</p>
            </div>
          </div>
        </div>

        {/* Col 4: Clinical Eyecare Service */}
        <div>
          <h4 className="font-bold text-[#111c2d] text-xs mb-3">Dịch Vụ Đo Khám</h4>
          <p className="text-[#40484e] mb-3">
            Quy trình đo khúc xạ 12 bước tiêu chuẩn quốc tế với hệ thống máy khúc xạ kế tự động kỹ thuật số.
          </p>
          <div className="bg-white p-3 rounded-xl border border-[#dee8ff] space-y-1">
            <div className="text-[11px] font-bold text-[#086288] uppercase">Thời gian phục vụ</div>
            <div className="font-semibold text-[#111c2d] text-xs">08:30 - 21:30 (Cả Thứ 7 &amp; Chủ Nhật)</div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Khám khúc xạ miễn phí
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-[#e7eeff] py-3.5 px-4 text-center text-[11px] text-[#40484e]">
        <p>© 2026 OptiVision Clinical &amp; Eyewear Platform. Chuẩn lâm sàng - Thấu thị tinh hoa. Hotline 1900 6868.</p>
      </div>
    </footer>
  );
}
