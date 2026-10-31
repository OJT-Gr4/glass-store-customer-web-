# 🎨 BẢNG MÀU CHÍNH THỨC CỦA HỆ THỐNG GLASSSTORE (STOREFRONT)

Tài liệu này quy chuẩn hệ thống màu sắc nhận diện thương hiệu cho ứng dụng khách hàng **`customer-web`**. Tất cả thành viên trong nhóm cần tuân thủ nghiêm ngặt để đảm bảo UI đồng nhất và chuyên nghiệp.

---

## 1. Bảng Màu Thương Hiệu (Brand Palette)

| Tên Màu | Mã HEX | Giá Trị RGB | Ý Nghĩa & Vai Trò Trong Giao Diện |
| :--- | :--- | :--- | :--- |
| **Primary Dark** | `#086288` | `rgb(8, 98, 136)` | **Màu chủ đạo chính**: Nút bấm chính (Primary Button), tiêu đề lớn, giá sản phẩm, logo, banner gradient. |
| **Ocean Blue** | `#4D8DBA` | `rgb(77, 141, 186)` | **Màu phụ**: Trạng thái hover của nút bấm, nhãn phân loại phụ, đường viền active. |
| **Sky Accent** | `#97D7FF` | `rgb(151, 215, 255)` | **Màu điểm nhấn sáng**: Icon nhận diện, viền focus input, chữ nổi bật trên nền tối. |
| **Warm Cream** | `#FFEFC4` | `rgb(255, 239, 196)` | **Màu kem ấm áp**: Tag thương hiệu (Bolon, Gentle Monster...), tag khuyến mãi, badge giỏ hàng. |

---

## 2. Màu Bổ Trợ Chuẩn (Neutrals)

- **Nền trang chính**: `#f8fafc` (Slate 50)
- **Nền card trắng**: `#ffffff` (White)
- **Màu chữ chính**: `#0f172a` (Slate 900) hoặc `#1e293b` (Slate 800)
- **Màu chữ phụ / chú thích**: `#64748b` (Slate 500)
- **Đường viền ngăn cách**: `#e2e8f0` (Slate 200)

---

## 3. Cấu Hình Tailwind CSS (`tailwind.config.js`)

Các class màu đã được định nghĩa sẵn trong Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#086288',    // Deep Ocean Blue
          blue: '#4D8DBA',    // Medium Ocean Blue
          sky: '#97D7FF',     // Light Sky
          cream: '#FFEFC4',   // Warm Cream
        }
      }
    }
  }
}
```

### Cách dùng trong JSX:
```jsx
// Nút bấm chính
<button className="bg-[#086288] hover:bg-[#4D8DBA] text-white font-bold py-2 px-4 rounded-xl">
  Mua Ngay
</button>

// Tag thương hiệu kem ấm
<span className="bg-[#FFEFC4] text-[#086288] font-bold text-xs px-2.5 py-1 rounded-full">
  Gentle Monster
</span>

// Giá tiền nổi bật
<span className="text-xl font-black text-[#086288]">
  1.850.000 ₫
</span>
```

---

## 4. Biến CSS Toàn Cục (CSS Variables)

```css
:root {
  --color-brand-dark: #086288;
  --color-brand-blue: #4D8DBA;
  --color-brand-sky: #97D7FF;
  --color-brand-cream: #FFEFC4;
  --color-bg-light: #f8fafc;
  --color-text-main: #0f172a;
}
```
