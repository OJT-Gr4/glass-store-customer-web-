# GlassStore Customer Web - E-Commerce Eyewear Portal

Giao diện Web bán hàng và dịch vụ khách hàng trực tuyến, xây dựng trên nền tảng **React 18**, **Vite 5**, **Tailwind CSS 3.4**, phục vụ nhu cầu mua sắm gọng kính, tròng kính, đặt lịch đo mắt và tra cứu bảo hành.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Ngôn ngữ:** JavaScript / JSX (ES6+)
- **Framework UI:** React 18.3
- **Build Tool:** Vite 5.2
- **CSS Framework:** Tailwind CSS 3.4, PostCSS, Autoprefixer
- **Icons:** Lucide React (`lucide-react`)
- **Routing:** React Router DOM 6.23
- **HTTP Client:** Axios 1.7 (Giao tiếp với API Gateway)

---

## 2. Bảng Màu Chuẩn Của Hệ Thống (Design System & Color Palette)

Toàn bộ giao diện được chuẩn hóa theo bảng màu nhận diện thương hiệu GlassStore:

| Tên màu | Mã HEX | Giá trị RGB | Ứng dụng trong giao diện |
| :--- | :---: | :---: | :--- |
| **Primary Dark** | `#086288` | `rgb(8, 98, 136)` | Màu chủ đạo: Header, Nút chính (CTA), Icon thương hiệu, Tiêu đề nổi bật |
| **Ocean Blue** | `#4D8DBA` | `rgb(77, 141, 186)` | Màu phụ: Hover buttons, đường viền active, icon phụ |
| **Sky Accent** | `#97D7FF` | `rgb(151, 215, 255)` | Màu sáng: Tag, đường viền card, highlight văn bản, hiệu ứng glow |
| **Warm Cream** | `#FFEFC4` | `rgb(255, 239, 196)` | Màu ấm: Badge thương hiệu, nhãn ưu đãi, background điểm nhấn |

> **Cấu hình Tailwind (`tailwind.config.js`):** Sử dụng các class `bg-[#086288]`, `text-[#086288]`, `bg-[#FFEFC4]`, `text-[#4D8DBA]`, hoặc alias `bg-brand-dark`, `text-brand-blue`...

---

## 3. Cấu trúc thư mục mã nguồn

```text
customer-web/
├── public/                 # Static assets (favicon, logo, icons)
├── src/
│   ├── api/                # Cấu hình Axios instance & API services (products, cart, auth)
│   ├── assets/             # Hình ảnh banners, mock images
│   ├── components/         # Reusable Components (Header, Footer, ProductCard, FilterSidebar)
│   ├── context/            # React Context (AuthContext, CartContext)
│   ├── pages/              # Màn hình chính
│   │   ├── Home/           # Trang chủ (Banner, Sản phẩm nổi bật, Khuyến mãi)
│   │   ├── Products/       # Danh mục sản phẩm & Bộ lọc thông minh
│   │   ├── ProductDetail/  # Chi tiết gọng kính / tròng kính kèm chọn độ cận
│   │   ├── Cart/           # Giỏ hàng & Áp dụng voucher
│   │   ├── Checkout/       # Đặt hàng, chọn hình thức giao hàng, thanh toán VietQR
│   │   ├── Booking/        # Đặt lịch đo mắt tại chi nhánh cửa hàng
│   │   └── Profile/        # Hồ sơ cá nhân, lịch sử đơn hàng, đơn kính thuốc cũ
│   ├── routes/             # Cấu hình AppRoutes
│   ├── App.jsx             # Root Component
│   ├── index.css           # Cấu hình Tailwind Directives (@tailwind base...)
│   └── main.jsx            # Entry point
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js      # Cấu hình bảng màu và breakpoints Tailwind
└── vite.config.js
```

---

## 3. Yêu cầu môi trường (Prerequisites)

- **Node.js:** 18.x hoặc 20.x trở lên (khuyến nghị Node LTS)
- **NPM:** 9.x hoặc 10.x (hoặc Yarn / PNPM)

---

## 4. Cấu hình biến môi trường

Tạo file `.env` tại thư mục gốc của project (nếu cần thay đổi cổng Backend):

| Tên biến | Giá trị mặc định | Mô tả |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Địa chỉ API Gateway Backend |

---

## 5. Hướng dẫn khởi chạy (Getting Started)

### Cài đặt dependencies:
```bash
npm install
```

### Khởi chạy môi trường phát triển (Dev Mode):
```bash
npm run dev
```
Giao diện mặc định chạy tại địa chỉ: `http://localhost:5173`

### Đóng gói ứng dụng (Production Build):
```bash
npm run build
```
Mã nguồn sau khi tối ưu được sinh ra tại thư mục: `dist/`

---

## 6. Danh sách màn hình & Luồng nghiệp vụ chính

| Đường dẫn (Route) | Tên màn hình | Nghiệp vụ theo SRS |
| :--- | :--- | :--- |
| `/` | Trang chủ | Hiển thị sản phẩm mới, gọng kính nổi bật, thương hiệu đối tác |
| `/products` | Danh mục & Tìm kiếm | Lọc theo giá, màu sắc, dáng gọng (Vuông, Tròn, Aviator), chất liệu (Titan, Nhựa) |
| `/products/:id` | Chi tiết sản phẩm | Chọn màu/size; hỗ trợ mua riêng gọng hoặc mua kèm tròng theo số đo |
| `/cart` | Giỏ hàng | Cập nhật số lượng, kiểm tra tồn kho khả dụng, tính tạm tính |
| `/checkout` | Thanh toán đơn hàng | Nhập địa chỉ, chọn thanh toán COD hoặc Quét mã VietQR tự động |
| `/booking` | Đặt lịch đo mắt | Đặt lịch hẹn đo thị lực tại chi nhánh gần nhất |
| `/orders` | Lịch sử & Bảo hành | Theo dõi tiến độ đơn hàng và tra cứu bảo hành theo SĐT |

---

## 7. Quy tắc Git & Phân nhánh (Git Workflow)

1. Nhánh `main`: Dành riêng cho bản phát hành chính thức, không commit trực tiếp.
2. Nhánh `dev`: Nhánh làm việc chung. Khi bắt đầu tính năng mới:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/<ten-tinh-nang>
   ```
3. Commit thông điệp rõ ràng: `git commit -m "feat(cart): add prescription selection when adding frame to cart"`.
4. Push lên GitHub và tạo Pull Request merge vào `dev`.
