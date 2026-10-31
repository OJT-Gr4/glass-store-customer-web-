# 👓 GlassStore Customer Web (Storefront Bán Lẻ Kính Mắt)

Ứng dụng web dành cho khách hàng đặt mua kính mắt, tra cứu thông số tròng kính và đặt lịch khám mắt trực tuyến.

---

## 🎨 Bảng Màu Chuẩn (Official Palette)

Tất cả thành viên trong nhóm code UI phải tuân thủ bảng màu chính thức:

| Tên Màu | Mã HEX | RGB | Ứng Dụng |
| :--- | :--- | :--- | :--- |
| **Primary Dark** | `#086288` | `rgb(8, 98, 136)` | Nút chính, Header, Tiêu đề, Giá bán |
| **Ocean Blue** | `#4D8DBA` | `rgb(77, 141, 186)` | Nút Hover, Tag phân loại, viền active |
| **Sky Accent** | `#97D7FF` | `rgb(151, 215, 255)` | Icon, Focus ring, chữ nổi bật trên banner tối |
| **Warm Cream** | `#FFEFC4` | `rgb(255, 239, 196)` | Tag thương hiệu, Badge số lượng giỏ hàng, Banner Sale |

> Xem chi tiết tại [DESIGN_PALETTE.md](./DESIGN_PALETTE.md).

---

## 🚀 Khởi Chạy Dự Án

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy môi trường phát triển (Port 5173)
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 🛠 Công Nghệ Sử Dụng

- **React 18** + **Vite 5**
- **Tailwind CSS v3** (Custom Brand Palette)
- **Lucide React** (Bộ icon hiện đại)
- **Axios** (Kết nối API Gateway `http://localhost:8080`)
