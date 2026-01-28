# Hướng dẫn tạo dữ liệu mẫu để test chức năng đặt phòng

## Tóm tắt

Để test chức năng đặt phòng, bạn cần có 3 loại dữ liệu:
1. **Room Types** (Loại phòng) - 3 loại
2. **Rooms** (Phòng cụ thể) - 20 phòng  
3. **Customers** (Khách hàng) - 8 khách hàng

Hotel ID: `hqjikjkTipom9MMBFlxB`

## Cách 1: Sử dụng trang Seed Data (Đơn giản nhất)

1. Thêm route vào `src/App.tsx`:
```tsx
import { SeedDataPage } from './pages/SeedDataPage';

// Trong routes:
<Route path="/seed-data" element={<SeedDataPage />} />
```

2. Đăng nhập vào app
3. Truy cập: `http://localhost:5173/seed-data`
4. Click nút "Tạo dữ liệu mẫu"
5. Đợi hoàn thành và kiểm tra console

## Cách 2: Tạm thời mở Firestore Rules (Nhanh nhất)

### Bước 1: Mở Firestore Rules

Sửa file `firestore.rules`, thêm vào cuối file (trước dấu `}`):

```javascript
// TEMPORARY: Allow write for seeding data
match /roomTypes/{roomTypeId} {
  allow read, write: if true;
}

match /rooms/{roomId} {
  allow read, write: if true;
}

match /customers/{customerId} {
  allow read, write: if true;
}
```

### Bước 2: Deploy rules

```bash
firebase deploy --only firestore:rules
```

### Bước 3: Chạy script

```bash
npm run seed:reservation
```

### Bước 4: Đổi lại rules (QUAN TRỌNG!)

Xóa phần code đã thêm ở bước 1 và deploy lại:

```bash
firebase deploy --only firestore:rules
```

## Cách 3: Thêm thủ công qua Firebase Console

### Bước 1: Tạo Room Types

Vào Firebase Console > Firestore > Tạo collection `roomTypes`

**Document 1: Standard Room**
```
hotelId: "hqjikjkTipom9MMBFlxB"
name: "Standard Room"
description: {
  en: "Comfortable standard room with basic amenities"
  vi: "Phòng tiêu chuẩn thoải mái với tiện nghi cơ bản"
}
basePrice: 500000
capacity: 2
amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar"]
createdAt: [timestamp - click "Set to current time"]
updatedAt: [timestamp - click "Set to current time"]
```

**Document 2: Deluxe Room**
```
hotelId: "hqjikjkTipom9MMBFlxB"
name: "Deluxe Room"
description: {
  en: "Spacious deluxe room with premium amenities"
  vi: "Phòng deluxe rộng rãi với tiện nghi cao cấp"
}
basePrice: 800000
capacity: 3
amenities: ["WiFi", "Smart TV", "Air Conditioning", "Mini Bar", "Bathtub", "City View"]
weekdayPricing: {
  friday: 900000
  saturday: 950000
  sunday: 850000
}
createdAt: [timestamp]
updatedAt: [timestamp]
```

**Document 3: Suite Room**
```
hotelId: "hqjikjkTipom9MMBFlxB"
name: "Suite Room"
description: {
  en: "Luxurious suite with separate living area"
  vi: "Suite sang trọng với khu vực sinh hoạt riêng"
}
basePrice: 1500000
capacity: 4
amenities: ["WiFi", "Smart TV", "Air Conditioning", "Mini Bar", "Jacuzzi", "Ocean View", "Living Room"]
weekdayPricing: {
  friday: 1800000
  saturday: 2000000
  sunday: 1600000
}
seasonalPricing: [
  {
    startDate: "2026-06-01"
    endDate: "2026-08-31"
    price: 2200000
  },
  {
    startDate: "2026-12-20"
    endDate: "2027-01-05"
    price: 2500000
  }
]
createdAt: [timestamp]
updatedAt: [timestamp]
```

### Bước 2: Lấy Room Type IDs

Sau khi tạo xong 3 room types, copy Document ID của từng loại:
- Standard Room ID: `_______________`
- Deluxe Room ID: `_______________`
- Suite Room ID: `_______________`

### Bước 3: Tạo Rooms

Tạo collection `rooms` với 20 documents:

**Standard Rooms (8 phòng):**
```
// Room 101
hotelId: "hqjikjkTipom9MMBFlxB"
roomNumber: "101"
roomTypeId: "[STANDARD_ROOM_ID]"
floor: 1
status: "vacant"
createdAt: [timestamp]
updatedAt: [timestamp]

// Tương tự cho: 102, 103, 104, 105, 201, 202, 203
```

**Deluxe Rooms (7 phòng):**
```
// Room 204
hotelId: "hqjikjkTipom9MMBFlxB"
roomNumber: "204"
roomTypeId: "[DELUXE_ROOM_ID]"
floor: 2
status: "vacant"
createdAt: [timestamp]
updatedAt: [timestamp]

// Tương tự cho: 205, 206, 301, 302, 303, 304
```

**Suite Rooms (5 phòng):**
```
// Room 305
hotelId: "hqjikjkTipom9MMBFlxB"
roomNumber: "305"
roomTypeId: "[SUITE_ROOM_ID]"
floor: 3
status: "vacant"
createdAt: [timestamp]
updatedAt: [timestamp]

// Tương tự cho: 306, 401, 402, 403
```

### Bước 4: Tạo Customers

Tạo collection `customers` với 8 documents:

```
// Customer 1
hotelId: "hqjikjkTipom9MMBFlxB"
name: "Nguyễn Văn An"
email: "nguyenvanan@example.com"
phone: "0901234567"
address: "123 Đường Lê Lợi, Quận 1, TP.HCM"
nationality: "Vietnam"
idNumber: "001234567890"
preferences: "Phòng tầng cao, view đẹp"
createdAt: [timestamp]
updatedAt: [timestamp]

// Customer 2
hotelId: "hqjikjkTipom9MMBFlxB"
name: "Trần Thị Bình"
email: "tranthibinh@example.com"
phone: "0912345678"
address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM"
nationality: "Vietnam"
idNumber: "001234567891"
preferences: "Không hút thuốc"
createdAt: [timestamp]
updatedAt: [timestamp]

// Thêm 6 customers nữa (xem file scripts/sample-data.json)
```

## Sau khi tạo xong dữ liệu

1. Vào trang **Reservations**
2. Click **"Create Reservation"**
3. Test các tính năng:
   - Chọn khách hàng
   - Chọn loại phòng
   - Chọn ngày check-in/check-out
   - Xem danh sách phòng trống
   - Xem tính toán giá tự động (weekday/seasonal pricing)
   - Tạo đặt phòng
   - Edit đặt phòng (chỉ với status pending/confirmed)
   - Cancel đặt phòng

## Troubleshooting

**Lỗi "Permission Denied":**
- Kiểm tra bạn đã đăng nhập chưa
- Kiểm tra user có quyền truy cập hotel `hqjikjkTipom9MMBFlxB` không (trong collection `hotelUsers`)
- Tạm thời mở Firestore rules như Cách 2

**Không thấy dữ liệu trong app:**
- Kiểm tra hotel ID có đúng không
- Refresh trang
- Kiểm tra console có lỗi không

**Script chạy nhưng không tạo được dữ liệu:**
- Kiểm tra Firebase config trong `.env`
- Kiểm tra Firestore rules
- Xem chi tiết lỗi trong console
